package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.ReviewRepository;
import com.trailbuddy.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuideServiceImplTest {

    @Mock private GuideRepository guideRepository;
    @Mock private UserRepository userRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private ReviewRepository reviewRepository;

    @InjectMocks
    private GuideServiceImpl guideService;

    @Test
    void resolveGuideProfileRelinksSingleNameMatchWhenDirectLinkMissing() {
        User loggedInUser = new User();
        loggedInUser.setId(55L);
        loggedInUser.setFirstName("yash");
        loggedInUser.setLastName("agiwal");

        User staleUser = new User();
        staleUser.setId(10L);
        staleUser.setFirstName("yash");
        staleUser.setLastName("agiwal");

        Guide guide = new Guide();
        guide.setId(5L);
        guide.setUser(staleUser);

        when(guideRepository.findByUserId(55L)).thenReturn(Optional.empty());
        when(guideRepository.findByUserFullName("yash", "agiwal")).thenReturn(List.of(guide));
        when(guideRepository.save(guide)).thenReturn(guide);

        Guide resolved = guideService.resolveGuideProfile(loggedInUser);

        assertSame(guide, resolved);
        assertSame(loggedInUser, guide.getUser());
        verify(guideRepository).save(guide);
    }
}
