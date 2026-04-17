package com.trailbuddy.util;

import com.trailbuddy.dto.GuideRevenueModelDTO;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.model.GuideStage;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds {@link GuideRevenueModelDTO} for API responses from guide metrics.
 */
public final class GuideRevenueModelAssembler {

    private static final BigDecimal PRO_EARNINGS = new BigDecimal("25000");
    private static final BigDecimal ELITE_RATING = new BigDecimal("4.5");
    private static final int PRO_TRIPS = 30;
    private static final int ELITE_TRIPS = 50;
    private static final int ELITE_REVIEWS = 20;

    private GuideRevenueModelAssembler() {}

    public static GuideRevenueModelDTO build(Guide guide, int tripsCompleted, BigDecimal totalEarnings) {
        GuideRevenueModelDTO dto = new GuideRevenueModelDTO();

        BigDecimal rating = guide.getAverageRating() != null ? guide.getAverageRating() : BigDecimal.ZERO;
        int reviews = guide.getTotalReviews() != null ? guide.getTotalReviews() : 0;
        BigDecimal earnings = totalEarnings != null ? totalEarnings : BigDecimal.ZERO;

        GuideStage stage = GuideStageUtil.getGuideStage(tripsCompleted, earnings, rating, reviews);
        dto.setStage(stage.name());
        dto.setTripsCompleted(tripsCompleted);
        dto.setTotalEarnings(earnings.setScale(2, RoundingMode.HALF_UP));
        dto.setAverageRating(rating.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalReviews(reviews);
        dto.setCommissionPercent(GuideStageUtil.commissionPercent(stage));

        switch (stage) {
            case BEGINNER -> {
                dto.setPlatformFeeSummary("₹0 platform fee");
                dto.setSubscriptionSummary("No monthly subscription");
                dto.setTripsProgressPercent(clampPercent(tripsCompleted, PRO_TRIPS));
                dto.setEarningsProgressPercent(clampPercent(earnings, PRO_EARNINGS));
                dto.setRatingProgressPercent(clampPercentRating(rating));
                dto.setReviewsProgressPercent(clampPercent(reviews, ELITE_REVIEWS));
            }
            case PRO -> {
                dto.setPlatformFeeSummary("₹0 platform fee");
                dto.setSubscriptionSummary("₹500 for month 1, then ₹1,500/month • 15% commission");
                dto.setTripsProgressPercent(clampPercent(tripsCompleted, ELITE_TRIPS));
                dto.setEarningsProgressPercent(100);
                dto.setRatingProgressPercent(clampPercentRating(rating));
                dto.setReviewsProgressPercent(clampPercent(reviews, ELITE_REVIEWS));
            }
            case ELITE -> {
                dto.setPlatformFeeSummary("₹0 platform fee");
                dto.setSubscriptionSummary("₹1,800/month • 10% commission (minimum)");
                dto.setTripsProgressPercent(100);
                dto.setEarningsProgressPercent(100);
                dto.setRatingProgressPercent(100);
                dto.setReviewsProgressPercent(100);
            }
        }

        dto.setProgressHints(computeHints(stage, tripsCompleted, earnings, rating, reviews));
        dto.setUpgradeBenefits(upgradeBenefits(stage));
        return dto;
    }

    private static int clampPercent(BigDecimal value, BigDecimal max) {
        if (max.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        BigDecimal pct = value.multiply(BigDecimal.valueOf(100)).divide(max, 2, RoundingMode.HALF_UP);
        int p = pct.intValue();
        return Math.min(100, Math.max(0, p));
    }

    private static int clampPercent(int value, int max) {
        if (max <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, (int) Math.round(value * 100.0 / max)));
    }

    /** Progress toward 4.5★ for Elite bar */
    private static int clampPercentRating(BigDecimal rating) {
        if (rating.compareTo(ELITE_RATING) >= 0) {
            return 100;
        }
        return clampPercent(rating, ELITE_RATING);
    }

    private static List<String> computeHints(
            GuideStage stage,
            int trips,
            BigDecimal earnings,
            BigDecimal rating,
            int reviews
    ) {
        List<String> hints = new ArrayList<>();
        switch (stage) {
            case BEGINNER -> {
                int tripsGap = Math.max(0, PRO_TRIPS - trips);
                BigDecimal earnGap = PRO_EARNINGS.subtract(earnings).max(BigDecimal.ZERO);
                if (tripsGap > 0) {
                    hints.add(tripsGap + " more completed trip" + (tripsGap == 1 ? "" : "s") + " to reach Pro (30 trips path)");
                }
                if (earnGap.compareTo(BigDecimal.ZERO) > 0) {
                    hints.add("Earn ₹" + earnGap.setScale(0, RoundingMode.HALF_UP) + " more from bookings to reach Pro (₹25,000 path)");
                }
                if (hints.isEmpty()) {
                    hints.add("Complete more trips or increase earnings to unlock Pro.");
                }
            }
            case PRO -> {
                int tGap = Math.max(0, ELITE_TRIPS - trips);
                int rGap = Math.max(0, ELITE_REVIEWS - reviews);
                if (rating.compareTo(ELITE_RATING) < 0) {
                    hints.add("Raise average rating to 4.5★ (currently " + rating.setScale(1, RoundingMode.HALF_UP) + ")");
                }
                if (tGap > 0) {
                    hints.add(tGap + " more completed trip" + (tGap == 1 ? "" : "s") + " for Elite (50 required)");
                }
                if (rGap > 0) {
                    hints.add(rGap + " more review" + (rGap == 1 ? "" : "s") + " for Elite (20 required)");
                }
                if (hints.isEmpty()) {
                    hints.add("You qualify for Elite on paper — stage updates on next sync.");
                }
            }
            case ELITE -> hints.add("You are on the Elite tier. Enjoy priority listing and the Top Guide badge.");
        }
        return hints;
    }

    private static List<String> upgradeBenefits(GuideStage stage) {
        return switch (stage) {
            case BEGINNER -> List.of(
                    "Pro: lower commission (15%) once you hit 30 trips or ₹25k earnings",
                    "Build reviews and rating to aim for Elite later"
            );
            case PRO -> List.of(
                    "Elite: 10% commission, priority listing, Top Guide badge",
                    "Requires 50 trips, 4.5★ rating, and 20 reviews together"
            );
            case ELITE -> List.of(
                    "Premium traveller visibility",
                    "Highest search placement and platform trust signals"
            );
        };
    }
}
