package com.trailbuddy.entity;

import com.trailbuddy.model.TripStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "trip_sessions")
@EntityListeners(AuditingEntityListener.class)
public class TripSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A trip session is always created for a single booking.
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "trip_status", nullable = false, columnDefinition = "VARCHAR(32)")
    private TripStatus tripStatus = TripStatus.AWAITING_OTP;

    @Column(name = "otp_salt", nullable = false, length = 64)
    private String otpSalt;

    @Column(name = "otp_hash", nullable = false, length = 128)
    private String otpHash;

    // Display OTP to the trip owner only. Cleared after successful verification.
    // (We still verify using otpHash to keep the DB from being the single source of truth.)
    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expires_at", nullable = false)
    private LocalDateTime otpExpiresAt;

    @Column(name = "otp_verified_at")
    private LocalDateTime otpVerifiedAt;

    @Column(name = "guide_started_to_pickup_at")
    private LocalDateTime guideStartedToPickupAt;

    @Column(name = "guide_arrived_at")
    private LocalDateTime guideArrivedAt;

    @Column(name = "trip_started_at")
    private LocalDateTime tripStartedAt;

    @Column(name = "trip_completed_at")
    private LocalDateTime tripCompletedAt;

    // Location sharing / SOS support.
    @Column(name = "live_location_enabled", nullable = false)
    private Boolean liveLocationEnabled = false;

    @Column(name = "last_latitude")
    private Double lastLatitude;

    @Column(name = "last_longitude")
    private Double lastLongitude;

    @Column(name = "last_accuracy_m", length = 32)
    private Double lastAccuracyMeters;

    @Column(name = "last_location_updated_at")
    private LocalDateTime lastLocationUpdatedAt;

    @Column(name = "sos_triggered_at")
    private LocalDateTime sosTriggeredAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TripSession() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public TripStatus getTripStatus() {
        return tripStatus;
    }

    public void setTripStatus(TripStatus tripStatus) {
        this.tripStatus = tripStatus;
    }

    public String getOtpSalt() {
        return otpSalt;
    }

    public void setOtpSalt(String otpSalt) {
        this.otpSalt = otpSalt;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public LocalDateTime getOtpExpiresAt() {
        return otpExpiresAt;
    }

    public void setOtpExpiresAt(LocalDateTime otpExpiresAt) {
        this.otpExpiresAt = otpExpiresAt;
    }

    public LocalDateTime getOtpVerifiedAt() {
        return otpVerifiedAt;
    }

    public void setOtpVerifiedAt(LocalDateTime otpVerifiedAt) {
        this.otpVerifiedAt = otpVerifiedAt;
    }

    public LocalDateTime getTripStartedAt() {
        return tripStartedAt;
    }

    public LocalDateTime getGuideStartedToPickupAt() {
        return guideStartedToPickupAt;
    }

    public void setGuideStartedToPickupAt(LocalDateTime guideStartedToPickupAt) {
        this.guideStartedToPickupAt = guideStartedToPickupAt;
    }

    public LocalDateTime getGuideArrivedAt() {
        return guideArrivedAt;
    }

    public void setGuideArrivedAt(LocalDateTime guideArrivedAt) {
        this.guideArrivedAt = guideArrivedAt;
    }

    public void setTripStartedAt(LocalDateTime tripStartedAt) {
        this.tripStartedAt = tripStartedAt;
    }

    public LocalDateTime getTripCompletedAt() {
        return tripCompletedAt;
    }

    public void setTripCompletedAt(LocalDateTime tripCompletedAt) {
        this.tripCompletedAt = tripCompletedAt;
    }

    public Boolean getLiveLocationEnabled() {
        return liveLocationEnabled;
    }

    public void setLiveLocationEnabled(Boolean liveLocationEnabled) {
        this.liveLocationEnabled = liveLocationEnabled;
    }

    public Double getLastLatitude() {
        return lastLatitude;
    }

    public void setLastLatitude(Double lastLatitude) {
        this.lastLatitude = lastLatitude;
    }

    public Double getLastLongitude() {
        return lastLongitude;
    }

    public void setLastLongitude(Double lastLongitude) {
        this.lastLongitude = lastLongitude;
    }

    public Double getLastAccuracyMeters() {
        return lastAccuracyMeters;
    }

    public void setLastAccuracyMeters(Double lastAccuracyMeters) {
        this.lastAccuracyMeters = lastAccuracyMeters;
    }

    public LocalDateTime getLastLocationUpdatedAt() {
        return lastLocationUpdatedAt;
    }

    public void setLastLocationUpdatedAt(LocalDateTime lastLocationUpdatedAt) {
        this.lastLocationUpdatedAt = lastLocationUpdatedAt;
    }

    public LocalDateTime getSosTriggeredAt() {
        return sosTriggeredAt;
    }

    public void setSosTriggeredAt(LocalDateTime sosTriggeredAt) {
        this.sosTriggeredAt = sosTriggeredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
