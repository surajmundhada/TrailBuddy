package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideAvailability;
import com.trailbuddy.entity.User;
import com.trailbuddy.dto.GuideProfileDTO;
import com.trailbuddy.dto.GuideRegistrationDTO;
import com.trailbuddy.dto.GuideRevenueModelDTO;
import com.trailbuddy.util.GuideRevenueModelAssembler;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Review;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.repository.ReviewRepository;
import com.trailbuddy.service.GuideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GuideServiceImpl implements GuideService {

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Override
    public Guide registerGuide(GuideProfileDTO guideDTO) {
        Guide guide = new Guide();
        // Guide is linked to User, so we need to set the user relationship
        // For now, we'll create a basic guide record
        guide.setBio(guideDTO.getBio());
        guide.setExpertiseAreas(List.of(guideDTO.getExpertise().split(",")));
        guide.setLanguages(List.of(guideDTO.getLanguages().split(",")));
        guide.setHourlyRate(new java.math.BigDecimal(guideDTO.getHourlyRate().toString()));
        guide.setCity(guideDTO.getCity());
        guide.setState(guideDTO.getState());
        guide.setAverageRating(java.math.BigDecimal.ZERO);
        guide.setTotalBookings(0);
        return guideRepository.save(guide);
    }

    @Override
    public Guide updateGuide(Long id, GuideProfileDTO guideDTO) {
        Guide guide = getGuideById(id);
        guide.setBio(guideDTO.getBio());
        guide.setExpertiseAreas(List.of(guideDTO.getExpertise().split(",")));
        guide.setLanguages(List.of(guideDTO.getLanguages().split(",")));
        guide.setHourlyRate(new java.math.BigDecimal(guideDTO.getHourlyRate().toString()));
        guide.setCity(guideDTO.getCity());
        guide.setState(guideDTO.getState());
        return guideRepository.save(guide);
    }

    @Override
    public Guide getGuideById(Long id) {
        return guideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guide not found"));
    }

    @Override
    public Page<Guide> getAllGuides(Pageable pageable) {
        return guideRepository.findAll(pageable);
    }

    @Override
    public List<Guide> searchGuides(String city, String expertise, Integer minPrice, Integer maxPrice, String languages, boolean womenOnly, boolean verifiedOnly, Pageable pageable) {
        List<Guide> guides;
        
        // First filter by city (database query)
        if (city != null && !city.isBlank()) {
            guides = guideRepository.findByCity(city);
        } else {
            guides = guideRepository.findAll();
        }
        
        // Then filter by expertise in memory (since it's stored as JSON)
        if (expertise != null && !expertise.isBlank() && !expertise.isEmpty()) {
            List<String> expertiseList = List.of(expertise.split(","));
            guides = guides.stream()
                .filter(g -> g.getExpertiseAreas() != null && 
                    g.getExpertiseAreas().stream().anyMatch(expertiseList::contains))
                .collect(java.util.stream.Collectors.toList());
        }
        
        // Filter by languages in memory
        if (languages != null && !languages.isBlank() && !languages.isEmpty()) {
            List<String> langList = List.of(languages.split(","));
            guides = guides.stream()
                .filter(g -> g.getLanguages() != null && 
                    g.getLanguages().stream().anyMatch(langList::contains))
                .collect(java.util.stream.Collectors.toList());
        }

        // Filter by price in memory (since we fetch from DB without complex criteria)
        if (minPrice != null) {
            int min = minPrice;
            guides = guides.stream()
                    .filter(g -> {
                        java.math.BigDecimal daily = g.getDailyRate();
                        java.math.BigDecimal hourly = g.getHourlyRate();
                        java.math.BigDecimal price = daily != null ? daily : (hourly != null ? hourly.multiply(java.math.BigDecimal.valueOf(8)) : null);
                        return price != null && price.doubleValue() >= min;
                    })
                    .collect(java.util.stream.Collectors.toList());
        }
        if (maxPrice != null) {
            int max = maxPrice;
            guides = guides.stream()
                    .filter(g -> {
                        java.math.BigDecimal daily = g.getDailyRate();
                        java.math.BigDecimal hourly = g.getHourlyRate();
                        java.math.BigDecimal price = daily != null ? daily : (hourly != null ? hourly.multiply(java.math.BigDecimal.valueOf(8)) : null);
                        return price != null && price.doubleValue() <= max;
                    })
                    .collect(java.util.stream.Collectors.toList());
        }

        if (womenOnly) {
            guides = guides.stream()
                    .filter(Guide::isWomenFriendly)
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // Public guides listing should only show admin-approved guides.
        // (If you want "show pending too" later, we can add a separate param, but
        // for now approval is the gate for visibility.)
        guides = guides.stream()
                .filter((g) -> Boolean.TRUE.equals(g.getAadharVerified())
                        && Boolean.TRUE.equals(g.getIsVerified())
                        && Boolean.TRUE.equals(g.getIsApproved()))
                .collect(java.util.stream.Collectors.toList());
        
        return guides;
    }

    @Override
    public boolean isGuideAvailable(Long guideId, LocalDate startDate, LocalDate endDate) {
        if (guideId == null || startDate == null || endDate == null) return false;
        if (endDate.isBefore(startDate)) return false;

        // Block overlaps for active bookings.
        List<Booking.BookingStatus> active = List.of(
                Booking.BookingStatus.PENDING,
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.COMPLETED
        );
        boolean hasOverlap = bookingRepository.existsOverlappingBooking(guideId, startDate, endDate, active);
        return !hasOverlap;
    }

    @Override
    public Guide verifyGuide(Long id) {
        Guide guide = getGuideById(id);
        guide.setAadharVerified(true);
        guide.setIsVerified(true);
        return guideRepository.save(guide);
    }

    @Override
    public Guide updateRating(Long id, Double rating) {
        Guide guide = getGuideById(id);
        guide.setAverageRating(new java.math.BigDecimal(rating.toString()));
        guide.setTotalBookings(guide.getTotalBookings() + 1);
        return guideRepository.save(guide);
    }

    @Override
    public List<String> getAvailableCities() {
        // Return distinct cities from guides
        return guideRepository.findAll().stream()
                .map(Guide::getCity)
                .distinct()
                .limit(10)
                .toList();
    }

    @Override
    public List<Guide> getTopRatedGuides(int limit) {
        return guideRepository.findByAverageRatingGreaterThan(4.0).stream()
                .limit(limit)
                .toList();
    }

    @Override
    public List<Guide> getFeaturedGuides(int limit) {
        return guideRepository.findByAadharVerified(true).stream()
                .limit(limit)
                .toList();
    }

    @Override
    public Guide approveGuide(Long id) {
        Guide guide = getGuideById(id);
        guide.setAadharVerified(true);
        guide.setIsVerified(true);
        guide.setIsApproved(true);
        return guideRepository.save(guide);
    }

    @Override
    public Guide rejectGuide(Long id, String reason) {
        Guide guide = getGuideById(id);
        guide.setAadharVerified(false);
        guide.setIsVerified(false);
        guide.setIsApproved(false);
        return guideRepository.save(guide);
    }

    @Override
    public void updateAvailability(List<GuideAvailability> availability) {
        // Implementation would save availability records
        // For now, this is a placeholder
    }

    @Override
    public Guide registerGuide(GuideRegistrationDTO registrationDTO, Long userId) {
        Guide guide = new Guide();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        guide.setUser(user);
        guide.setBio(registrationDTO.getBio());
        guide.setExpertiseAreas(List.of(registrationDTO.getExpertise().split(",")));
        guide.setLanguages(List.of(registrationDTO.getLanguages().split(",")));
        guide.setHourlyRate(new java.math.BigDecimal(registrationDTO.getHourlyRate().toString()));

        // Ensure defaults are consistent for admin queue and verified badge.
        guide.setAadharVerified(false);
        guide.setIsVerified(false);
        guide.setIsApproved(false);

        // If dailyRate is not provided in the DTO, derive it from hourlyRate.
        if (guide.getDailyRate() == null && guide.getHourlyRate() != null) {
            guide.setDailyRate(guide.getHourlyRate().multiply(java.math.BigDecimal.valueOf(8)));
        }

        guide.setCity(registrationDTO.getCity());
        guide.setState(registrationDTO.getState());
        guide.setAverageRating(java.math.BigDecimal.ZERO);
        guide.setTotalBookings(0);
        return guideRepository.save(guide);
    }

    @Override
    public Guide updateGuideProfile(Long id, GuideProfileDTO guideDTO) {
        return updateGuide(id, guideDTO);
    }

    @Override
    public boolean getGuideAvailability(Long guideId, LocalDate startDate, LocalDate endDate) {
        return isGuideAvailable(guideId, startDate, endDate);
    }

    @Override
    public List<GuideAvailability> getGuideAvailability(Long guideId) {
        // Return empty list for now - would fetch from repository in full implementation
        return List.of();
    }

    @Override
    public Map<String, Object> createBooking(Long guideId, Long userId, Map<String, Object> bookingData) {
        Map<String, Object> response = new HashMap<>();
        response.put("bookingId", "BK" + System.currentTimeMillis());
        response.put("guideId", guideId);
        response.put("userId", userId);
        response.put("status", "PENDING");
        response.put("message", "Booking created successfully!");
        return response;
    }

    @Override
    public Map<String, Object> createChatRoom(Long guideId, Long userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("chatRoomId", "CR" + System.currentTimeMillis());
        response.put("guideId", guideId);
        response.put("userId", userId);
        response.put("status", "ACTIVE");
        response.put("message", "Chat room created successfully!");
        return response;
    }

    @Override
    public Map<String, Object> initiatePayment(Long guideId, Long userId, Map<String, Object> paymentData) {
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", "PY" + System.currentTimeMillis());
        response.put("amount", paymentData.get("amount"));
        response.put("currency", "INR");
        response.put("razorpayOrderId", "order_" + System.currentTimeMillis());
        response.put("status", "PENDING");
        response.put("message", "Payment initiated successfully!");
        return response;
    }

    @Override
    public Map<String, Object> confirmPayment(Long guideId, Long userId, Map<String, Object> paymentData) {
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", paymentData.get("paymentId"));
        response.put("status", "COMPLETED");
        response.put("transactionId", "TXN" + System.currentTimeMillis());
        response.put("message", "Payment confirmed successfully!");
        return response;
    }

    @Override
    public Map<String, Object> addReview(Long guideId, Long userId, Map<String, Object> reviewData) {
        if (reviewData == null) {
            throw new RuntimeException("Review payload missing");
        }

        Object bookingIdRaw = reviewData.get("bookingId");
        Object ratingRaw = reviewData.get("rating");
        Object commentRaw = reviewData.get("comment");

        if (bookingIdRaw == null) {
            throw new RuntimeException("bookingId is required");
        }
        if (ratingRaw == null) {
            throw new RuntimeException("rating is required");
        }

        Long bookingId = bookingIdRaw instanceof Number
                ? ((Number) bookingIdRaw).longValue()
                : Long.parseLong(String.valueOf(bookingIdRaw));

        Integer rating = ratingRaw instanceof Number
                ? ((Number) ratingRaw).intValue()
                : Integer.parseInt(String.valueOf(ratingRaw));

        String comment = commentRaw != null ? String.valueOf(commentRaw) : null;

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getGuide() == null || !Objects.equals(booking.getGuide().getId(), guideId)) {
            throw new RuntimeException("Guide does not match this booking");
        }
        if (booking.getUser() == null || !Objects.equals(booking.getUser().getId(), userId)) {
            throw new RuntimeException("User does not own this booking");
        }

        // Only allow review for completed trips.
        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking must be COMPLETED to leave a review");
        }

        // Prevent duplicate reviews (booking_id is unique in Review entity).
        if (booking.getReview() != null || reviewRepository.findByBooking_Id(bookingId).isPresent()) {
            throw new RuntimeException("Review already exists for this booking");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setUser(booking.getUser());
        review.setGuide(booking.getGuide());
        review.setRating(rating);
        review.setReviewText(comment);
        reviewRepository.save(review);

        // Update guide aggregates from persisted reviews.
        List<Review> allReviews = reviewRepository.findByGuide_Id(guideId);
        int total = allReviews.size();

        BigDecimal avg = BigDecimal.ZERO;
        if (total > 0) {
            BigDecimal sum = allReviews.stream()
                    .map(r -> BigDecimal.valueOf(r.getRating()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avg = sum.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        }

        Guide guide = getGuideById(guideId);
        guide.setTotalReviews(total);
        guide.setAverageRating(avg);
        guideRepository.save(guide);

        Map<String, Object> response = new HashMap<>();
        response.put("reviewId", review.getId());
        response.put("guideId", guideId);
        response.put("userId", userId);
        response.put("rating", rating);
        response.put("comment", comment);
        response.put("status", "PUBLISHED");
        response.put("message", "Review added successfully!");
        response.put("guideAverageRating", avg);
        response.put("guideTotalReviews", total);
        return response;
    }

    @Override
    public GuideRevenueModelDTO getRevenueModelForUser(Long userId) {
        Guide guide = guideRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Guide profile not found"));
        long trips = bookingRepository.countByGuide_IdAndStatus(guide.getId(), Booking.BookingStatus.COMPLETED);
        BigDecimal earnings = bookingRepository.sumGuideEarningsByGuideId(
                guide.getId(),
                Arrays.asList(Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.COMPLETED)
        );
        return GuideRevenueModelAssembler.build(guide, (int) trips, earnings);
    }
}
