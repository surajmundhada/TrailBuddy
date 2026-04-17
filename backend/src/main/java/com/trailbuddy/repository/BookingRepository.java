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
    // ── User-scoped queries ────────────────────────────────────────────────────

    /**
     * Returns only bookings that belong to the given user.
     * Uses explicit JPQL to traverse b.user.id because {@code user} is a
     * @ManyToOne relationship — no direct {@code userId} field exists on Booking.
     */
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId")
    Page<Booking> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.user.id = :userId")
    Optional<Booking> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status")
    List<Booking> findByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") Booking.BookingStatus status);

    // ── Guide-scoped queries ───────────────────────────────────────────────────

    /**
     * Returns only bookings assigned to the given guide.
     * Uses explicit JPQL to traverse b.guide.id for the same reason.
     */
    @Query("SELECT b FROM Booking b WHERE b.guide.id = :guideId")
    Page<Booking> findByGuideId(@Param("guideId") Long guideId, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.guide.user.id = :guideUserId")
    Page<Booking> findByGuideUserId(@Param("guideUserId") Long guideUserId, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.guide.id = :guideId")
    Optional<Booking> findByIdAndGuideId(@Param("id") Long id, @Param("guideId") Long guideId);

    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.guide.user.id = :guideUserId")
    Optional<Booking> findByIdAndGuideUserId(@Param("id") Long id, @Param("guideUserId") Long guideUserId);

    @Query("SELECT b FROM Booking b WHERE b.guide.id = :guideId AND b.status = :status")
    List<Booking> findByGuideIdAndStatus(
            @Param("guideId") Long guideId,
            @Param("status") Booking.BookingStatus status);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.user.id = :travelerId
          AND b.guide.user.id = :guideUserId
    """)
    boolean existsChatRelationship(
            @Param("travelerId") Long travelerId,
            @Param("guideUserId") Long guideUserId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :travelerId
          AND b.guide.user.id = :guideUserId
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findChatBookings(
            @Param("travelerId") Long travelerId,
            @Param("guideUserId") Long guideUserId,
            Pageable pageable);

    // ── Status / misc ──────────────────────────────────────────────────────────

    List<Booking> findByStatus(Booking.BookingStatus status);
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
