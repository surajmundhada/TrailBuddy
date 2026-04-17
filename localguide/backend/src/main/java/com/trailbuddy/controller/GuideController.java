package com.trailbuddy.controller;

import com.trailbuddy.dto.GuideRegistrationDTO;
import com.trailbuddy.dto.GuideProfileDTO;
import com.trailbuddy.dto.GuideRevenueModelDTO;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideAvailability;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.GuideService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/guides")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GuideController {

    private static final Logger logger = LoggerFactory.getLogger(GuideController.class);

    @Autowired
    private GuideService guideService;

    /**
     * Logged-in guide only: live stage, commission, and progress toward the next tier.
     */
    @GetMapping("/revenue-model")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> getRevenueModel() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            GuideRevenueModelDTO dto = guideService.getRevenueModelForUser(user.getId());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Error building revenue model: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<Guide>> getAllGuides(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "rating") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            // Use String to avoid request-binding failures for values like "NaN".
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(required = false) String languages,
            @RequestParam(defaultValue = "false") boolean womenOnly,
            @RequestParam(defaultValue = "false") boolean verifiedOnly
    ) {
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortBy.equals("price-low") ? "ASC" : 
                              sortBy.equals("price-high") ? "DESC" : "DESC"), 
                              sortBy.equals("price-low") || sortBy.equals("price-high") ? "hourlyRate" : 
                              sortBy.equals("experience") ? "experienceYears" : 
                              sortBy.equals("bookings") ? "totalBookings" : "averageRating");
            
            Pageable pageable = PageRequest.of(page, size, sort);

            Integer parsedMinPrice = parseNullableInt(minPrice);
            Integer parsedMaxPrice = parseNullableInt(maxPrice);
            
            List<Guide> guides = guideService.searchGuides(
                city, search, parsedMinPrice, parsedMaxPrice, languages, womenOnly, verifiedOnly, pageable);
            
            return ResponseEntity.ok(new org.springframework.data.domain.PageImpl<>(guides, pageable, guides.size()));
        } catch (Exception e) {
            logger.error("Error fetching guides: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private Integer parseNullableInt(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        try {
            return Integer.valueOf(v);
        } catch (Exception ex) {
            // Ignore invalid query params (e.g. "NaN") and treat them as missing filters.
            return null;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guide> getGuideById(@PathVariable Long id) {
        try {
            Guide guide = guideService.getGuideById(id);
            if (guide != null) {
                return ResponseEntity.ok(guide);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> registerGuide(@Valid @RequestBody GuideRegistrationDTO registrationDTO) {
        try {
            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            
            Guide guide = guideService.registerGuide(registrationDTO, user.getId());
            logger.info("Guide registration successful for user: {}", user.getId());
            return ResponseEntity.ok("Guide registration submitted for approval. You will be notified once approved.");
        } catch (Exception e) {
            logger.error("Guide registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> updateGuideProfile(@Valid @RequestBody GuideProfileDTO profileDTO) {
        try {
            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            
            Guide guide = guideService.updateGuideProfile(user.getId(), profileDTO);
            return ResponseEntity.ok(guide);
        } catch (Exception e) {
            logger.error("Guide profile update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<?> getGuideAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            boolean isAvailable = guideService.getGuideAvailability(id, startDate, endDate);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            logger.error("Error fetching guide availability: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/availability")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> updateAvailability(@RequestBody List<GuideAvailability> availabilityList) {
        try {
            guideService.updateAvailability(availabilityList);
            return ResponseEntity.ok("Availability updated successfully");
        } catch (Exception e) {
            logger.error("Error updating availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAvailableCities() {
        try {
            List<String> cities = guideService.getAvailableCities();
            return ResponseEntity.ok(cities);
        } catch (Exception e) {
            logger.error("Error fetching cities: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<Guide>> getTopRatedGuides(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<Guide> guides = guideService.getTopRatedGuides(limit);
            return ResponseEntity.ok(guides);
        } catch (Exception e) {
            logger.error("Error fetching top rated guides: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<List<Guide>> getFeaturedGuides(@RequestParam(defaultValue = "6") int limit) {
        try {
            List<Guide> guides = guideService.getFeaturedGuides(limit);
            return ResponseEntity.ok(guides);
        } catch (Exception e) {
            logger.error("Error fetching featured guides: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveGuide(@PathVariable Long id) {
        try {
            guideService.approveGuide(id);
            return ResponseEntity.ok("Guide approved successfully");
        } catch (Exception e) {
            logger.error("Error approving guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectGuide(@PathVariable Long id, @RequestBody String rejectionReason) {
        try {
            guideService.rejectGuide(id, rejectionReason);
            return ResponseEntity.ok("Guide rejected successfully");
        } catch (Exception e) {
            logger.error("Error rejecting guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/book")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> bookGuide(@PathVariable Long id, @RequestBody Map<String, Object> bookingData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Map<String, Object> response = guideService.createBooking(id, user.getId(), bookingData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error booking guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/chat")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> startChat(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Map<String, Object> chatRoom = guideService.createChatRoom(id, user.getId());
            return ResponseEntity.ok(chatRoom);
        } catch (Exception e) {
            logger.error("Error starting chat with guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/payment/initiate")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> initiatePayment(@PathVariable Long id, @RequestBody Map<String, Object> paymentData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Map<String, Object> response = guideService.initiatePayment(id, user.getId(), paymentData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error initiating payment for guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/payment/confirm")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> confirmPayment(@PathVariable Long id, @RequestBody Map<String, Object> paymentData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Map<String, Object> response = guideService.confirmPayment(id, user.getId(), paymentData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error confirming payment for guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('USER', 'GUIDE')")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody Map<String, Object> reviewData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Map<String, Object> response = guideService.addReview(id, user.getId(), reviewData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error adding review for guide {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
