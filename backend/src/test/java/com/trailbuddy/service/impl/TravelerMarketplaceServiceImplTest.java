package com.trailbuddy.service.impl;

import com.trailbuddy.dto.CreateProposalPayload;
import com.trailbuddy.dto.CreateRequestPayload;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideProposal;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.TravelerRequest;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.ChatMessageRepository;
import com.trailbuddy.repository.GuideProposalRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.TravelerRequestRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.GuideService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TravelerMarketplaceServiceImplTest {

    @Mock private TravelerRequestRepository travelerRequestRepository;
    @Mock private GuideProposalRepository guideProposalRepository;
    @Mock private GuideRepository guideRepository;
    @Mock private BookingService bookingService;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private UserRepository userRepository;
    @Mock private GuideService guideService;

    @InjectMocks
    private TravelerMarketplaceServiceImpl service;

    @Test
    void createRequestNormalizesCityAndState() {
        User traveler = traveler(7L);
        CreateRequestPayload payload = new CreateRequestPayload();
        payload.setCity(" Nainital ");
        payload.setState(" Uttarakhand ");
        payload.setDuration("2-3 days");
        payload.setFreeText("Need trek and local food");
        payload.setBudgetRupees(12000);

        when(travelerRequestRepository.save(any(TravelerRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createRequest(payload, traveler);

        ArgumentCaptor<TravelerRequest> captor = ArgumentCaptor.forClass(TravelerRequest.class);
        verify(travelerRequestRepository).save(captor.capture());
        assertEquals("nainital", captor.getValue().getCity());
        assertEquals("uttarakhand", captor.getValue().getState());
        assertEquals(7L, captor.getValue().getTravelerId());
    }

    @Test
    void guideRequestsOnlyUseGuideCityAndApprovedGuide() {
        User guideUser = guideUser(11L);
        Guide guide = approvedGuide(3L, guideUser, "nainital");
        TravelerRequest request = new TravelerRequest();
        request.setId(21L);
        request.setTravelerId(7L);
        request.setTravelerKey("user-7");
        request.setCity("nainital");
        request.setState("uttarakhand");
        request.setDuration("2 days");
        request.setFreeText("Need a lake walk");

        when(guideService.resolveGuideProfile(guideUser)).thenReturn(guide);
        when(travelerRequestRepository.findForGuideCity("nainital")).thenReturn(List.of(request));
        when(guideProposalRepository.findByTravelerRequestIdOrderByCreatedAtDesc(21L)).thenReturn(List.of());

        List<?> results = service.getGuideRequests(guideUser);

        assertEquals(1, results.size());
        verify(travelerRequestRepository).findForGuideCity("nainital");
    }

    @Test
    void sendProposalCreatesProposalChatAndAcceptCreatesBooking() {
        User guideUser = guideUser(11L);
        User traveler = traveler(7L);
        Guide guide = approvedGuide(3L, guideUser, "nainital");
        TravelerRequest request = new TravelerRequest();
        request.setId(21L);
        request.setTravelerId(7L);
        request.setTravelerKey("user-7");
        request.setCity("nainital");
        request.setDuration("2 days");
        request.setFreeText("Need a relaxed trip");

        CreateProposalPayload payload = new CreateProposalPayload();
        payload.setRequestId(21L);
        payload.setTitle("Lake & market plan");
        payload.setDescription("Balanced local tour");
        payload.setItinerary("Day 1: Lake\nDay 2: Market");
        payload.setDays(2);
        payload.setPrice(9000);
        payload.setHighlights(List.of("lake", "market"));

        when(guideService.resolveGuideProfile(guideUser)).thenReturn(guide);
        when(travelerRequestRepository.findById(21L)).thenReturn(Optional.of(request));
        when(userRepository.findById(7L)).thenReturn(Optional.of(traveler));
        when(guideProposalRepository.save(any(GuideProposal.class))).thenAnswer(invocation -> {
            GuideProposal proposal = invocation.getArgument(0);
            if (proposal.getId() == null) {
                proposal.setId(99L);
            }
            return proposal;
        });
        when(guideRepository.findById(3L)).thenReturn(Optional.of(guide));

        service.sendProposal(payload, guideUser);

        ArgumentCaptor<ChatMessage> chatCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(chatCaptor.capture());
        assertEquals(ChatMessage.MessageType.PROPOSAL, chatCaptor.getValue().getType());

        Booking booking = new Booking();
        booking.setId(501L);
        when(guideProposalRepository.findById(99L)).thenReturn(Optional.of(guideProposal(request, guide, 99L)));
        when(bookingService.createBookingFromProposal(any(GuideProposal.class), any(User.class))).thenReturn(booking);

        var accepted = service.acceptProposal(99L, traveler);

        assertEquals(501L, accepted.get("bookingId"));
    }

    @Test
    void chatAllowedForTravelerGuidePairWithProposal() {
        User guideUser = guideUser(11L);
        User traveler = traveler(7L);
        Guide guide = approvedGuide(3L, guideUser, "nainital");

        when(guideRepository.findByUserId(11L)).thenReturn(Optional.of(guide));
        when(guideProposalRepository.findByTravelerIdAndGuideId(7L, 3L)).thenReturn(List.of(new GuideProposal()));

        assertTrue(service.canUsersChat(traveler, guideUser));
    }

    private GuideProposal guideProposal(TravelerRequest request, Guide guide, Long id) {
        GuideProposal proposal = new GuideProposal();
        proposal.setId(id);
        proposal.setTravelerRequest(request);
        proposal.setTravelerId(request.getTravelerId());
        proposal.setGuideId(guide.getId());
        proposal.setGuideName(guide.getFullName());
        proposal.setTitle("Lake & market plan");
        proposal.setDescription("Balanced local tour");
        proposal.setItinerary("Day 1\nDay 2");
        proposal.setDays(2);
        proposal.setDuration("2 days");
        proposal.setPrice(9000);
        proposal.setStatus(GuideProposal.ProposalStatus.PENDING);
        return proposal;
    }

    private User traveler(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("traveler@example.com");
        user.setFirstName("Travel");
        user.setLastName("User");
        Role role = new Role();
        role.setName(Role.RoleName.USER);
        user.setRoles(Set.of(role));
        return user;
    }

    private User guideUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("guide@example.com");
        user.setFirstName("Local");
        user.setLastName("Guide");
        Role role = new Role();
        role.setName(Role.RoleName.GUIDE);
        user.setRoles(Set.of(role));
        return user;
    }

    private Guide approvedGuide(Long guideId, User guideUser, String city) {
        Guide guide = new Guide();
        guide.setId(guideId);
        guide.setUser(guideUser);
        guide.setCity(city);
        guide.setState("uttarakhand");
        guide.setIsApproved(true);
        return guide;
    }
}
