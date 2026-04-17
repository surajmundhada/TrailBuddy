package com.trailbuddy.service.impl;

import com.trailbuddy.dto.CreateProposalPayload;
import com.trailbuddy.dto.CreateRequestPayload;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.ChatMessage;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuideProposal;
import com.trailbuddy.entity.TravelerRequest;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.PreferenceProfile;
import com.trailbuddy.repository.ChatMessageRepository;
import com.trailbuddy.repository.GuideProposalRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.TravelerRequestRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.GuideService;
import com.trailbuddy.service.TravelerMarketplaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class TravelerMarketplaceServiceImpl implements TravelerMarketplaceService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final Map<String, List<String>> KEYWORD_GROUPS = Map.of(
            "trek", List.of("trek", "hike", "hiking", "trail", "mountain"),
            "food", List.of("food", "street food", "local food", "eat", "cuisine", "cafe"),
            "culture", List.of("culture", "heritage", "history", "temple", "fort", "architecture"),
            "nature", List.of("nature", "waterfall", "forest", "sunrise", "sunset", "lake"),
            "adventure", List.of("adventure", "camp", "cycling", "rafting", "climb"),
            "relax", List.of("relax", "slow", "chill", "peaceful", "wellness")
    );

    @Autowired
    private TravelerRequestRepository travelerRequestRepository;

    @Autowired
    private GuideProposalRepository guideProposalRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideService guideService;

    @Override
    @Transactional
    public Map<String, Object> createRequest(CreateRequestPayload payload, User traveler) {
        String city = payload.getCity() == null ? "" : payload.getCity().trim();
        if (city.isEmpty()) {
            throw new RuntimeException("City is required");
        }
        String state = payload.getState() == null ? "" : payload.getState().trim();
        Integer rupees = payload.getBudgetRupees();
        if (rupees == null || rupees < 1) {
            throw new RuntimeException("Budget (₹) must be at least 1");
        }

        TravelerRequest request = new TravelerRequest();
        request.setTravelerId(traveler.getId());
        request.setTravelerKey(travelerKey(traveler));
        request.setFreeText(payload.getFreeText());
        request.setDuration(payload.getDuration());
        request.setCity(city);
        request.setState(state);
        request.setBudgetRupees(rupees);
        request.setBudget(String.valueOf(rupees));
        request.setPreferenceProfile(parsePreferenceProfile(payload.getFreeText()));
        TravelerRequest saved = travelerRequestRepository.save(request);
        return mapRequest(saved, List.of(), true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTravelerRequests(User traveler) {
        return travelerRequestRepository.findByTravelerIdOrderByCreatedAtDesc(traveler.getId()).stream()
                .map(request -> mapRequest(
                        request,
                        guideProposalRepository.findByTravelerRequestIdOrderByCreatedAtDesc(request.getId()),
                        true
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getIncomingRequests(User viewer) {
        return getGuideRequests(viewer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getGuideRequests(User guideUser) {
        Guide guide = requireApprovedGuide(guideUser);
        return travelerRequestRepository.findForGuideCity(guide.getCity()).stream()
                .map(request -> mapRequest(
                        request,
                        guideProposalRepository.findByTravelerRequestIdOrderByCreatedAtDesc(request.getId()),
                        false
                ))
                .toList();
    }

    /** Traveler targets a city; optionally state must match too. Guide city is compared case-insensitively. */
    private boolean requestVisibleToGuide(TravelerRequest request, Guide guide) {
        String reqCity = normalizeGeo(request.getCity());
        if (reqCity.isEmpty()) {
            return false;
        }
        String guideCity = normalizeGeo(guide.getCity());
        if (!reqCity.equals(guideCity)) {
            return false;
        }
        String reqState = request.getState() == null ? "" : request.getState().trim();
        if (reqState.isEmpty()) {
            return true;
        }
        return normalizeGeo(guide.getState()).equals(normalizeGeo(reqState));
    }

    private static String normalizeGeo(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ENGLISH);
    }

    @Override
    public Map<String, Object> createProposal(CreateProposalPayload payload, User viewer) {
        return sendProposal(payload, viewer);
    }

    @Override
    @Transactional
    public Map<String, Object> sendProposal(CreateProposalPayload payload, User viewer) {
        Guide guide = requireApprovedGuide(viewer);
        TravelerRequest request = travelerRequestRepository.findById(payload.getRequestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Traveler request not found"));

        if (!normalizeGeo(request.getCity()).equals(normalizeGeo(guide.getCity()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guide can only send proposals to requests in their city");
        }

        GuideProposal proposal = new GuideProposal();
        proposal.setTravelerRequest(request);
        proposal.setTravelerId(request.getTravelerId());
        proposal.setGuideId(guide.getId());
        proposal.setGuideName(guide.getFullName());
        proposal.setTitle(payload.getTitle());
        proposal.setDescription(payload.getDescription());
        proposal.setItinerary(payload.getItinerary());
        proposal.setDays(payload.getDays());
        proposal.setDuration(payload.getDays() + (payload.getDays() == 1 ? " day" : " days"));
        proposal.setPrice(payload.getPrice());
        proposal.setStatus(GuideProposal.ProposalStatus.PENDING);
        proposal.setIsBoosted(Boolean.TRUE.equals(payload.getIsBoosted()));
        proposal.setHighlights(cleanHighlights(payload.getHighlights()));

        GuideProposal saved = guideProposalRepository.save(proposal);
        createProposalMessage(saved, guide.getUser(), request.getTravelerId());
        return mapProposal(saved, request.getPreferenceProfile(), request.getSelectedProposalId());
    }

    @Override
    public List<Map<String, Object>> getProposals(Long requestId, User viewer) {
        TravelerRequest request = travelerRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Traveler request not found"));

        Guide guide = guideRepository.findByUserId(viewer.getId()).orElse(null);
        if (guide == null && viewer.isGuide()) {
            try {
                guide = guideService.resolveGuideProfile(viewer);
            } catch (Exception ignored) {
                guide = null;
            }
        }
        boolean canView = Objects.equals(request.getTravelerId(), viewer.getId())
                || (guide != null
                && Boolean.TRUE.equals(guide.getIsApproved())
                && normalizeGeo(request.getCity()).equals(normalizeGeo(guide.getCity())));
        if (!canView) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized access to proposals");
        }

        return guideProposalRepository.findByTravelerRequestIdOrderByCreatedAtDesc(requestId).stream()
                .sorted(compareProposals(request.getPreferenceProfile()))
                .map(proposal -> mapProposal(proposal, request.getPreferenceProfile(), request.getSelectedProposalId()))
                .toList();
    }

    @Override
    public Map<String, Object> selectProposal(Long proposalId, User traveler) {
        return acceptProposal(proposalId, traveler);
    }

    @Override
    @Transactional
    public Map<String, Object> acceptProposal(Long proposalId, User traveler) {
        GuideProposal proposal = guideProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
        TravelerRequest request = proposal.getTravelerRequest();
        if (!Objects.equals(request.getTravelerId(), traveler.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized proposal selection");
        }
        if (proposal.getStatus() != GuideProposal.ProposalStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proposal is already " + proposal.getStatus());
        }

        request.setSelectedProposalId(proposalId);
        travelerRequestRepository.save(request);
        proposal.setStatus(GuideProposal.ProposalStatus.ACCEPTED);
        Booking booking = bookingService.createBookingFromProposal(proposal, traveler);
        proposal.setBookingId(booking.getId());
        guideProposalRepository.save(proposal);
        return Map.of(
                "requestId", request.getId(),
                "proposalId", proposalId,
                "guideId", proposal.getGuideId(),
                "bookingId", booking.getId(),
                "message", "Proposal accepted and booking created"
        );
    }

    @Override
    @Transactional
    public Map<String, Object> rejectProposal(Long proposalId, User traveler) {
        GuideProposal proposal = guideProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
        if (!Objects.equals(proposal.getTravelerId(), traveler.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized proposal rejection");
        }
        if (proposal.getStatus() == GuideProposal.ProposalStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accepted proposal cannot be rejected");
        }
        proposal.setStatus(GuideProposal.ProposalStatus.REJECTED);
        guideProposalRepository.save(proposal);
        return Map.of(
                "proposalId", proposalId,
                "requestId", proposal.getTravelerRequest().getId(),
                "message", "Proposal rejected"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTravelerProposals(User traveler) {
        return guideProposalRepository.findByTravelerIdOrderByCreatedAtDesc(traveler.getId()).stream()
                .map(proposal -> mapProposal(
                        proposal,
                        proposal.getTravelerRequest().getPreferenceProfile(),
                        proposal.getTravelerRequest().getSelectedProposalId()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getGuideProposals(User guideUser) {
        Guide guide = requireApprovedGuide(guideUser);
        return guideProposalRepository.findByGuideIdOrderByCreatedAtDesc(guide.getId()).stream()
                .map(proposal -> mapProposal(
                        proposal,
                        proposal.getTravelerRequest().getPreferenceProfile(),
                        proposal.getTravelerRequest().getSelectedProposalId()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUsersChat(User firstUser, User secondUser) {
        if (firstUser == null || secondUser == null || Objects.equals(firstUser.getId(), secondUser.getId())) {
            return false;
        }

        User guideUser = firstUser.isGuide() ? firstUser : secondUser.isGuide() ? secondUser : null;
        User traveler = guideUser == firstUser ? secondUser : firstUser;
        if (guideUser == null) {
            return false;
        }

        Optional<Guide> guideOpt = guideRepository.findByUserId(guideUser.getId());
        if (guideOpt.isEmpty() && guideUser.isGuide()) {
            try {
                guideOpt = Optional.of(guideService.resolveGuideProfile(guideUser));
            } catch (Exception ignored) {
                guideOpt = Optional.empty();
            }
        }
        if (guideOpt.isEmpty() || !Boolean.TRUE.equals(guideOpt.get().getIsApproved())) {
            return false;
        }

        return !guideProposalRepository.findByTravelerIdAndGuideId(traveler.getId(), guideOpt.get().getId()).isEmpty();
    }

    private Guide requireApprovedGuide(User viewer) {
        if (!viewer.isGuide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only guides can access this endpoint");
        }
        Guide guide;
        try {
            guide = guideService.resolveGuideProfile(viewer);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guide profile not found");
        }
        if (!Boolean.TRUE.equals(guide.getIsApproved())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only approved guides can access this endpoint");
        }
        return guide;
    }

    private void createProposalMessage(GuideProposal proposal, User sender, Long travelerId) {
        User traveler = userRepository.findById(travelerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Traveler not found"));

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setReceiver(traveler);
        message.setMessage("Shared itinerary proposal: " + proposal.getTitle());
        message.setTimestamp(LocalDateTime.now());
        message.setReadStatus(false);
        message.setType(ChatMessage.MessageType.PROPOSAL);
        message.setProposal(proposal);
        chatMessageRepository.save(message);
    }

    private Map<String, Object> mapRequest(TravelerRequest request, List<GuideProposal> proposals, boolean includeProposals) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("travelerKey", request.getTravelerKey());
        response.put("travelerId", request.getTravelerId());
        response.put("freeText", request.getFreeText());
        response.put("duration", request.getDuration());
        response.put("city", request.getCity());
        response.put("state", request.getState() != null ? request.getState() : "");
        Integer rupees = request.getBudgetRupees();
        if (rupees != null && rupees > 0) {
            response.put("budgetRupees", rupees);
            response.put("budget", rupees);
        } else {
            response.put("budgetRupees", null);
            response.put("budget", request.getBudget());
        }
        response.put("selectedProposalId", request.getSelectedProposalId());
        response.put("createdAt", request.getCreatedAt() != null ? request.getCreatedAt().format(DATE_TIME_FORMATTER) : null);
        response.put("preferences", mapPreferenceProfile(request.getPreferenceProfile()));
        response.put("proposalCount", proposals.size());
        response.put("selectedProposal", proposals.stream()
                .filter(p -> Objects.equals(p.getId(), request.getSelectedProposalId()))
                .findFirst()
                .map(p -> mapProposal(p, request.getPreferenceProfile(), request.getSelectedProposalId()))
                .orElse(null));
        if (includeProposals) {
            response.put("proposals", proposals.stream()
                    .sorted(compareProposals(request.getPreferenceProfile()))
                    .map(p -> mapProposal(p, request.getPreferenceProfile(), request.getSelectedProposalId()))
                    .toList());
        }
        return response;
    }

    private Map<String, Object> mapProposal(GuideProposal proposal, PreferenceProfile preferenceProfile, Long selectedProposalId) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", proposal.getId());
        response.put("requestId", proposal.getTravelerRequest().getId());
        response.put("guideId", proposal.getGuideId());
        response.put("guideUserId", guideRepository.findById(proposal.getGuideId()).map(g -> g.getUser().getId()).orElse(null));
        response.put("travelerId", proposal.getTravelerId());
        response.put("guideName", proposal.getGuideName());
        response.put("title", proposal.getTitle());
        response.put("description", proposal.getDescription());
        response.put("itinerary", proposal.getItinerary());
        response.put("days", proposal.getDays());
        response.put("duration", proposal.getDuration());
        response.put("price", proposal.getPrice());
        response.put("status", proposal.getStatus().name());
        response.put("bookingId", proposal.getBookingId());
        response.put("isBoosted", Boolean.TRUE.equals(proposal.getIsBoosted()));
        response.put("highlights", proposal.getHighlights() == null ? List.of() : proposal.getHighlights());
        response.put("createdAt", proposal.getCreatedAt() != null ? proposal.getCreatedAt().format(DATE_TIME_FORMATTER) : null);
        response.put("relevanceScore", calculateRelevanceScore(proposal, preferenceProfile));
        response.put("selected", Objects.equals(selectedProposalId, proposal.getId()));
        return response;
    }

    private Map<String, Object> mapPreferenceProfile(PreferenceProfile profile) {
        PreferenceProfile value = profile != null ? profile : new PreferenceProfile();
        return Map.of(
                "activities", value.getActivities(),
                "avoid", value.getAvoid(),
                "interests", value.getInterests(),
                "vibe", value.getVibe()
        );
    }

    private PreferenceProfile parsePreferenceProfile(String freeText) {
        String normalized = freeText == null ? "" : freeText.toLowerCase(Locale.ENGLISH);
        PreferenceProfile profile = new PreferenceProfile();
        profile.setActivities(extractMatches(normalized, Map.of(
                "trek", List.of("trek", "hike", "hiking"),
                "food crawl", List.of("food", "street food", "eat"),
                "market walk", List.of("market", "bazaar"),
                "nature walk", List.of("nature", "forest", "waterfall"),
                "culture trail", List.of("heritage", "history", "culture", "temple", "fort")
        )));
        profile.setAvoid(extractMatches(normalized, Map.of(
                "museums", List.of("museum", "museums"),
                "crowds", List.of("crowd", "crowded"),
                "shopping", List.of("shopping", "mall"),
                "nightlife", List.of("nightlife", "club", "pub")
        )));
        profile.setInterests(extractMatches(normalized, KEYWORD_GROUPS));
        profile.setVibe(detectVibe(normalized));
        return profile;
    }

    private List<String> extractMatches(String normalized, Map<String, List<String>> dictionary) {
        Set<String> tags = new LinkedHashSet<>();
        dictionary.forEach((label, variants) -> {
            boolean matched = variants.stream().anyMatch(normalized::contains);
            boolean negated = variants.stream().anyMatch(variant -> normalized.contains("no " + variant) || normalized.contains("avoid " + variant));
            if (matched && !negated) {
                tags.add(label);
            }
            if (matched && negated) {
                tags.add(label);
            }
        });
        return new ArrayList<>(tags);
    }

    private String detectVibe(String normalized) {
        if (normalized.contains("relax") || normalized.contains("calm") || normalized.contains("slow")) {
            return "relaxed";
        }
        if (normalized.contains("adventure") || normalized.contains("trek") || normalized.contains("fast")) {
            return "adventurous";
        }
        if (normalized.contains("food") || normalized.contains("local")) {
            return "local";
        }
        return "balanced";
    }

    private Comparator<GuideProposal> compareProposals(PreferenceProfile profile) {
        return Comparator
                .comparing((GuideProposal proposal) -> !Boolean.TRUE.equals(proposal.getIsBoosted()))
                .thenComparing((GuideProposal proposal) -> calculateRelevanceScore(proposal, profile), Comparator.reverseOrder())
                .thenComparing(GuideProposal::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private int calculateRelevanceScore(GuideProposal proposal, PreferenceProfile profile) {
        String haystack = String.join(" ",
                safe(proposal.getTitle()),
                safe(proposal.getDescription()),
                safe(proposal.getItinerary()),
                String.join(" ", proposal.getHighlights() == null ? List.of() : proposal.getHighlights())
        ).toLowerCase(Locale.ENGLISH);

        int score = 0;
        if (profile != null) {
            score += scoreKeywords(haystack, profile.getActivities(), 3);
            score += scoreKeywords(haystack, profile.getInterests(), 2);
            score -= scoreKeywords(haystack, profile.getAvoid(), 4);
            String vibe = profile.getVibe();
            if (vibe != null && !vibe.isBlank() && haystack.contains(vibe.toLowerCase(Locale.ENGLISH))) {
                score += 2;
            }
        }
        if (Boolean.TRUE.equals(proposal.getIsBoosted())) {
            score += 5;
        }
        return score;
    }

    private int scoreKeywords(String haystack, List<String> values, int points) {
        if (values == null) return 0;
        return (int) values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .filter(haystack::contains)
                .count() * points;
    }

    private List<String> cleanHighlights(List<String> highlights) {
        if (highlights == null) return List.of();
        return highlights.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .limit(6)
                .toList();
    }

    private String travelerKey(User traveler) {
        return "user-" + traveler.getId();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
