package com.trailbuddy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class CreateProposalPayload {

    @NotNull
    private Long requestId;

    private Long guideId;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String itinerary;

    @NotNull
    private Integer price;

    @NotNull
    private Integer days;

    private Boolean isBoosted = false;

    private List<String> highlights = new ArrayList<>();

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getGuideId() {
        return guideId;
    }

    public void setGuideId(Long guideId) {
        this.guideId = guideId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getItinerary() {
        return itinerary;
    }

    public void setItinerary(String itinerary) {
        this.itinerary = itinerary;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public Boolean getIsBoosted() {
        return isBoosted;
    }

    public void setIsBoosted(Boolean boosted) {
        isBoosted = boosted;
    }

    public List<String> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<String> highlights) {
        this.highlights = highlights;
    }
}
