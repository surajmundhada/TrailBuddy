package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuidePackageRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.TripSessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private UserRepository userRepository;
    @Mock private GuideRepository guideRepository;
    @Mock private GuidePackageRepository guidePackageRepository;
    @Mock private TripSessionService tripSessionService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    @Test
    void guideBookingsUseAuthenticatedGuideUserIdDirectly() {
        User guideUser = guideUser(42L);
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Booking> expected = new PageImpl<>(List.of(new Booking()));

        when(bookingRepository.findByGuideUserId(42L, pageable)).thenReturn(expected);

        Page<Booking> result = bookingService.getBookingsForUser(guideUser, pageable);

        assertSame(expected, result);
        verify(bookingRepository).findByGuideUserId(42L, pageable);
    }

    @Test
    void guideCanLoadOwnedBookingWithoutGuideProfileLookup() {
        User guideUser = guideUser(42L);
        Booking booking = new Booking();

        when(bookingRepository.findByIdAndGuideUserId(88L, 42L)).thenReturn(Optional.of(booking));

        org.springframework.security.core.context.SecurityContextHolder.getContext()
                .setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        guideUser, null, guideUser.getAuthorities()
                ));
        try {
            Booking result = bookingService.getBookingById(88L);
            assertSame(booking, result);
            verify(bookingRepository).findByIdAndGuideUserId(88L, 42L);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    void mixedRoleUserCanLoadTravelerOwnedBookingForPaymentFlow() {
        User mixedRoleUser = userWithRoles(42L, Role.RoleName.USER, Role.RoleName.GUIDE);
        Booking travelerBooking = new Booking();
        travelerBooking.setId(91L);

        when(bookingRepository.findByIdAndUserId(91L, 42L)).thenReturn(Optional.of(travelerBooking));

        org.springframework.security.core.context.SecurityContextHolder.getContext()
                .setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        mixedRoleUser, null, mixedRoleUser.getAuthorities()
                ));
        try {
            Booking result = bookingService.getBookingById(91L);
            assertSame(travelerBooking, result);
            verify(bookingRepository).findByIdAndUserId(91L, 42L);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    void mixedRoleUserFallsBackToGuideOwnedBookingWhenTravelerBookingMissing() {
        User mixedRoleUser = userWithRoles(42L, Role.RoleName.USER, Role.RoleName.GUIDE);
        Booking guideBooking = new Booking();
        guideBooking.setId(92L);

        when(bookingRepository.findByIdAndUserId(92L, 42L)).thenReturn(Optional.empty());
        when(bookingRepository.findByIdAndGuideUserId(92L, 42L)).thenReturn(Optional.of(guideBooking));

        org.springframework.security.core.context.SecurityContextHolder.getContext()
                .setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        mixedRoleUser, null, mixedRoleUser.getAuthorities()
                ));
        try {
            Booking result = bookingService.getBookingById(92L);
            assertSame(guideBooking, result);
            verify(bookingRepository).findByIdAndUserId(92L, 42L);
            verify(bookingRepository).findByIdAndGuideUserId(92L, 42L);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    private User guideUser(Long id) {
        return userWithRoles(id, Role.RoleName.GUIDE);
    }

    private User userWithRoles(Long id, Role.RoleName... roleNames) {
        User user = new User();
        user.setId(id);
        Set<Role> roles = java.util.Arrays.stream(roleNames)
                .map(roleName -> {
                    Role role = new Role();
                    role.setName(roleName);
                    return role;
                })
                .collect(java.util.stream.Collectors.toSet());
        user.setRoles(roles);
        assertEquals(roleNames.length, roles.size());
        return user;
    }
}
