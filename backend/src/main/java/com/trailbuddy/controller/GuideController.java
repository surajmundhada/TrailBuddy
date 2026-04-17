package com.trailbuddy.controller;

import com.trailbuddy.dto.GuideRegistrationDTO;
import com.trailbuddy.dto.GuideProfileDTO;
import com.trailbuddy.dto.GuideRevenueModelDTO;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideAvailability;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.GuideStage;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.util.GuideStageUtil;
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
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.jcodec.common.io.NIOUtils;
import org.jcodec.containers.mp4.demuxer.MP4Demuxer;

import java.io.IOException;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/guides")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GuideController {

    private static final Logger logger = LoggerFactory.getLogger(GuideController.class);
    private static final String PUBLIC_MEDIA_BASE_URL = "http://localhost:8080/uploads/";

    @Autowired
    private GuideService guideService;

    @Autowired
    private BookingRepository bookingRepository;

    @org.springframework.beans.factory.annotation.Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @org.springframework.beans.factory.annotation.Value("${file.upload.image-max-size:5242880}")
    private long imageMaxSize;

    @org.springframework.beans.factory.annotation.Value("${file.upload.video-max-size:26214400}")
    private long videoMaxSize;

    /**
     * Logged-in guide only: live stage, commission, and progress toward the next
     * tier.
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
            @RequestParam(defaultValue = "false") boolean verifiedOnly) {
        try {
            Sort sort = Sort.by(
                    Sort.Direction.fromString(
                            sortBy.equals("price-low") ? "ASC" : sortBy.equals("price-high") ? "DESC" : "DESC"),
                    sortBy.equals("price-low") || sortBy.equals("price-high") ? "hourlyRate"
                            : sortBy.equals("experience") ? "experienceYears"
                                    : sortBy.equals("bookings") ? "totalBookings" : "averageRating");

            Pageable pageable = PageRequest.of(page, size, sort);

            Integer parsedMinPrice = parseNullableInt(minPrice);
            Integer parsedMaxPrice = parseNullableInt(maxPrice);

            List<Guide> guides = guideService.searchGuides(
                    city, search, parsedMinPrice, parsedMaxPrice, languages, womenOnly, verifiedOnly, pageable);

            // Enforce strict Elite -> Pro -> Beginner ordering everywhere.
            guides.sort((a, b) -> {
                int rankA = stageRank(a);
                int rankB = stageRank(b);
                if (rankA != rankB)
                    return Integer.compare(rankA, rankB);
                return compareWithinTier(a, b, sortBy);
            });

            return ResponseEntity.ok(new org.springframework.data.domain.PageImpl<>(guides, pageable, guides.size()));
        } catch (Exception e) {
            logger.error("Error fetching guides: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private int stageRank(Guide guide) {
        if (guide == null)
            return 2;
        int tripsCompleted = (int) bookingRepository.countByGuide_IdAndStatus(guide.getId(),
                Booking.BookingStatus.COMPLETED);
        BigDecimal earnings = bookingRepository.sumGuideEarningsByGuideId(
                guide.getId(),
                Arrays.asList(Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.COMPLETED));
        BigDecimal rating = guide.getAverageRating() != null ? guide.getAverageRating() : BigDecimal.ZERO;
        int reviews = guide.getTotalReviews() != null ? guide.getTotalReviews() : 0;

        GuideStage stage = GuideStageUtil.getGuideStage(tripsCompleted, earnings, rating, reviews);
        return switch (stage) {
            case ELITE -> 0;
            case PRO -> 1;
            case BEGINNER -> 2;
        };
    }

    private int compareWithinTier(Guide a, Guide b, String sortBy) {
        String s = sortBy != null ? sortBy : "rating";
        switch (s) {
            case "price-low": {
                BigDecimal priceA = effectiveGuideDaily(a);
                BigDecimal priceB = effectiveGuideDaily(b);
                return priceA.compareTo(priceB); // asc
            }
            case "price-high": {
                BigDecimal priceA = effectiveGuideDaily(a);
                BigDecimal priceB = effectiveGuideDaily(b);
                return priceB.compareTo(priceA); // desc
            }
            case "experience": {
                Integer ea = a.getExperienceYears() != null ? a.getExperienceYears() : 0;
                Integer eb = b.getExperienceYears() != null ? b.getExperienceYears() : 0;
                int cmp = eb.compareTo(ea); // desc
                return cmp != 0 ? cmp : Long.compare(a.getId(), b.getId());
            }
            case "bookings": {
                Integer ba = a.getTotalBookings() != null ? a.getTotalBookings() : 0;
                Integer bb = b.getTotalBookings() != null ? b.getTotalBookings() : 0;
                int cmp = bb.compareTo(ba); // desc
                return cmp != 0 ? cmp : Long.compare(a.getId(), b.getId());
            }
            case "rating":
            default: {
                BigDecimal ra = a.getAverageRating() != null ? a.getAverageRating() : BigDecimal.ZERO;
                BigDecimal rb = b.getAverageRating() != null ? b.getAverageRating() : BigDecimal.ZERO;
                int cmp = rb.compareTo(ra); // desc
                if (cmp != 0)
                    return cmp;
                int resa = a.getTotalReviews() != null ? a.getTotalReviews() : 0;
                int resb = b.getTotalReviews() != null ? b.getTotalReviews() : 0;
                cmp = Integer.compare(resb, resa);
                if (cmp != 0)
                    return cmp;
                return Long.compare(a.getId(), b.getId());
            }
        }
    }

    private BigDecimal effectiveGuideDaily(Guide g) {
        if (g == null)
            return BigDecimal.ZERO;
        if (g.getDailyRate() != null)
            return g.getDailyRate();
        if (g.getHourlyRate() != null) {
            return g.getHourlyRate().multiply(BigDecimal.valueOf(8));
        }
        return BigDecimal.ZERO;
    }

    private Integer parseNullableInt(String raw) {
        if (raw == null)
            return null;
        String v = raw.trim();
        if (v.isEmpty())
            return null;
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

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentGuideProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Guide guide = guideService.getGuideProfileByUserId(user.getId());
            return ResponseEntity.ok(guide);
        } catch (Exception e) {
            logger.error("Failed to fetch current guide profile: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadGuideImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Image file is required");
            }
            if (file.getSize() > imageMaxSize) {
                return ResponseEntity.badRequest().body("Image size must be 5MB or less");
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Only image files are allowed");
            }

            String url = saveUploadedFile(file, "images");
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            logger.error("Error uploading guide image: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-video")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadGuideVideo(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Video file is required");
            }
            if (file.getSize() > videoMaxSize) {
                return ResponseEntity.badRequest().body("Video size must be 25MB or less");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                return ResponseEntity.badRequest().body("Only video files are allowed");
            }

            Path tempFile = Files.createTempFile("guide-video-", ".mp4");
            try {
                file.transferTo(tempFile);
                double durationSeconds = getVideoDurationSeconds(tempFile);
                if (durationSeconds > 30.0d) {
                    return ResponseEntity.badRequest().body("Intro video must be 30 seconds or less");
                }

                String url = saveExistingFile(tempFile, file.getOriginalFilename(), "videos");
                return ResponseEntity.ok(Map.of("url", url));
            } finally {
                Files.deleteIfExists(tempFile);
            }
        } catch (Exception e) {
            logger.error("Error uploading guide video: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    @PreAuthorize("isAuthenticated()")
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

    @PutMapping({"/profile", "/update-profile"})
    @PreAuthorize("isAuthenticated()")
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
            guides.sort((a, b) -> {
                int rankA = stageRank(a);
                int rankB = stageRank(b);
                if (rankA != rankB)
                    return Integer.compare(rankA, rankB);
                return compareWithinTier(a, b, "rating");
            });
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
            guides.sort((a, b) -> {
                int rankA = stageRank(a);
                int rankB = stageRank(b);
                if (rankA != rankB)
                    return Integer.compare(rankA, rankB);
                return compareWithinTier(a, b, "rating");
            });
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

    private String saveUploadedFile(MultipartFile file, String subDirectory) throws IOException {
        Path directory = Paths.get(uploadPath, subDirectory).toAbsolutePath().normalize();
        Files.createDirectories(directory);

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + (extension != null && !extension.isBlank() ? "." + extension : "");
        Path targetFile = directory.resolve(fileName);
        file.transferTo(targetFile);
        return buildPublicUrl(subDirectory, fileName);
    }

    private String saveExistingFile(Path sourceFile, String originalFilename, String subDirectory) throws IOException {
        Path directory = Paths.get(uploadPath, subDirectory).toAbsolutePath().normalize();
        Files.createDirectories(directory);

        String extension = StringUtils.getFilenameExtension(originalFilename);
        String fileName = UUID.randomUUID() + (extension != null && !extension.isBlank() ? "." + extension : "");
        Path targetFile = directory.resolve(fileName);
        Files.copy(sourceFile, targetFile);
        return buildPublicUrl(subDirectory, fileName);
    }

    private String buildPublicUrl(String subDirectory, String fileName) {
        return PUBLIC_MEDIA_BASE_URL + subDirectory + "/" + fileName;
    }

    private double getVideoDurationSeconds(Path videoPath) throws IOException {
        try (var readableChannel = NIOUtils.readableChannel(videoPath.toFile())) {
            MP4Demuxer demuxer = MP4Demuxer.createMP4Demuxer(readableChannel);
            return (double) demuxer.getMovie().getDuration() / demuxer.getMovie().getTimescale();
        } catch (Exception ex) {
            throw new IOException("Unable to read video duration. Please upload an MP4 or MOV file.", ex);
        }
    }
}
