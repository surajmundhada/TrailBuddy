package com.trailbuddy.service;

import com.trailbuddy.dto.BookingDTO;
import com.trailbuddy.dto.GuideQuotationRequest;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.GuideProposal;
import com.trailbuddy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    Booking createBooking(BookingDTO bookingDTO);
    Booking updateBooking(Long id, BookingDTO bookingDTO);
    Booking getBookingById(Long id);
    void deleteBooking(Long id);
    Page<Booking> getBookingsForUser(User user, Pageable pageable);
    Page<Booking> getUserBookings(Long userId, Pageable pageable);
    Page<Booking> getGuideBookings(Long guideId, Pageable pageable);
    List<Booking> getAllBookings();
    Booking completeBooking(Long id);

    // Status mutations
    Booking updateBookingStatus(Long id, Booking.BookingStatus status, String reason);
    Booking cancelBooking(Long id, String reason);
    Booking confirmBooking(Long id);

    // Unfiltered (admin)
    List<Booking> getUpcomingBookings();
    List<Booking> getPastBookings();

    // Role-scoped (filtered at DB level)
    List<Booking> getUpcomingBookingsByUser(Long userId);
    List<Booking> getUpcomingBookingsByGuide(Long guideId);
    List<Booking> getPastBookingsByUser(Long userId);
    List<Booking> getPastBookingsByGuide(Long guideId);

    Booking submitGuideQuotation(Long bookingId, GuideQuotationRequest request, User guideUser);

    Booking acceptQuotation(Long bookingId, User traveler);

    Booking declineQuotation(Long bookingId, User traveler);

    Booking createBookingFromProposal(GuideProposal proposal, User traveler);
}
