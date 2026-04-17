package com.trailbuddy.util;

import com.trailbuddy.model.GuideStage;

import java.math.BigDecimal;

/**
 * Computes a guide's revenue stage from performance metrics.
 */
public final class GuideStageUtil {

    private static final BigDecimal ELITE_RATING_MIN = new BigDecimal("4.5");
    private static final int ELITE_TRIPS_MIN = 50;
    private static final int ELITE_REVIEWS_MIN = 20;
    private static final int PRO_TRIPS_MIN = 30;
    private static final BigDecimal PRO_EARNINGS_MIN = new BigDecimal("25000");

    private GuideStageUtil() {}

    /**
     * @param trips     completed trips (bookings)
     * @param earnings  cumulative guide earnings (INR)
     * @param rating    average rating (0–5)
     * @param reviews   total review count
     */
    public static GuideStage getGuideStage(int trips, BigDecimal earnings, BigDecimal rating, int reviews) {
        BigDecimal r = rating != null ? rating : BigDecimal.ZERO;
        BigDecimal e = earnings != null ? earnings : BigDecimal.ZERO;

        if (trips >= ELITE_TRIPS_MIN
                && r.compareTo(ELITE_RATING_MIN) >= 0
                && reviews >= ELITE_REVIEWS_MIN) {
            return GuideStage.ELITE;
        }
        if (trips >= PRO_TRIPS_MIN || e.compareTo(PRO_EARNINGS_MIN) >= 0) {
            return GuideStage.PRO;
        }
        return GuideStage.BEGINNER;
    }

    public static int commissionPercent(GuideStage stage) {
        return switch (stage) {
            case BEGINNER -> 18;
            case PRO -> 15;
            case ELITE -> 10;
        };
    }
}
