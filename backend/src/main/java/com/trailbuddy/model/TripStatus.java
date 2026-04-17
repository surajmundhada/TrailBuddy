package com.trailbuddy.model;

/**
 * Server-side trip lifecycle states.
 *
 * UI mapping:
 * - AWAITING_OTP: traveler sees OTP; guide verifies to go live (Rapido/Uber-style).
 * - READY_TO_START: legacy only (old flow); use Start Trip API to normalize to TRIP_ONGOING.
 * - TRIP_STARTED: legacy intermediate; may auto-advance to TRIP_ONGOING after a grace window.
 * - TRIP_ONGOING: live trip (OTP verified sets this directly on the happy path).
 * - TRIP_COMPLETED: trip ended (enables reviews)
 */
public enum TripStatus {
    AWAITING_GUIDE,
    GUIDE_EN_ROUTE,
    GUIDE_ARRIVED,
    AWAITING_OTP,
    READY_TO_START,
    TRIP_STARTED,
    TRIP_ONGOING,
    TRIP_COMPLETED
}
