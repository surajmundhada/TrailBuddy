package com.trailbuddy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "guide_proposals")
public class GuideProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private TravelerRequest travelerRequest;

    @Column(name = "guide_id")
    private Long guideId;

    @Column(name = "traveler_id", nullable = false)
    private Long travelerId;

    @Column(name = "guide_name", nullable = false, length = 120)
    private String guideName;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 80)
    private String duration;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String itinerary;

    @Column(nullable = false)
    private Integer days;

    @Column(nullable = false)
    private Integer price;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProposalStatus status = ProposalStatus.PENDING;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "is_boosted", nullable = false)
    private Boolean isBoosted = false;

    @Column(columnDefinition = "JSON", nullable = false)
    @Convert(converter = ListStringConverter.class)
    private List<String> highlights = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TravelerRequest getTravelerRequest() {
        return travelerRequest;
    }

    public void setTravelerRequest(TravelerRequest travelerRequest) {
        this.travelerRequest = travelerRequest;
    }

    public String getGuideName() {
        return guideName;
    }

    public Long getGuideId() {
        return guideId;
    }

    public void setGuideId(Long guideId) {
        this.guideId = guideId;
    }

    public Long getTravelerId() {
        return travelerId;
    }

    public void setTravelerId(Long travelerId) {
        this.travelerId = travelerId;
    }

    public void setGuideName(String guideName) {
        this.guideName = guideName;
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

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public void setStatus(ProposalStatus status) {
        this.status = status;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public enum ProposalStatus {
        PENDING,
        ACCEPTED,
        REJECTED
    }
}
