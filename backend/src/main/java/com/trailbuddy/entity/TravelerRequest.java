package com.trailbuddy.entity;

import com.trailbuddy.model.PreferenceProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "traveler_requests")
public class TravelerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "traveler_key", nullable = false, length = 80)
    private String travelerKey;

    /** FK-style user id — required by DB schema; kept in sync with {@link #travelerKey}. */
    @Column(name = "traveler_id", nullable = false)
    private Long travelerId;

    @Column(name = "free_text", nullable = false, columnDefinition = "TEXT")
    private String freeText;

    @Column(nullable = false, length = 80)
    private String duration;

    /** Legacy categorical budget (low/medium/high); prefer {@link #budgetRupees}. */
    @Column(length = 40)
    private String budget;

    /** Traveler budget in INR for this request. */
    @Column(name = "budget_rupees")
    private Integer budgetRupees;

    /** Guides in this city (and optionally state) see the request in their inbox. */
    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "selected_proposal_id")
    private Long selectedProposalId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "JSON", nullable = false)
    @Convert(converter = PreferenceProfileConverter.class)
    private PreferenceProfile preferenceProfile = new PreferenceProfile();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (preferenceProfile == null) {
            preferenceProfile = new PreferenceProfile();
        }
        city = normalizeGeo(city);
        state = normalizeGeo(state);
        if (state == null) {
            state = "";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTravelerKey() {
        return travelerKey;
    }

    public void setTravelerKey(String travelerKey) {
        this.travelerKey = travelerKey;
    }

    public Long getTravelerId() {
        return travelerId;
    }

    public void setTravelerId(Long travelerId) {
        this.travelerId = travelerId;
    }

    public String getFreeText() {
        return freeText;
    }

    public void setFreeText(String freeText) {
        this.freeText = freeText;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getBudget() {
        return budget;
    }

    public void setBudget(String budget) {
        this.budget = budget;
    }

    public Integer getBudgetRupees() {
        return budgetRupees;
    }

    public void setBudgetRupees(Integer budgetRupees) {
        this.budgetRupees = budgetRupees;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = normalizeGeo(city);
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = normalizeGeo(state);
    }

    public Long getSelectedProposalId() {
        return selectedProposalId;
    }

    public void setSelectedProposalId(Long selectedProposalId) {
        this.selectedProposalId = selectedProposalId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public PreferenceProfile getPreferenceProfile() {
        return preferenceProfile;
    }

    public void setPreferenceProfile(PreferenceProfile preferenceProfile) {
        this.preferenceProfile = preferenceProfile;
    }

    private String normalizeGeo(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ENGLISH);
    }
}
