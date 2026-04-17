package com.trailbuddy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TripSessionDTO {
    private Long tripSessionId;
    private Long bookingId;

    private String tripStatus;

    private Long otpRemainingSeconds;

    // User only: display OTP to share with guide to start the trip.
    private String otp;

    private GuidePreviewDTO guide;

    private BigDecimal totalAmount;
    private LocalDate startDate;
    private LocalDate endDate;

    private Boolean canStartTrip;
    private Boolean canGuideStartJourney;
    private Boolean canGuideMarkArrived;
    private Boolean canGuideVerifyOtp;
    private LocalDateTime guideStartedToPickupAt;
    private LocalDateTime guideArrivedAt;
    private LocalDateTime tripStartedAt;
    private Integer tripDurationMinutes;

    // Timer is computed on the client; this is just for UX.
    private Long elapsedSeconds;

    public Long getTripSessionId() {
        return tripSessionId;
    }

    public void setTripSessionId(Long tripSessionId) {
        this.tripSessionId = tripSessionId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getTripStatus() {
        return tripStatus;
    }

    public void setTripStatus(String tripStatus) {
        this.tripStatus = tripStatus;
    }

    public Long getOtpRemainingSeconds() {
        return otpRemainingSeconds;
    }

    public void setOtpRemainingSeconds(Long otpRemainingSeconds) {
        this.otpRemainingSeconds = otpRemainingSeconds;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public GuidePreviewDTO getGuide() {
        return guide;
    }

    public void setGuide(GuidePreviewDTO guide) {
        this.guide = guide;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Boolean getCanStartTrip() {
        return canStartTrip;
    }

    public void setCanStartTrip(Boolean canStartTrip) {
        this.canStartTrip = canStartTrip;
    }

    public Boolean getCanGuideStartJourney() {
        return canGuideStartJourney;
    }

    public void setCanGuideStartJourney(Boolean canGuideStartJourney) {
        this.canGuideStartJourney = canGuideStartJourney;
    }

    public Boolean getCanGuideMarkArrived() {
        return canGuideMarkArrived;
    }

    public void setCanGuideMarkArrived(Boolean canGuideMarkArrived) {
        this.canGuideMarkArrived = canGuideMarkArrived;
    }

    public Boolean getCanGuideVerifyOtp() {
        return canGuideVerifyOtp;
    }

    public void setCanGuideVerifyOtp(Boolean canGuideVerifyOtp) {
        this.canGuideVerifyOtp = canGuideVerifyOtp;
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

    public LocalDateTime getTripStartedAt() {
        return tripStartedAt;
    }

    public void setTripStartedAt(LocalDateTime tripStartedAt) {
        this.tripStartedAt = tripStartedAt;
    }

    public Integer getTripDurationMinutes() {
        return tripDurationMinutes;
    }

    public void setTripDurationMinutes(Integer tripDurationMinutes) {
        this.tripDurationMinutes = tripDurationMinutes;
    }

    public Long getElapsedSeconds() {
        return elapsedSeconds;
    }

    public void setElapsedSeconds(Long elapsedSeconds) {
        this.elapsedSeconds = elapsedSeconds;
    }
}
