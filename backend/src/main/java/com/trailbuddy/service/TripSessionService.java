package com.trailbuddy.service;

import com.trailbuddy.dto.*;
import com.trailbuddy.entity.TripSession;

public interface TripSessionService {

    /**
     * Creates (or repairs) a trip session with a pickup OTP as soon as the booking is paid/confirmed.
     * Idempotent — safe to call after every transition to CONFIRMED.
     */
    void provisionSessionAfterBookingConfirmed(Long bookingId);

    TripSessionDTO getTripSessionForViewer(Long bookingId, com.trailbuddy.entity.User viewer);

    TripSessionDTO guideStartJourney(Long bookingId, com.trailbuddy.entity.User guideUser);

    TripSessionDTO guideArrived(Long bookingId, com.trailbuddy.entity.User guideUser);

    TripSessionDTO verifyGuideOtp(Long bookingId, com.trailbuddy.entity.User guideUser, String otp);

    TripSessionDTO startTrip(Long bookingId, com.trailbuddy.entity.User user);

    TripSessionDTO completeTrip(Long bookingId, com.trailbuddy.entity.User actor);

    TripSessionDTO updateLocation(Long bookingId, com.trailbuddy.entity.User user, TripLocationUpdateRequest request);

    TripSessionDTO triggerSos(Long bookingId, com.trailbuddy.entity.User user, SosRequest request);

    java.util.List<TripExperienceCardDTO> getTripExperienceUnlockCards(Long bookingId, com.trailbuddy.entity.User viewer);

    java.util.List<TripEventDTO> getTripTimeline(Long bookingId, com.trailbuddy.entity.User viewer);

    com.trailbuddy.dto.PostTripResponseDTO getPostTripData(Long bookingId, com.trailbuddy.entity.User viewer);
}
