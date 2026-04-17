package com.trailbuddy.service;

import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideAvailability;
import com.trailbuddy.dto.GuideProfileDTO;
import com.trailbuddy.dto.GuideRegistrationDTO;
import com.trailbuddy.dto.GuideRevenueModelDTO;
import com.trailbuddy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface GuideService {
    Guide registerGuide(GuideProfileDTO guideDTO);
    Guide updateGuide(Long id, GuideProfileDTO guideDTO);
    Guide getGuideById(Long id);
    Page<Guide> getAllGuides(Pageable pageable);
    List<Guide> searchGuides(String city, String expertise, Integer minPrice, Integer maxPrice, String languages, boolean womenOnly, boolean verifiedOnly, Pageable pageable);
    boolean isGuideAvailable(Long guideId, LocalDate startDate, LocalDate endDate);
    Guide verifyGuide(Long id);
    Guide updateRating(Long id, Double rating);
    
    // Additional methods needed by controllers
    List<String> getAvailableCities();
    List<Guide> getTopRatedGuides(int limit);
    List<Guide> getFeaturedGuides(int limit);
    Guide approveGuide(Long id);
    Guide rejectGuide(Long id, String reason);
    void updateAvailability(List<GuideAvailability> availability);
    Guide registerGuide(GuideRegistrationDTO registrationDTO, Long userId);
    Guide updateGuideProfile(Long id, GuideProfileDTO guideDTO);
    Guide getGuideProfileByUserId(Long userId);
    boolean getGuideAvailability(Long guideId, LocalDate startDate, LocalDate endDate);
    List<GuideAvailability> getGuideAvailability(Long guideId);
    
    // New methods for booking, chat, payment, and reviews
    Map<String, Object> createBooking(Long guideId, Long userId, Map<String, Object> bookingData);
    Map<String, Object> createChatRoom(Long guideId, Long userId);
    Map<String, Object> initiatePayment(Long guideId, Long userId, Map<String, Object> paymentData);
    Map<String, Object> confirmPayment(Long guideId, Long userId, Map<String, Object> paymentData);
    Map<String, Object> addReview(Long guideId, Long userId, Map<String, Object> reviewData);

    GuideRevenueModelDTO getRevenueModelForUser(Long userId);

    Guide resolveGuideProfile(User user);
}
