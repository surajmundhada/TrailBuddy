package com.trailbuddy.dto;

import java.time.LocalDateTime;
import java.time.LocalDate;

public class BookingDTO {
    private Long id;
    private Long userId;
    private Long guideId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double amount;
    private Integer passengerCount;
    private Boolean needsVehicle;
    private Boolean vehicleAc;
    private Double distanceKm;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** When true, pricing is deferred: guide must send a curated quotation first. */
    private Boolean useCuratedQuotation;

    /** Book a published guide package (fixed price, Airbnb-style experience). */
    private Long guidePackageId;

    /**
     * Traveler preferences (JSON string recommended), e.g.
     * {"avoid":["museums"],"wants":["trek","street food"]}
     */
    private String travelerPreferences;

    // Constructors
    public BookingDTO() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getGuideId() {
        return guideId;
    }

    public void setGuideId(Long guideId) {
        this.guideId = guideId;
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

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Integer getPassengerCount() {
        return passengerCount;
    }

    public void setPassengerCount(Integer passengerCount) {
        this.passengerCount = passengerCount;
    }

    public Boolean getNeedsVehicle() {
        return needsVehicle;
    }

    public void setNeedsVehicle(Boolean needsVehicle) {
        this.needsVehicle = needsVehicle;
    }

    public Boolean getVehicleAc() {
        return vehicleAc;
    }

    public void setVehicleAc(Boolean vehicleAc) {
        this.vehicleAc = vehicleAc;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Boolean getUseCuratedQuotation() {
        return useCuratedQuotation;
    }

    public void setUseCuratedQuotation(Boolean useCuratedQuotation) {
        this.useCuratedQuotation = useCuratedQuotation;
    }

    public Long getGuidePackageId() {
        return guidePackageId;
    }

    public void setGuidePackageId(Long guidePackageId) {
        this.guidePackageId = guidePackageId;
    }

    public String getTravelerPreferences() {
        return travelerPreferences;
    }

    public void setTravelerPreferences(String travelerPreferences) {
        this.travelerPreferences = travelerPreferences;
    }
}
