package com.trailbuddy.controller;

import com.trailbuddy.dto.BookingDTO;
import com.trailbuddy.dto.GuideQuotationRequest;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.GuideService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

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
    private GuideRepository guideRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    /**
     * Returns true when the caller is allowed to act on the booking.
     * Admins can access any booking.
     * A traveller can only access their own booking.
     * A guide can only access a booking assigned to them.
     */
    private boolean canAccess(Booking booking, User caller) {
        boolean isAdmin = caller.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return true;

        boolean isGuide = caller.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GUIDE"));

        if (isGuide) {
            // Guide can only see bookings assigned to themselves
            Optional<Guide> guideOpt = guideRepository.findByUserId(caller.getId());
            return guideOpt.isPresent()
                    && booking.getGuide() != null
                    && booking.getGuide().getId().equals(guideOpt.get().getId());
        }

        // Traveller
        return booking.getUser() != null
                && booking.getUser().getId().equals(caller.getId());
    }

    /** Resolve the guide profile for the currently authenticated guide user. Returns empty Optional for non-guides. */
    private Optional<Guide> currentGuideProfile(User caller) {
        boolean isGuide = caller.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GUIDE"));
        if (!isGuide) return Optional.empty();
        Optional<Guide> persisted = guideRepository.findByUserId(caller.getId());
        if (persisted.isPresent()) {
            return persisted;
        }
        return Optional.ofNullable(caller.getGuide());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /bookings  – create booking
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','GUIDE')")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingDTO bookingDTO,
            Authentication authentication) {
        try {
            User caller = (User) authentication.getPrincipal();
            bookingDTO.setUserId(caller.getId());

            if (bookingDTO.getGuideId() == null) {
                return ResponseEntity.badRequest().body("GuideId is required");
            }

            boolean isAvailable = guideService.isGuideAvailable(
                    bookingDTO.getGuideId(),
                    bookingDTO.getStartDate(),
                    bookingDTO.getEndDate());

            if (!isAvailable) {
                return ResponseEntity.badRequest()
                        .body("Guide is not available for the selected dates");
            }

            Booking booking = bookingService.createBooking(bookingDTO);
            logger.info("Booking created for user={}, guide={}", caller.getId(), bookingDTO.getGuideId());
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error creating booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/user  – traveller sees only their own bookings
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Booking>> getUserBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        try {
            Pageable pageable = PageRequest.of(page, size,
                    org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.fromString(sortDir), sortBy));

            User caller = currentUser();
            Page<Booking> bookings = bookingService.getUserBookings(caller.getId(), pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching user bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/guide  – guide sees only bookings assigned to them
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/guide")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Booking>> getGuideBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        try {
            Pageable pageable = PageRequest.of(page, size,
                    org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.fromString(sortDir), sortBy));

            User caller = currentUser();
            boolean isGuide = caller.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_GUIDE"));
            if (!isGuide) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Optional<Guide> guideOpt = currentGuideProfile(caller);
            if (guideOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Page<Booking> bookings = bookingService.getGuideBookings(guideOpt.get().getId(), pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Error fetching guide bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/:id  – ownership check; 403 if caller has no access
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            User caller = currentUser();

            if (!canAccess(booking, caller)) {
                logger.warn("Access denied: user={} attempted to view booking={}", caller.getId(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have permission to view this booking");
            }

            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error fetching booking {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /bookings/:id/status  – admin only for generic status change
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam Booking.BookingStatus status,
            @RequestBody(required = false) String reason) {
        try {
            Booking booking = bookingService.updateBookingStatus(id, status, reason);
            logger.info("Admin updated booking={} to status={}", id, status);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            logger.error("Error updating booking status: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /bookings/:id/cancel  – traveller or guide can cancel their own booking
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','GUIDE','ADMIN')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Booking booking = bookingService.getBookingById(id);
            User caller = currentUser();

            if (!canAccess(booking, caller)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have permission to cancel this booking");
            }

            String reason = body != null ? (String) body.getOrDefault("reason", null) : null;
            Booking cancelled = bookingService.cancelBooking(id, reason);
            logger.info("Booking={} cancelled by user={}", id, caller.getId());
            return ResponseEntity.ok(cancelled);
        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /bookings/:id/confirm  – guide must own the booking
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/{id}/guide/quotation")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> submitGuideQuotation(
            @PathVariable Long id,
            @Valid @RequestBody GuideQuotationRequest request,
            Authentication authentication) {
        try {
            User caller = (User) authentication.getPrincipal();
            Booking updated = bookingService.submitGuideQuotation(id, request, caller);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error submitting quotation: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/quotation/accept")
    @PreAuthorize("hasAnyRole('USER','GUIDE')")
    public ResponseEntity<?> acceptQuotation(@PathVariable Long id, Authentication authentication) {
        try {
            User caller = (User) authentication.getPrincipal();
            Booking updated = bookingService.acceptQuotation(id, caller);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error accepting quotation: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/quotation/decline")
    @PreAuthorize("hasAnyRole('USER','GUIDE')")
    public ResponseEntity<?> declineQuotation(@PathVariable Long id, Authentication authentication) {
        try {
            User caller = (User) authentication.getPrincipal();
            Booking updated = bookingService.declineQuotation(id, caller);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error declining quotation: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            User caller = currentUser();

            if (!canAccess(booking, caller)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only confirm bookings assigned to you");
            }

            Booking confirmed = bookingService.confirmBooking(id);
            logger.info("Booking={} confirmed by guide user={}", id, caller.getId());
            return ResponseEntity.ok(confirmed);
        } catch (Exception e) {
            logger.error("Error confirming booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /bookings/:id/complete  – traveller or guide who owns the booking
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('GUIDE','USER')")
    public ResponseEntity<?> completeBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            User caller = currentUser();

            if (!canAccess(booking, caller)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have permission to complete this booking");
            }

            Booking completed = bookingService.completeBooking(id);
            logger.info("Booking={} completed by user={}", id, caller.getId());
            return ResponseEntity.ok(completed);
        } catch (Exception e) {
            logger.error("Error completing booking: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/check-availability  – unchanged, no booking ownership needed
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/check-availability")
    @PreAuthorize("hasAnyRole('USER','GUIDE')")
    public ResponseEntity<?> checkGuideAvailability(
            @RequestParam Long guideId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            boolean isAvailable = guideService.isGuideAvailable(guideId, startDate, endDate);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            logger.error("Error checking guide availability: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/upcoming  – filtered by caller role at DB level
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('USER','GUIDE','ADMIN')")
    public ResponseEntity<java.util.List<Booking>> getUpcomingBookings() {
        try {
            User caller = currentUser();

            boolean isAdmin = caller.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (isAdmin) {
                return ResponseEntity.ok(bookingService.getUpcomingBookings());
            }

            Optional<Guide> guideOpt = currentGuideProfile(caller);
            if (guideOpt.isPresent()) {
                return ResponseEntity.ok(
                        bookingService.getUpcomingBookingsByGuide(guideOpt.get().getId()));
            }

            // Traveller
            return ResponseEntity.ok(
                    bookingService.getUpcomingBookingsByUser(caller.getId()));
        } catch (Exception e) {
            logger.error("Error fetching upcoming bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /bookings/past  – filtered by caller role at DB level
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/past")
    @PreAuthorize("hasAnyRole('USER','GUIDE','ADMIN')")
    public ResponseEntity<java.util.List<Booking>> getPastBookings() {
        try {
            User caller = currentUser();

            boolean isAdmin = caller.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (isAdmin) {
                return ResponseEntity.ok(bookingService.getPastBookings());
            }

            Optional<Guide> guideOpt = currentGuideProfile(caller);
            if (guideOpt.isPresent()) {
                return ResponseEntity.ok(
                        bookingService.getPastBookingsByGuide(guideOpt.get().getId()));
            }

            // Traveller
            return ResponseEntity.ok(
                    bookingService.getPastBookingsByUser(caller.getId()));
        } catch (Exception e) {
            logger.error("Error fetching past bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
