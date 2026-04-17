package com.trailbuddy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateRequestPayload {

    /** Optional; server always binds the authenticated traveler. */
    private String travelerKey;

    @NotBlank
    private String freeText;

    @NotBlank
    private String duration;

    @NotBlank
    private String city;

    /** Optional: when blank, any guide in the city may respond. */
    private String state;

    @NotNull
    @Min(1)
    private Integer budgetRupees;

    public String getTravelerKey() {
        return travelerKey;
    }

    public void setTravelerKey(String travelerKey) {
        this.travelerKey = travelerKey;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Integer getBudgetRupees() {
        return budgetRupees;
    }

    public void setBudgetRupees(Integer budgetRupees) {
        this.budgetRupees = budgetRupees;
    }
}
