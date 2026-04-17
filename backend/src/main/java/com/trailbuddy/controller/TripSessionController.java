package com.trailbuddy.controller;

import com.trailbuddy.dto.*;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.TripSessionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trip-sessions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TripSessionController {

    private static final Logger logger = LoggerFactory.getLogger(TripSessionController.class);

    @Autowired
    private TripSessionService tripSessionService;

    @GetMapping("/by-booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTripSession(@PathVariable Long bookingId, Authentication authentication) {
        try {
            User viewer = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.getTripSessionForViewer(bookingId, viewer));
        } catch (Exception e) {
            logger.error("Failed to load trip session for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/guide/start-journey")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> startGuideJourney(@PathVariable Long bookingId, Authentication authentication) {
        try {
            User guideUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.guideStartJourney(bookingId, guideUser));
        } catch (Exception e) {
            logger.error("Failed to mark guide en route for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/guide/arrived")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> markGuideArrived(@PathVariable Long bookingId, Authentication authentication) {
        try {
            User guideUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.guideArrived(bookingId, guideUser));
        } catch (Exception e) {
            logger.error("Failed to mark guide arrived for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/guide/verify-otp")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> verifyGuideOtp(
            @PathVariable Long bookingId,
            @RequestBody @Valid OtpVerificationRequest request,
            Authentication authentication
    ) {
        try {
            User guideUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.verifyGuideOtp(bookingId, guideUser, request.getOtp()));
        } catch (Exception e) {
            logger.error("Failed OTP verification for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/user/start-trip")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> startTrip(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        try {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.startTrip(bookingId, user));
        } catch (Exception e) {
            logger.error("Failed to start trip for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/location")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateLocation(
            @PathVariable Long bookingId,
            @RequestBody @Valid TripLocationUpdateRequest request,
            Authentication authentication
    ) {
        try {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.updateLocation(bookingId, user, request));
        } catch (Exception e) {
            logger.error("Failed to update location for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/sos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> triggerSos(
            @PathVariable Long bookingId,
            @RequestBody @Valid SosRequest request,
            Authentication authentication
    ) {
        try {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.triggerSos(bookingId, user, request));
        } catch (Exception e) {
            logger.error("Failed to trigger SOS for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/by-booking/{bookingId}/end-trip")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> endTrip(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        try {
            User actor = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.completeTrip(bookingId, actor));
        } catch (Exception e) {
            logger.error("Failed to complete trip for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/by-booking/{bookingId}/experiences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTripExperienceUnlockCards(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        try {
            User viewer = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.getTripExperienceUnlockCards(bookingId, viewer));
        } catch (Exception e) {
            logger.error("Failed to load trip experience cards for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/by-booking/{bookingId}/timeline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTimeline(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        try {
            User viewer = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.getTripTimeline(bookingId, viewer));
        } catch (Exception e) {
            logger.error("Failed to load trip timeline for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/by-booking/{bookingId}/post-trip")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPostTrip(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        try {
            User viewer = (User) authentication.getPrincipal();
            return ResponseEntity.ok(tripSessionService.getPostTripData(bookingId, viewer));
        } catch (Exception e) {
            logger.error("Failed to load post-trip data for booking {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
