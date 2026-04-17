package com.trailbuddy.service.impl;

import com.trailbuddy.dto.TripSessionDTO;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.TripSession;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.TripStatus;
import com.trailbuddy.repository.*;
import com.trailbuddy.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripSessionServiceImplTest {

    @Mock private TripSessionRepository tripSessionRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingService bookingService;
    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private TripEventRepository tripEventRepository;
    @Mock private ExperienceRepository experienceRepository;
    @Mock private ExperiencePurchaseRepository experiencePurchaseRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @InjectMocks
    private TripSessionServiceImpl service;

    @Test
    void otpBookingFlowMovesThroughUberStyleStates() throws Exception {
        User traveler = user(10L, "traveler@test.com", "9999999999");
        User guideUser = user(20L, "guide@test.com", "8888888888");
        Guide guide = guide(7L, guideUser);
        Booking booking = booking(32L, traveler, guide);

        when(bookingRepository.findById(32L)).thenReturn(Optional.of(booking));
        when(bookingRepository.countByGuide_IdAndStatus(anyLong(), any())).thenReturn(2L);
        when(bookingRepository.sumGuideEarningsByGuideId(anyLong(), any())).thenReturn(BigDecimal.valueOf(4000));
        when(tripSessionRepository.findByBooking_Id(32L))
                .thenReturn(Optional.empty())
                .thenAnswer(invocation -> Optional.of(sessionHolder[0]));
        when(tripSessionRepository.save(any(TripSession.class))).thenAnswer(invocation -> {
            TripSession session = invocation.getArgument(0);
            if (session.getId() == null) {
                setId(session, 501L);
            }
            sessionHolder[0] = session;
            return session;
        });

        TripSessionDTO initial = service.getTripSessionForViewer(32L, traveler);
        assertEquals("AWAITING_GUIDE", initial.getTripStatus());
        assertNotNull(sessionHolder[0].getOtpSalt());
        assertNotNull(sessionHolder[0].getOtpHash());
        assertNotNull(sessionHolder[0].getOtpExpiresAt());

        TripSessionDTO enRoute = service.guideStartJourney(32L, guideUser);
        assertEquals("GUIDE_EN_ROUTE", enRoute.getTripStatus());
        assertEquals(TripStatus.GUIDE_EN_ROUTE, sessionHolder[0].getTripStatus());

        TripSessionDTO arrived = service.guideArrived(32L, guideUser);
        assertEquals("AWAITING_OTP", arrived.getTripStatus());
        String otp = sessionHolder[0].getOtpCode();
        assertNotNull(otp);
        assertEquals(TripStatus.AWAITING_OTP, sessionHolder[0].getTripStatus());

        assertDoesNotThrow(() -> service.verifyGuideOtp(32L, guideUser, otp));
        assertDoesNotThrow(() -> service.startTrip(32L, traveler));
        assertTrue(
                sessionHolder[0].getTripStatus() == TripStatus.TRIP_STARTED
                        || sessionHolder[0].getTripStatus() == TripStatus.TRIP_ONGOING
        );

        verify(bookingService, never()).completeBooking(32L);
    }

    private final TripSession[] sessionHolder = new TripSession[1];

    private User user(Long id, String email, String phone) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPhone(phone);
        return user;
    }

    private Guide guide(Long id, User user) {
        Guide guide = new Guide();
        guide.setId(id);
        guide.setUser(user);
        user.setFirstName("Demo");
        user.setLastName("Guide");
        guide.setAverageRating(BigDecimal.valueOf(4.8));
        guide.setTotalReviews(12);
        guide.setHourlyRate(BigDecimal.valueOf(600));
        guide.setDailyRate(BigDecimal.valueOf(4000));
        guide.setCity("Delhi");
        guide.setState("Delhi");
        return guide;
    }

    private Booking booking(Long id, User traveler, Guide guide) {
        Booking booking = new Booking();
        booking.setId(id);
        booking.setUser(traveler);
        booking.setGuide(guide);
        booking.setStartDate(LocalDate.now());
        booking.setEndDate(LocalDate.now().plusDays(1));
        booking.setTotalAmount(BigDecimal.valueOf(3200));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setGuideEarnings(BigDecimal.valueOf(2800));
        booking.setPlatformFee(BigDecimal.valueOf(400));
        return booking;
    }

    private void setId(TripSession session, Long id) throws Exception {
        Field field = TripSession.class.getDeclaredField("id");
        field.setAccessible(true);
        field.set(session, id);
    }
}
