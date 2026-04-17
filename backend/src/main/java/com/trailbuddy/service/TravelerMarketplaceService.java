package com.trailbuddy.service;

import com.trailbuddy.dto.CreateProposalPayload;
import com.trailbuddy.dto.CreateRequestPayload;
import com.trailbuddy.entity.User;

import java.util.List;
import java.util.Map;

public interface TravelerMarketplaceService {

    Map<String, Object> createRequest(CreateRequestPayload payload, User traveler);

    List<Map<String, Object>> getTravelerRequests(User traveler);

    List<Map<String, Object>> getIncomingRequests(User viewer);

    List<Map<String, Object>> getGuideRequests(User guideUser);

    Map<String, Object> createProposal(CreateProposalPayload payload, User viewer);

    Map<String, Object> sendProposal(CreateProposalPayload payload, User guideUser);

    List<Map<String, Object>> getProposals(Long requestId, User viewer);

    List<Map<String, Object>> getTravelerProposals(User traveler);

    List<Map<String, Object>> getGuideProposals(User guideUser);

    Map<String, Object> selectProposal(Long proposalId, User traveler);

    Map<String, Object> acceptProposal(Long proposalId, User traveler);

    Map<String, Object> rejectProposal(Long proposalId, User traveler);

    boolean canUsersChat(User firstUser, User secondUser);
}
