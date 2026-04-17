package com.trailbuddy.controller;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Payment;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.GuideService;
import com.trailbuddy.service.UserService;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.PaymentRepository;
import com.trailbuddy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

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
        return ResponseEntity.ok(guideRepository.findAll(pageable));
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

