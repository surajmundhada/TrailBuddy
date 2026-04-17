package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.dto.BookingDTO;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideRepository guideRepository;

    // Percentage value (e.g. 15 means 15%)
    @Value("${platform.commission.percentage:15}")
    private BigDecimal commissionPercentage;

    @Override
    public Booking createBooking(BookingDTO bookingDTO) {
        if (bookingDTO.getUserId() == null || bookingDTO.getGuideId() == null) {
            throw new RuntimeException("Missing userId/guideId for booking");
        }
        if (bookingDTO.getStartDate() == null || bookingDTO.getEndDate() == null) {
            throw new RuntimeException("Missing startDate/endDate for booking");
        }
        if (bookingDTO.getAmount() == null) {
            throw new RuntimeException("Missing amount for booking");
        }

        User user = userRepository.findById(bookingDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Guide guide = guideRepository.findById(bookingDTO.getGuideId())
                .orElseThrow(() -> new RuntimeException("Guide not found"));

        // Enforce non-overlapping bookings at service layer as well (defense in depth).
        List<Booking.BookingStatus> activeStatuses = new ArrayList<>();
        activeStatuses.add(Booking.BookingStatus.PENDING);
        activeStatuses.add(Booking.BookingStatus.CONFIRMED);
        activeStatuses.add(Booking.BookingStatus.COMPLETED);
        boolean overlap = bookingRepository.existsOverlappingBooking(
                guide.getId(),
                bookingDTO.getStartDate(),
                bookingDTO.getEndDate(),
                activeStatuses
        );
        if (overlap) {
            throw new RuntimeException("Guide is already booked for overlapping dates");
        }

        BigDecimal totalAmount = BigDecimal.valueOf(bookingDTO.getAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal feeRate = commissionPercentage.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        BigDecimal platformFee = totalAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setGuide(guide);
        booking.setStartDate(bookingDTO.getStartDate());
        booking.setEndDate(bookingDTO.getEndDate());
        booking.setTotalAmount(totalAmount);
        booking.setPlatformFee(platformFee);
        booking.setGuideEarnings(guideEarnings);
        booking.setStatus(Booking.BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    @Override
    public Booking updateBooking(Long id, BookingDTO bookingDTO) {
        Booking booking = getBookingById(id);
        booking.setStartDate(bookingDTO.getStartDate());
        booking.setEndDate(bookingDTO.getEndDate());
        booking.setTotalAmount(new java.math.BigDecimal(bookingDTO.getAmount().toString()));
        booking.setStatus(Booking.BookingStatus.valueOf(bookingDTO.getStatus()));
        return bookingRepository.save(booking);
    }

    @Override
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    @Override
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    @Override
    public Page<Booking> getUserBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable);
    }

    @Override
    public Page<Booking> getGuideBookings(Long guideId, Pageable pageable) {
        return bookingRepository.findByGuideId(guideId, pageable);
    }

    @Override
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Override
    public Booking completeBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    @Override
    public Booking updateBookingStatus(Long id, Booking.BookingStatus status, String reason) {
        Booking booking = getBookingById(id);
        Booking.BookingStatus prev = booking.getStatus();
        booking.setStatus(status);
        if (reason != null) {
            booking.setCancellationReason(reason);
        }
        // Update guide stats when status changes to confirmed/completed.
        if (booking.getGuide() != null && prev != status) {
            Guide guide = booking.getGuide();
            if (status == Booking.BookingStatus.CONFIRMED || status == Booking.BookingStatus.COMPLETED) {
                guide.setTotalBookings((guide.getTotalBookings() == null ? 0 : guide.getTotalBookings()) + 1);
                guideRepository.save(guide);
            }
        }
        return bookingRepository.save(booking);
    }

    @Override
    public Booking cancelBooking(Long id, String reason) {
        Booking booking = getBookingById(id);
        Booking.BookingStatus prev = booking.getStatus();
        // Cancellation policy (simple):
        // - If cancelled on/after start date => 50% fee
        // - Otherwise => 10% fee
        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        LocalDate today = LocalDate.now();
        boolean late = booking.getStartDate() != null && !today.isBefore(booking.getStartDate());
        BigDecimal feeRate = late ? new BigDecimal("0.50") : new BigDecimal("0.10");
        BigDecimal cancellationFee = total.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        // Store fee in specialRequirements field (keeps schema stable); frontend receipt will display it.
        String existing = booking.getSpecialRequirements();
        String feeLine = "cancellationFee=" + cancellationFee;
        booking.setSpecialRequirements(existing == null || existing.isBlank() ? feeLine : existing + "\n" + feeLine);

        // If booking was previously confirmed/completed, decrement guide totalBookings best-effort.
        if (booking.getGuide() != null && (prev == Booking.BookingStatus.CONFIRMED || prev == Booking.BookingStatus.COMPLETED)) {
            Guide guide = booking.getGuide();
            int current = guide.getTotalBookings() == null ? 0 : guide.getTotalBookings();
            guide.setTotalBookings(Math.max(0, current - 1));
            guideRepository.save(guide);
        }
        return bookingRepository.save(booking);
    }

    @Override
    public Booking confirmBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    @Override
    public List<Booking> getUpcomingBookings() {
        return bookingRepository.findByStatus(Booking.BookingStatus.CONFIRMED);
    }

    @Override
    public List<Booking> getPastBookings() {
        return bookingRepository.findByStatus(Booking.BookingStatus.COMPLETED);
    }
}
