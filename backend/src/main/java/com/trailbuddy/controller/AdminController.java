package com.trailbuddy.controller;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Payment;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.GuideStage;
import com.trailbuddy.service.GuideService;
import com.trailbuddy.service.UserService;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.PaymentRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.util.GuideStageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private GuideService guideService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboard() {
        long activeUsers = userService.countActiveUsers();
        long activeGuides = userService.countActiveGuides();
        long totalBookings = bookingRepository.count();
        BigDecimal totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() != null && p.getPaymentStatus() == Payment.PaymentStatus.COMPLETED)
                .map(Payment::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
                "activeUsers", activeUsers,
                "activeGuides", activeGuides,
                "totalBookings", totalBookings,
                "revenue", totalRevenue
        ));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userRepository.findAll(pageable));
    }

    @GetMapping("/guides")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Guide>> getGuides(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        List<Guide> all = guideRepository.findAll();
        all.sort((a, b) -> {
            int rankA = stageRank(a);
            int rankB = stageRank(b);
            if (rankA != rankB) return Integer.compare(rankA, rankB);
            // Within tier, keep higher rated guides first.
            BigDecimal ra = a.getAverageRating() != null ? a.getAverageRating() : BigDecimal.ZERO;
            BigDecimal rb = b.getAverageRating() != null ? b.getAverageRating() : BigDecimal.ZERO;
            int cmp = rb.compareTo(ra);
            if (cmp != 0) return cmp;
            return Long.compare(a.getId(), b.getId());
        });

        int fromIndex = Math.max(0, page * size);
        int toIndex = Math.min(all.size(), fromIndex + size);
        List<Guide> content = fromIndex >= all.size() ? List.of() : all.subList(fromIndex, toIndex);

        return ResponseEntity.ok(new PageImpl<>(content, pageable, all.size()));
    }

    @GetMapping("/guides/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Guide>> getPendingGuides() {
        return ResponseEntity.ok(guideRepository.findPendingVerificationQueue());
    }

    private int stageRank(Guide guide) {
        if (guide == null) return 2;
        int tripsCompleted = (int) bookingRepository.countByGuide_IdAndStatus(guide.getId(), Booking.BookingStatus.COMPLETED);
        BigDecimal earnings = bookingRepository.sumGuideEarningsByGuideId(
                guide.getId(),
                Arrays.asList(Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.COMPLETED)
        );
        BigDecimal rating = guide.getAverageRating() != null ? guide.getAverageRating() : BigDecimal.ZERO;
        int reviews = guide.getTotalReviews() != null ? guide.getTotalReviews() : 0;

        GuideStage stage = GuideStageUtil.getGuideStage(tripsCompleted, earnings, rating, reviews);
        return switch (stage) {
            case ELITE -> 0;
            case PRO -> 1;
            case BEGINNER -> 2;
        };
    }

    @PostMapping("/guides/{guideId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveGuide(@PathVariable Long guideId) {
        Guide updated = guideService.approveGuide(guideId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/guides/{guideId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectGuide(@PathVariable Long guideId, @RequestBody(required = false) Map<String, Object> body) {
        String reason = body != null ? (String) body.getOrDefault("reason", null) : null;
        Guide updated = guideService.rejectGuide(guideId, reason);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Booking>> getBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookingRepository.findAll(pageable));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        // Basic revenue computation (demo).
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        BigDecimal total = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() != null && p.getPaymentStatus() == Payment.PaymentStatus.COMPLETED)
                .filter(p -> p.getPaymentDate() != null && !p.getPaymentDate().isBefore(start) && !p.getPaymentDate().isAfter(end))
                .map(Payment::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of("revenue", total));
    }
}

