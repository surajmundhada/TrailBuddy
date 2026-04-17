package com.trailbuddy.repository;

import com.trailbuddy.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findByUserId(Long userId, Pageable pageable);
    Page<Booking> findByGuideId(Long guideId, Pageable pageable);
    List<Booking> findByStatus(Booking.BookingStatus status);
    List<Booking> findByUserIdAndStatus(Long userId, Booking.BookingStatus status);
    List<Booking> findByGuideIdAndStatus(Long guideId, Booking.BookingStatus status);
    Optional<Booking> findByRazorpayOrderId(String razorpayOrderId);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.guide.id = :guideId
          AND b.status IN :activeStatuses
          AND b.startDate <= :endDate
          AND b.endDate >= :startDate
    """)
    boolean existsOverlappingBooking(
            @Param("guideId") Long guideId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("activeStatuses") List<Booking.BookingStatus> activeStatuses
    );

    long countByGuide_IdAndStatus(Long guideId, Booking.BookingStatus status);

    /**
     * Earnings from confirmed/completed bookings (excludes cancelled/refunded).
     */
    @Query("""
            SELECT COALESCE(SUM(b.guideEarnings), 0) FROM Booking b
            WHERE b.guide.id = :guideId AND b.status IN :statuses
            """)
    BigDecimal sumGuideEarningsByGuideId(
            @Param("guideId") Long guideId,
            @Param("statuses") List<Booking.BookingStatus> statuses);
}
