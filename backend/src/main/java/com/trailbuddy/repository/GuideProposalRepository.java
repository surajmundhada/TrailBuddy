package com.trailbuddy.repository;

import com.trailbuddy.entity.GuideProposal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuideProposalRepository extends JpaRepository<GuideProposal, Long> {

    List<GuideProposal> findByTravelerRequestId(Long travelerRequestId);

    List<GuideProposal> findByTravelerRequestIdOrderByCreatedAtDesc(Long travelerRequestId);

    List<GuideProposal> findByTravelerIdOrderByCreatedAtDesc(Long travelerId);

    List<GuideProposal> findByGuideIdOrderByCreatedAtDesc(Long guideId);

    List<GuideProposal> findByTravelerIdAndGuideId(Long travelerId, Long guideId);
}
