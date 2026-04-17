package com.trailbuddy.model;

/**
 * Curated booking flow: traveler shares preferences, guide sends a quotation, traveler accepts then pays.
 */
public enum QuotationStatus {
    /** Instant pricing (legacy) — no separate quotation step. */
    NONE,
    /** Waiting for the guide to send a price and curated plan. */
    AWAITING_GUIDE,
    /** Guide submitted quotation; traveler must accept or decline. */
    SENT,
    /** Traveler accepted — proceed to payment. */
    ACCEPTED,
    /** Traveler declined or cancelled the quoted trip. */
    DECLINED
}
