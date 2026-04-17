package com.trailbuddy.dto;

import java.util.List;

public class PostTripResponseDTO {
    private List<String> badgeTypes;
    private List<ExperienceRecommendationDTO> recommendations;
    /** True when the traveler can submit a rating for this booking. */
    private Boolean canSubmitReview;
    /** True when a review already exists. */
    private Boolean hasReview;
    private Long reviewId;

    public List<String> getBadgeTypes() {
        return badgeTypes;
    }

    public void setBadgeTypes(List<String> badgeTypes) {
        this.badgeTypes = badgeTypes;
    }

    public List<ExperienceRecommendationDTO> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<ExperienceRecommendationDTO> recommendations) {
        this.recommendations = recommendations;
    }

    public Boolean getCanSubmitReview() {
        return canSubmitReview;
    }

    public void setCanSubmitReview(Boolean canSubmitReview) {
        this.canSubmitReview = canSubmitReview;
    }

    public Boolean getHasReview() {
        return hasReview;
    }

    public void setHasReview(Boolean hasReview) {
        this.hasReview = hasReview;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }
}

