package com.trailbuddy.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Snapshot for the Revenue Model UI: stage, metrics, and progress toward the next tier.
 */
public class GuideRevenueModelDTO {

    private String stage;
    private int tripsCompleted;
    private BigDecimal totalEarnings;
    private BigDecimal averageRating;
    private int totalReviews;
    private int commissionPercent;

    /** e.g. "₹0 platform fee" */
    private String platformFeeSummary;
    /** Subscription line for Pro / Elite */
    private String subscriptionSummary;

    private int tripsProgressPercent;
    private int earningsProgressPercent;
    private int ratingProgressPercent;
    private int reviewsProgressPercent;

    private List<String> progressHints = new ArrayList<>();
    private List<String> upgradeBenefits = new ArrayList<>();

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public int getTripsCompleted() {
        return tripsCompleted;
    }

    public void setTripsCompleted(int tripsCompleted) {
        this.tripsCompleted = tripsCompleted;
    }

    public BigDecimal getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(BigDecimal totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public int getCommissionPercent() {
        return commissionPercent;
    }

    public void setCommissionPercent(int commissionPercent) {
        this.commissionPercent = commissionPercent;
    }

    public String getPlatformFeeSummary() {
        return platformFeeSummary;
    }

    public void setPlatformFeeSummary(String platformFeeSummary) {
        this.platformFeeSummary = platformFeeSummary;
    }

    public String getSubscriptionSummary() {
        return subscriptionSummary;
    }

    public void setSubscriptionSummary(String subscriptionSummary) {
        this.subscriptionSummary = subscriptionSummary;
    }

    public int getTripsProgressPercent() {
        return tripsProgressPercent;
    }

    public void setTripsProgressPercent(int tripsProgressPercent) {
        this.tripsProgressPercent = tripsProgressPercent;
    }

    public int getEarningsProgressPercent() {
        return earningsProgressPercent;
    }

    public void setEarningsProgressPercent(int earningsProgressPercent) {
        this.earningsProgressPercent = earningsProgressPercent;
    }

    public int getRatingProgressPercent() {
        return ratingProgressPercent;
    }

    public void setRatingProgressPercent(int ratingProgressPercent) {
        this.ratingProgressPercent = ratingProgressPercent;
    }

    public int getReviewsProgressPercent() {
        return reviewsProgressPercent;
    }

    public void setReviewsProgressPercent(int reviewsProgressPercent) {
        this.reviewsProgressPercent = reviewsProgressPercent;
    }

    public List<String> getProgressHints() {
        return progressHints;
    }

    public void setProgressHints(List<String> progressHints) {
        this.progressHints = progressHints;
    }

    public List<String> getUpgradeBenefits() {
        return upgradeBenefits;
    }

    public void setUpgradeBenefits(List<String> upgradeBenefits) {
        this.upgradeBenefits = upgradeBenefits;
    }
}
