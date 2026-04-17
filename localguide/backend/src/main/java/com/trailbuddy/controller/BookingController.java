package com.trailbuddy.controller;

import com.trailbuddy.dto.BookingDTO;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.GuideService;
import com.trailbuddy.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @Autowired
    private GuideService guideService;

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','GUIDE')")
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingDTO bookingDTO, Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            bookingDTO.setUserId(currentUser.getId());

            if (bookingDTO.getGuideId() == null) {
                return ResponseEntity.badRequest().body("GuideId is required");
            }

            // Check if guide is available
            boolean isAvailable = guideService.isGuideAvailable(
                bookingDTO.getGuideId(), 
                bookingDTO.getStartDate(), 
                bookingDTO.getEndDate()
            );
            
            if (!isAvailable) {
                return ResponseEntity.badRequest().body("Guide is not available for the selected dates");
            }

            Booking booking = bookingService.createBooking(bookingDTO);
            logger.info("Booking created successfully for user: {}, guide: {}", 
                       bookingDTO.getUserId(), bookingDTO.getGuideId());
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error creating booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user")
    // Any authenticated user can view their own bookings.
    // Role gating here caused 401/403 cascades when authorities aren't attached correctly.
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Booking>> getUserBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, 
                org.springframework.data.domain.Sort.by(
                    org.springframework.data.domain.Sort.Direction.fromString(sortDir), 
                    sortBy
                ));
            
            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            
            Page<Booking> bookings = bookingService.getUserBookings(user.getId(), pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching user bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/guide")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<Page<Booking>> getGuideBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, 
                org.springframework.data.domain.Sort.by(
                    org.springframework.data.domain.Sort.Direction.fromString(sortDir), 
                    sortBy
                ));
            
            // Get current user from security context - guides are also users
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            
            // Use user ID as guide ID for now (in real app, would lookup guide by user ID)
            Page<Booking> bookings = bookingService.getGuideBookings(user.getId(), pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching guide bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE', 'ADMIN')")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            if (booking != null) {
                return ResponseEntity.ok(booking);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching booking {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE', 'ADMIN')")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id, 
            @RequestParam Booking.BookingStatus status,
            @RequestBody(required = false) String reason
    ) {
        try {
            Booking booking = bookingService.updateBookingStatus(id, status, reason);
            logger.info("Booking status updated to {} for booking: {}", status, id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error updating booking status: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id, 
            @RequestBody(required = false) Map<String, Object> body
    ) {
        try {
            String cancellationReason = body != null ? (String) body.getOrDefault("reason", null) : null;
            Booking booking = bookingService.cancelBooking(id, cancellationReason);
            logger.info("Booking cancelled: {}", id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.confirmBooking(id);
            logger.info("Booking confirmed: {}", id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error confirming booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('GUIDE', 'USER')")
    public ResponseEntity<?> completeBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.completeBooking(id);
            logger.info("Booking completed: {}", id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error completing booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/check-availability")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> checkGuideAvailability(
            @RequestParam Long guideId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            boolean isAvailable = guideService.isGuideAvailable(guideId, startDate, endDate);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            logger.error("Error checking guide availability: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<java.util.List<Booking>> getUpcomingBookings() {
        try {
            java.util.List<Booking> bookings = bookingService.getUpcomingBookings();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching upcoming bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/past")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<java.util.List<Booking>> getPastBookings() {
        try {
            java.util.List<Booking> bookings = bookingService.getPastBookings();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching past bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
