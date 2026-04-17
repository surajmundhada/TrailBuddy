package com.trailbuddy.service.impl;

import com.trailbuddy.dto.*;
import com.trailbuddy.entity.*;
import com.trailbuddy.model.TripStatus;
import com.trailbuddy.model.TripEventType;
import com.trailbuddy.model.ExperiencePurchaseStatus;
import com.trailbuddy.repository.*;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.TripSessionService;
import com.trailbuddy.util.GuideStageUtil;
import com.trailbuddy.model.GuideStage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class TripSessionServiceImpl implements TripSessionService {

    /** Fallback OTP lifetime when no booking context (seconds). */
    private static final int OTP_TTL_SECONDS = 5 * 60;
    private static final int OTP_LENGTH = 6;
    private static final int OTP_ONGOING_TO_ONGOING_GRACE_SECONDS = 60;

    @Autowired
    private TripSessionRepository tripSessionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TripEventRepository tripEventRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private ExperiencePurchaseRepository experiencePurchaseRepository;

    @Autowired
    private UserBadgeRepository userBadgeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final int LOCATION_EVENT_THROTTLE_SECONDS = 30;

    @Override
    @Transactional
    public void provisionSessionAfterBookingConfirmed(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null || booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            return;
        }

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId).orElse(null);
        if (session == null) {
            TripSession created = new TripSession();
            created.setBooking(booking);
            created.setTripStatus(TripStatus.AWAITING_GUIDE);
            setFreshOtp(created, booking);
            created = tripSessionRepository.save(created);
            addEvent(created, TripEventType.OTP_GENERATED, "Pickup OTP issued when booking was confirmed.", null, null, null);
            addEvent(created, TripEventType.GUIDE_STARTED_TO_PICKUP, "Trip session created. Guide can head to pickup.", null, null, null);
            publishTripUpdate(created, "TRIP_SESSION_CREATED", "Trip session created with pickup OTP.");
            return;
        }

        // Experience-purchase stub: AWAITING_OTP without any guide pickup timestamps.
        if (session.getTripStatus() == TripStatus.AWAITING_OTP
                && session.getGuideArrivedAt() == null
                && session.getGuideStartedToPickupAt() == null) {
            session.setTripStatus(TripStatus.AWAITING_GUIDE);
            setFreshOtp(session, booking);
            tripSessionRepository.save(session);
            addEvent(session, TripEventType.OTP_GENERATED, "Trip session normalized after confirmation (pickup OTP issued).", null, null, null);
            publishTripUpdate(session, "TRIP_SESSION_NORMALIZED", "Pickup flow reset for confirmed booking.");
            return;
        }

        TripStatus st = session.getTripStatus();
        if (st == TripStatus.TRIP_COMPLETED || st == TripStatus.TRIP_ONGOING) {
            return;
        }
        boolean preLive = st == TripStatus.AWAITING_GUIDE
                || st == TripStatus.GUIDE_EN_ROUTE
                || st == TripStatus.AWAITING_OTP;
        if (!preLive) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean missingOrExpired = session.getOtpCode() == null
                || session.getOtpExpiresAt() == null
                || session.getOtpExpiresAt().isBefore(now);
        if (missingOrExpired) {
            setFreshOtp(session, booking);
            tripSessionRepository.save(session);
            addEvent(session, TripEventType.OTP_GENERATED, "Pickup OTP (re)issued for confirmed booking.", null, null, null);
            publishTripUpdate(session, "OTP_REFRESHED", "Pickup OTP (re)issued.");
        }
    }

    /**
     * Guide pickup APIs require a row in {@code trip_sessions}. If the traveler never hit the trip screen
     * after pay, {@link #provisionSessionAfterBookingConfirmed} may not have run in their session — re-run it here.
     */
    private void ensureTripSessionForConfirmedBooking(Long bookingId, Booking booking) {
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            return;
        }
        if (tripSessionRepository.findByBooking_Id(bookingId).isEmpty()) {
            provisionSessionAfterBookingConfirmed(bookingId);
        }
    }

    @Override
    public TripSessionDTO getTripSessionForViewer(Long bookingId, User viewer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isBookingViewer(booking, viewer)) {
            throw new RuntimeException("Unauthorized access to trip session");
        }

        requireConfirmedBookingForLiveTrip(booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId).orElse(null);
        if (session == null) {
            session = new TripSession();
            session.setBooking(booking);
            session.setTripStatus(TripStatus.AWAITING_GUIDE);
            setFreshOtp(session, booking);
            session = tripSessionRepository.save(session);
            addEvent(session, TripEventType.OTP_GENERATED, "Pickup OTP issued for trip session.", null, null, null);
            addEvent(session, TripEventType.GUIDE_STARTED_TO_PICKUP, "Trip session created. Guide can head to pickup.", null, null, null);
            publishTripUpdate(session, "TRIP_SESSION_CREATED", "Trip session created.");
        }

        // If the OTP expired while the user was away, refresh it for a seamless UX.
        LocalDateTime now = LocalDateTime.now();
        if ((session.getTripStatus() == TripStatus.AWAITING_OTP
                || session.getTripStatus() == TripStatus.AWAITING_GUIDE
                || session.getTripStatus() == TripStatus.GUIDE_EN_ROUTE)
                && session.getOtpExpiresAt() != null
                && session.getOtpExpiresAt().isBefore(now)) {
            setFreshOtp(session, booking);
            session = tripSessionRepository.save(session);
            addEvent(session, TripEventType.OTP_GENERATED, "Pickup OTP refreshed.", null, null, null);
            publishTripUpdate(session, "OTP_REFRESHED", "Pickup OTP refreshed.");
        }

        // Transition to TRIP_ONGOING based on startedAt grace window.
        TripStatus effectiveStatus = session.getTripStatus();
        if (effectiveStatus == TripStatus.TRIP_STARTED && session.getTripStartedAt() != null) {
            if (Duration.between(session.getTripStartedAt(), LocalDateTime.now()).getSeconds() >= OTP_ONGOING_TO_ONGOING_GRACE_SECONDS) {
                session.setTripStatus(TripStatus.TRIP_ONGOING);
                session = tripSessionRepository.save(session);
                addEvent(session, TripEventType.TRIP_ONGOING, "Trip is now ongoing.", null, null, null);
                publishTripUpdate(session, "TRIP_ONGOING", "Trip is now ongoing.");
                effectiveStatus = TripStatus.TRIP_ONGOING;
            }
        }

        boolean isUserOwner = booking.getUser() != null && Objects.equals(booking.getUser().getId(), viewer.getId());
        boolean travelerPickupPhase = effectiveStatus == TripStatus.AWAITING_GUIDE
                || effectiveStatus == TripStatus.GUIDE_EN_ROUTE
                || effectiveStatus == TripStatus.AWAITING_OTP;
        boolean includeOtp = isUserOwner && travelerPickupPhase && session.getOtpCode() != null;

        TripSessionDTO dto = mapToDto(session, booking, viewer, includeOtp);
        return dto;
    }

    @Override
    public TripSessionDTO guideStartJourney(Long bookingId, User guideUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isGuideUser(booking, guideUser)) {
            throw new RuntimeException("Unauthorized guide action");
        }

        requireConfirmedBookingForLiveTrip(booking);
        ensureTripSessionForConfirmedBooking(bookingId, booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        if (session.getTripStatus() != TripStatus.AWAITING_GUIDE) {
            throw new RuntimeException("Guide journey cannot start for status: " + session.getTripStatus());
        }

        session.setTripStatus(TripStatus.GUIDE_EN_ROUTE);
        session.setGuideStartedToPickupAt(LocalDateTime.now());
        tripSessionRepository.save(session);
        addEvent(session, TripEventType.GUIDE_STARTED_TO_PICKUP, "Guide is on the way to pickup.", null, null, null);
        publishTripUpdate(session, "GUIDE_EN_ROUTE", "Guide is on the way.");
        return getTripSessionForViewer(bookingId, guideUser);
    }

    @Override
    public TripSessionDTO guideArrived(Long bookingId, User guideUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isGuideUser(booking, guideUser)) {
            throw new RuntimeException("Unauthorized guide action");
        }

        requireConfirmedBookingForLiveTrip(booking);
        ensureTripSessionForConfirmedBooking(bookingId, booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        if (session.getTripStatus() != TripStatus.GUIDE_EN_ROUTE) {
            throw new RuntimeException("Guide can only mark arrival after starting the journey");
        }

        session.setTripStatus(TripStatus.AWAITING_OTP);
        session.setGuideArrivedAt(LocalDateTime.now());
        LocalDateTime now = LocalDateTime.now();
        boolean needNewOtp = session.getOtpCode() == null
                || session.getOtpExpiresAt() == null
                || session.getOtpExpiresAt().isBefore(now);
        if (needNewOtp) {
            setFreshOtp(session, booking);
            addEvent(session, TripEventType.OTP_GENERATED, "Pickup OTP (re)issued at arrival.", null, null, null);
        }
        tripSessionRepository.save(session);
        addEvent(session, TripEventType.GUIDE_ARRIVED, "Guide has arrived.", null, null, null);
        publishTripUpdate(session, "GUIDE_ARRIVED", "Guide has arrived.");
        return getTripSessionForViewer(bookingId, guideUser);
    }

    @Override
    public TripSessionDTO verifyGuideOtp(Long bookingId, User guideUser, String otp) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isGuideUser(booking, guideUser)) {
            throw new RuntimeException("Unauthorized OTP verification");
        }

        requireConfirmedBookingForLiveTrip(booking);
        ensureTripSessionForConfirmedBooking(bookingId, booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        if (session.getTripStatus() != TripStatus.AWAITING_OTP) {
            throw new RuntimeException("OTP verification is not allowed for current trip status: " + session.getTripStatus());
        }

        if (otp == null || otp.trim().isEmpty()) {
            throw new RuntimeException("OTP is required");
        }

        if (session.getOtpExpiresAt() == null || session.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired");
        }

        String otpNormalized = otp.trim();
        String expectedHash = sha256Hex(session.getOtpSalt() + otpNormalized);
        if (!expectedHash.equalsIgnoreCase(session.getOtpHash())) {
            throw new RuntimeException("Invalid OTP code");
        }

        session.setOtpVerifiedAt(LocalDateTime.now());
        session.setTripStartedAt(LocalDateTime.now());
        session.setTripStatus(TripStatus.TRIP_ONGOING);

        // Consume displayed OTP code after success.
        session.setOtpCode(null);

        tripSessionRepository.save(session);
        addEvent(session, TripEventType.OTP_VERIFIED, "OTP verified by guide.", null, null, null);
        addEvent(session, TripEventType.TRIP_ONGOING, "Trip live — OTP verified.", null, null, null);
        publishTripUpdate(session, "TRIP_ONGOING", "Trip live after OTP verification.");
        return getTripSessionForViewer(bookingId, guideUser);
    }

    @Override
    public TripSessionDTO startTrip(Long bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isUserOwner(booking, user)) {
            throw new RuntimeException("Unauthorized start-trip");
        }

        requireConfirmedBookingForLiveTrip(booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        TripStatus st = session.getTripStatus();
        if (st == TripStatus.TRIP_ONGOING || st == TripStatus.TRIP_STARTED) {
            return mapToDto(session, booking, user, false);
        }
        if (st != TripStatus.READY_TO_START) {
            throw new RuntimeException("Trip cannot be started for status: " + st);
        }

        // Legacy rows only: OTP used to stop at READY_TO_START; normalize to live trip.
        session.setTripStatus(TripStatus.TRIP_ONGOING);
        if (session.getTripStartedAt() == null) {
            session.setTripStartedAt(LocalDateTime.now());
        }
        tripSessionRepository.save(session);
        addEvent(session, TripEventType.TRIP_ONGOING, "Trip live (traveler confirmed start).", null, null, null);
        publishTripUpdate(session, "TRIP_ONGOING", "Trip live.");

        return mapToDto(session, booking, user, false);
    }

    @Override
    public TripSessionDTO completeTrip(Long bookingId, User actor) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        boolean isOwnerUser = isUserOwner(booking, actor);
        boolean isGuideUser = booking.getGuide() != null && booking.getGuide().getUser() != null
                && Objects.equals(booking.getGuide().getUser().getId(), actor.getId());

        if (!isOwnerUser && !isGuideUser) {
            throw new RuntimeException("Unauthorized trip completion");
        }

        requireConfirmedBookingForLiveTrip(booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        if (session.getTripStatus() != TripStatus.TRIP_ONGOING && session.getTripStatus() != TripStatus.TRIP_STARTED) {
            // Allow completion even if user taps quickly after start.
            if (session.getTripStatus() != TripStatus.READY_TO_START) {
                throw new RuntimeException("Trip cannot be completed for status: " + session.getTripStatus());
            }
        }

        session.setTripStatus(TripStatus.TRIP_COMPLETED);
        session.setTripCompletedAt(LocalDateTime.now());
        tripSessionRepository.save(session);
        addEvent(session, TripEventType.TRIP_COMPLETED, "Trip marked as completed.", null, null, null);
        publishTripUpdate(session, "TRIP_COMPLETED", "Trip marked as completed.");

        bookingService.completeBooking(bookingId);

        // Award gamification badges + compute post-trip suggestions.
        awardBadgesForTrip(booking);

        return mapToDto(session, booking, actor, false);
    }

    @Override
    public TripSessionDTO updateLocation(Long bookingId, User user, TripLocationUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isUserOwner(booking, user)) {
            throw new RuntimeException("Unauthorized location update");
        }

        requireConfirmedBookingForLiveTrip(booking);

        if (request == null || request.getLatitude() == null || request.getLongitude() == null) {
            throw new RuntimeException("latitude/longitude are required");
        }

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime prevLocationUpdatedAt = session.getLastLocationUpdatedAt();
        boolean liveEnabledRequested = request.getLiveLocationEnabled() != null ? request.getLiveLocationEnabled() : Boolean.TRUE.equals(session.getLiveLocationEnabled());
        boolean shouldCreateLocationEvent = liveEnabledRequested
                && (prevLocationUpdatedAt == null
                || Duration.between(prevLocationUpdatedAt, now).getSeconds() >= LOCATION_EVENT_THROTTLE_SECONDS);

        session.setLastLatitude(request.getLatitude());
        session.setLastLongitude(request.getLongitude());
        if (request.getAccuracyMeters() != null) {
            session.setLastAccuracyMeters(request.getAccuracyMeters());
        }
        session.setLastLocationUpdatedAt(now);
        if (request.getLiveLocationEnabled() != null) {
            session.setLiveLocationEnabled(request.getLiveLocationEnabled());
        }

        tripSessionRepository.save(session);
        if (shouldCreateLocationEvent) {
            addEvent(session, TripEventType.LOCATION_UPDATE, "Live location updated.", request.getLatitude(), request.getLongitude(), request.getAccuracyMeters());
        }
        return mapToDto(session, booking, user, false);
    }

    @Override
    public TripSessionDTO triggerSos(Long bookingId, User user, SosRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isUserOwner(booking, user)) {
            throw new RuntimeException("Unauthorized SOS trigger");
        }

        requireConfirmedBookingForLiveTrip(booking);

        if (request == null || request.getLatitude() == null || request.getLongitude() == null) {
            throw new RuntimeException("latitude/longitude are required for SOS");
        }

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new RuntimeException("TripSession not found for booking"));

        session.setSosTriggeredAt(LocalDateTime.now());
        session.setLastLatitude(request.getLatitude());
        session.setLastLongitude(request.getLongitude());
        session.setLastLocationUpdatedAt(LocalDateTime.now());
        tripSessionRepository.save(session);
        String notes = request.getNotes() != null ? request.getNotes() : "";
        addEvent(session, TripEventType.SOS_TRIGGERED,
                "SOS triggered by traveler." + (notes.isBlank() ? "" : " Notes: " + notes),
                request.getLatitude(),
                request.getLongitude(),
                null
        );
        publishTripUpdate(session, "SOS_TRIGGERED", "SOS triggered by traveler.");

        String userPhone = booking.getUser() != null ? booking.getUser().getPhone() : null;
        String phoneMasked = maskPhone(userPhone);

        String guideName = booking.getGuide() != null && booking.getGuide().getUser() != null
                ? booking.getGuide().getUser().getFullName()
                : "Unknown guide";

        String coords = "lat=" + request.getLatitude() + ", lng=" + request.getLongitude();

        // Notify internal support (admins for MVP).
        List<User> admins = userRepository.findActiveByRole("ADMIN");
        List<Notification> notifications = admins.stream().map(a -> new Notification(
                a,
                "SOS Alert",
                "Booking #" + bookingId + " | " + guideName + " | " + coords + " | Traveler: " + phoneMasked + (notes.isBlank() ? "" : " | " + notes),
                "SOS"
        )).collect(Collectors.toList());

        for (Notification n : notifications) {
            notificationRepository.save(n);
        }

        return mapToDto(session, booking, user, false);
    }

    @Override
    public List<TripExperienceCardDTO> getTripExperienceUnlockCards(Long bookingId, User viewer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isBookingViewer(booking, viewer)) {
            throw new RuntimeException("Unauthorized access to trip experiences");
        }

        requireConfirmedBookingForLiveTrip(booking);

        TripSession session = tripSessionRepository.findByBooking_Id(bookingId)
                .orElseGet(() -> {
                    TripSession created = new TripSession();
                    created.setBooking(booking);
                    created.setTripStatus(TripStatus.AWAITING_GUIDE);
                    setFreshOtp(created, booking);
                    return tripSessionRepository.save(created);
                });

        // Catalog order + UI labels are driven by seeded Experience rows.
        List<String> orderedKeys = List.of(
                "AUDIO_STORIES_SINGLE",
                "HIDDEN_HISTORY_SINGLE",
                "LOCAL_FOOD_SECRETS_SINGLE",
                "NEARBY_HIDDEN_GEMS_PACK"
        );

        return orderedKeys.stream().map(key -> {
            Experience exp = experienceRepository.findByExperienceKey(key)
                    .orElseThrow(() -> new RuntimeException("Experience not found for key: " + key));

            TripExperienceCardDTO card = new TripExperienceCardDTO();
            card.setExperienceId(exp.getId());
            card.setExperienceKey(key);
            card.setType(exp.getType() != null ? exp.getType().name() : null);
            card.setTitle(exp.getTitle());

            int price = exp.getPrice() != null ? exp.getPrice() : 0;
            card.setPrice(price);

            boolean unlocked = Boolean.TRUE.equals(exp.getIsFree());
            if (!unlocked) {
                boolean hasPurchase = experiencePurchaseRepository
                        .findByUserAndExperienceAndTripSessionAndStatus(
                                viewer,
                                exp,
                                session,
                                ExperiencePurchaseStatus.COMPLETED
                        ).stream().findFirst().isPresent();
                unlocked = hasPurchase;
            }

            card.setUnlocked(unlocked);
            card.setLocked(!unlocked);
            card.setCtaLabel(unlocked ? "Included" : ("Unlock for ₹" + price));
            return card;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<TripEventDTO> getTripTimeline(Long bookingId, User viewer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isBookingViewer(booking, viewer)) {
            throw new RuntimeException("Unauthorized access to trip timeline");
        }

        requireConfirmedBookingForLiveTrip(booking);

        // If a session was never created, timeline is empty.
        TripSession session = tripSessionRepository.findByBooking_Id(bookingId).orElse(null);
        if (session == null) return List.of();

        List<TripEvent> events = tripEventRepository.findByTripSession_Booking_IdOrderByCreatedAtAsc(bookingId);
        return events.stream().map(e -> {
            TripEventDTO dto = new TripEventDTO();
            dto.setType(e.getEventType() != null ? e.getEventType().name() : null);
            dto.setMessage(e.getMessage());
            dto.setTimestamp(e.getCreatedAt());
            dto.setLatitude(e.getLatitude());
            dto.setLongitude(e.getLongitude());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Override
    public PostTripResponseDTO getPostTripData(Long bookingId, User viewer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!isBookingViewer(booking, viewer)) {
            throw new RuntimeException("Unauthorized access to post-trip data");
        }

        requireConfirmedBookingForLiveTrip(booking);

        // Recommendations are for the traveler (booking.user).
        User traveler = booking.getUser();
        if (traveler == null) {
            throw new RuntimeException("Trip traveler not found");
        }

        List<UserBadge> existingBadges = userBadgeRepository.findByUser(traveler);
        java.util.Set<String> badgeNames = existingBadges.stream()
                .map(b -> b.getBadgeType().name())
                .collect(Collectors.toSet());

        List<Experience> withoutGuideCatalog = experienceRepository.findByScope(com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE);

        List<ExperienceRecommendationDTO> recommendations = withoutGuideCatalog.stream()
                .filter(exp -> {
                    if (badgeNames.contains(com.trailbuddy.model.BadgeType.FOOD_HUNTER.name())) {
                        return exp.getType() == com.trailbuddy.model.ExperienceType.LOCAL_FOOD_EXPRESS
                                || exp.getType() == com.trailbuddy.model.ExperienceType.CITY_TOUR_PACK;
                    }
                    if (badgeNames.contains(com.trailbuddy.model.BadgeType.CULTURE_SEEKER.name())) {
                        return exp.getType() == com.trailbuddy.model.ExperienceType.HERITAGE_WALK
                                || exp.getType() == com.trailbuddy.model.ExperienceType.HIDDEN_STREETS
                                || exp.getType() == com.trailbuddy.model.ExperienceType.UNTOLD_STORIES;
                    }
                    // Explorer default
                    return exp.getType() == com.trailbuddy.model.ExperienceType.HERITAGE_WALK
                            || exp.getType() == com.trailbuddy.model.ExperienceType.HIDDEN_STREETS
                            || exp.getType() == com.trailbuddy.model.ExperienceType.UNTOLD_STORIES;
                })
                .limit(4)
                .map(exp -> {
                    ExperienceRecommendationDTO dto = new ExperienceRecommendationDTO();
                    dto.setId(exp.getId());
                    dto.setExperienceKey(exp.getExperienceKey());
                    dto.setTitle(exp.getTitle());
                    dto.setPrice(exp.getPrice());
                    dto.setIsFree(exp.getIsFree());
                    dto.setScope(exp.getScope());
                    dto.setType(exp.getType());
                    dto.setCategory(exp.getCategory());
                    return dto;
                })
                .collect(Collectors.toList());

        PostTripResponseDTO res = new PostTripResponseDTO();
        res.setBadgeTypes(new java.util.ArrayList<>(badgeNames));
        res.setRecommendations(recommendations);

        boolean completed = booking.getStatus() == Booking.BookingStatus.COMPLETED;
        java.util.Optional<Review> existing = reviewRepository.findByBooking_Id(bookingId);
        res.setHasReview(existing.isPresent());
        existing.ifPresent(r -> res.setReviewId(r.getId()));
        boolean travelerViewer = booking.getUser() != null && Objects.equals(booking.getUser().getId(), viewer.getId());
        res.setCanSubmitReview(completed && travelerViewer && existing.isEmpty());

        return res;
    }

    private void requireConfirmedBookingForLiveTrip(Booking booking) {
        Booking.BookingStatus s = booking.getStatus();
        if (s != Booking.BookingStatus.CONFIRMED && s != Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Trip unlocks after payment confirms the booking (like Uber/Rapido). Current status: " + s);
        }
    }

    private void awardBadgesForTrip(Booking booking) {
        if (booking == null || booking.getUser() == null) return;

        TripSession session = tripSessionRepository.findByBooking_Id(booking.getId()).orElse(null);
        if (session == null) return;

        User traveler = booking.getUser();

        // Free trip add-ons are considered “unlocked” for badge purposes.
        List<Experience> tripAddons = experienceRepository.findByScope(com.trailbuddy.model.ExperienceScope.TRIP_ADDON);
        java.util.Set<com.trailbuddy.model.ExperienceType> unlockedTypes = tripAddons.stream()
                .filter(exp -> Boolean.TRUE.equals(exp.getIsFree()))
                .map(Experience::getType)
                .collect(java.util.stream.Collectors.toSet());

        List<ExperiencePurchase> purchases = experiencePurchaseRepository
                .findByUserAndTripSessionAndStatus(traveler, session, ExperiencePurchaseStatus.COMPLETED);
        for (ExperiencePurchase p : purchases) {
            if (p.getExperience() != null && p.getExperience().getType() != null) {
                unlockedTypes.add(p.getExperience().getType());
            }
        }

        // Explorer badge: always earned when trip completes.
        awardBadgeIfMissing(traveler, com.trailbuddy.model.BadgeType.EXPLORER, session);

        if (unlockedTypes.contains(com.trailbuddy.model.ExperienceType.AUDIO_STORIES)
                || unlockedTypes.contains(com.trailbuddy.model.ExperienceType.HIDDEN_HISTORY)) {
            awardBadgeIfMissing(traveler, com.trailbuddy.model.BadgeType.CULTURE_SEEKER, session);
        }

        if (unlockedTypes.contains(com.trailbuddy.model.ExperienceType.LOCAL_FOOD_SECRETS)) {
            awardBadgeIfMissing(traveler, com.trailbuddy.model.BadgeType.FOOD_HUNTER, session);
        }
    }

    private void awardBadgeIfMissing(User traveler, com.trailbuddy.model.BadgeType badgeType, TripSession session) {
        UserBadge existing = userBadgeRepository.findByUserAndBadgeType(traveler, badgeType).orElse(null);
        if (existing != null) return;

        UserBadge badge = new UserBadge();
        badge.setUser(traveler);
        badge.setBadgeType(badgeType);
        badge.setTripSession(session);
        userBadgeRepository.save(badge);
    }

    private TripSessionDTO mapToDto(TripSession session, Booking booking, User viewer, boolean includeOtp) {
        TripSessionDTO dto = new TripSessionDTO();
        dto.setTripSessionId(session.getId());
        dto.setBookingId(booking.getId());
        dto.setTripStatus(session.getTripStatus().name());

        // Timer UX values.
        dto.setGuideStartedToPickupAt(session.getGuideStartedToPickupAt());
        dto.setGuideArrivedAt(session.getGuideArrivedAt());
        dto.setTripStartedAt(session.getTripStartedAt());
        dto.setTripDurationMinutes(computeTripDurationMinutes(booking));
        dto.setElapsedSeconds(null); // computed in UI from startedAt

        dto.setCanStartTrip(session.getTripStatus() == TripStatus.READY_TO_START);
        dto.setCanGuideStartJourney(session.getTripStatus() == TripStatus.AWAITING_GUIDE);
        dto.setCanGuideMarkArrived(session.getTripStatus() == TripStatus.GUIDE_EN_ROUTE);
        dto.setCanGuideVerifyOtp(session.getTripStatus() == TripStatus.AWAITING_OTP);

        boolean canContact = session.getTripStatus() == TripStatus.TRIP_STARTED
                || session.getTripStatus() == TripStatus.TRIP_ONGOING
                || session.getTripStatus() == TripStatus.TRIP_COMPLETED;
        dto.setGuide(buildGuidePreview(booking, canContact));

        if (includeOtp && session.getOtpCode() != null) {
            dto.setOtp(session.getOtpCode());
            long remaining = Duration.between(LocalDateTime.now(), session.getOtpExpiresAt()).getSeconds();
            dto.setOtpRemainingSeconds(Math.max(0, remaining));
        } else {
            dto.setOtp(null);
            dto.setOtpRemainingSeconds(null);
        }

        dto.setTotalAmount(booking.getTotalAmount());
        dto.setStartDate(booking.getStartDate());
        dto.setEndDate(booking.getEndDate());

        return dto;
    }

    private GuidePreviewDTO buildGuidePreview(Booking booking, boolean canContact) {
        Guide guide = booking.getGuide();
        User guideUser = guide != null ? guide.getUser() : null;

        long tripsCompletedRaw = bookingRepository.countByGuide_IdAndStatus(
                guide.getId(),
                Booking.BookingStatus.COMPLETED
        );
        int tripsCompleted = (int) tripsCompletedRaw;

        BigDecimal earnings = bookingRepository.sumGuideEarningsByGuideId(
                guide.getId(),
                List.of(Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.COMPLETED)
        );

        BigDecimal rating = guide.getAverageRating() != null ? guide.getAverageRating() : BigDecimal.ZERO;
        int reviews = guide.getTotalReviews() != null ? guide.getTotalReviews() : 0;

        GuideStage stage = GuideStageUtil.getGuideStage(tripsCompleted, earnings, rating, reviews);

        GuidePreviewDTO preview = new GuidePreviewDTO();
        preview.setGuideId(guide.getId());
        preview.setFullName(guide.getFullName());
        preview.setProfileImageUrl(guide.getProfileImageUrl());
        preview.setAverageRating(rating);
        preview.setTotalReviews(reviews);
        preview.setGuideTier(stage.name());
        preview.setExperienceYears(guide.getExperienceYears());
        preview.setHourlyRate(guide.getHourlyRate());
        preview.setDailyRate(guide.getDailyRate());

        String phone = guideUser != null ? guideUser.getPhone() : null;
        preview.setPhoneMasked(canContact ? phone : maskPhone(phone));
        preview.setCanContact(canContact);
        return preview;
    }

    private boolean isBookingViewer(Booking booking, User viewer) {
        if (viewer == null) return false;
        return isUserOwner(booking, viewer) || isGuideUser(booking, viewer);
    }

    private boolean isUserOwner(Booking booking, User user) {
        return booking.getUser() != null && user != null && Objects.equals(booking.getUser().getId(), user.getId());
    }

    private boolean isGuideUser(Booking booking, User viewer) {
        return booking.getGuide() != null && booking.getGuide().getUser() != null
                && viewer != null && Objects.equals(booking.getGuide().getUser().getId(), viewer.getId());
    }

    private void addEvent(TripSession session, TripEventType type, String message,
                           Double latitude, Double longitude, Double accuracyMeters) {
        TripEvent event = new TripEvent();
        event.setTripSession(session);
        event.setEventType(type);
        event.setMessage(message);
        event.setLatitude(latitude);
        event.setLongitude(longitude);
        event.setAccuracyMeters(accuracyMeters);
        tripEventRepository.save(event);
    }

    private void publishTripUpdate(TripSession session, String eventType, String message) {
        if (session == null || session.getBooking() == null || session.getBooking().getId() == null) return;
        try {
            Long bookingId = session.getBooking().getId();
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("bookingId", bookingId);
            payload.put("tripSessionId", session.getId());
            payload.put("tripStatus", session.getTripStatus() != null ? session.getTripStatus().name() : null);
            payload.put("canStartTrip", session.getTripStatus() == TripStatus.READY_TO_START);
            payload.put("canGuideStartJourney", session.getTripStatus() == TripStatus.AWAITING_GUIDE);
            payload.put("canGuideMarkArrived", session.getTripStatus() == TripStatus.GUIDE_EN_ROUTE);
            payload.put("canGuideVerifyOtp", session.getTripStatus() == TripStatus.AWAITING_OTP);
            payload.put("eventType", eventType);
            payload.put("message", message);
            payload.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/trip-session/" + bookingId, payload);
        } catch (Exception ignored) {
            // Realtime updates are best-effort and must never block trip state transitions.
        }
    }

    /**
     * @param booking used to set OTP validity through the booking window (traveler sees code after pay until pickup)
     */
    private void setFreshOtp(TripSession session, Booking booking) {
        int otpInt = ThreadLocalRandom.current().nextInt(0, 1_000_000);
        String otpCode = String.format("%0" + OTP_LENGTH + "d", otpInt);

        byte[] saltBytes = new byte[16];
        secureRandom.nextBytes(saltBytes);
        String otpSalt = bytesToHex(saltBytes);

        String otpHash = sha256Hex(otpSalt + otpCode);

        session.setOtpSalt(otpSalt);
        session.setOtpHash(otpHash);
        session.setOtpCode(otpCode);
        session.setOtpVerifiedAt(null);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt;
        if (booking != null && booking.getEndDate() != null) {
            LocalDateTime tripEnd = booking.getEndDate().atTime(LocalTime.of(23, 59));
            LocalDateTime floor = now.plusMinutes(5);
            expiresAt = tripEnd.isBefore(floor) ? floor : tripEnd;
        } else {
            expiresAt = now.plusSeconds(OTP_TTL_SECONDS);
        }
        session.setOtpExpiresAt(expiresAt);
    }

    private int computeTripDurationMinutes(Booking booking) {
        long days = booking.getDurationInDays();
        if (days < 1) days = 1;
        // Approximate: 8 hours travel/day.
        return (int) Math.min(Integer.MAX_VALUE, days * 8 * 60);
    }

    private String maskPhone(String phone) {
        if (phone == null) return null;
        String p = phone.trim();
        if (p.isEmpty()) return null;
        // Keep last 2 digits for UX.
        if (p.length() <= 2) return "**";
        String last2 = p.substring(p.length() - 2);
        return "*".repeat(Math.max(0, p.length() - 2)) + last2;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute sha256", e);
        }
    }

    // Local helper for error messaging; keep controller response clean.
    @SuppressWarnings("unused")
    private TripSessionDTO unauthorized() {
        throw new RuntimeException("Unauthorized");
    }
}
