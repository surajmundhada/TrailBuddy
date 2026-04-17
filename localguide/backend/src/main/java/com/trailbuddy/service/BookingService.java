package com.trailbuddy.service;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.dto.BookingDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    Booking createBooking(BookingDTO bookingDTO);
    Booking updateBooking(Long id, BookingDTO bookingDTO);
    Booking getBookingById(Long id);
    void deleteBooking(Long id);
    Page<Booking> getUserBookings(Long userId, Pageable pageable);
    Page<Booking> getGuideBookings(Long guideId, Pageable pageable);
    List<Booking> getAllBookings();
    Booking completeBooking(Long id);
    
    // Additional methods needed by controllers
    Booking updateBookingStatus(Long id, Booking.BookingStatus status, String reason);
    Booking cancelBooking(Long id, String reason);
    Booking confirmBooking(Long id);
    List<Booking> getUpcomingBookings();
    List<Booking> getPastBookings();
}
