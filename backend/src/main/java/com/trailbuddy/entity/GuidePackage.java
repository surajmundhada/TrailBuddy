package com.trailbuddy.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "guide_packages")
public class GuidePackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guide_id", nullable = false)
    private Guide guide;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 80)
    private String duration;

    @Column(nullable = false)
    private Integer price;

    @Convert(converter = ListStringConverter.class)
    @Column(name = "famous_spots", columnDefinition = "JSON", nullable = false)
    private List<String> famousSpots = new ArrayList<>();

    @Convert(converter = ListStringConverter.class)
    @Column(name = "hidden_spots", columnDefinition = "JSON", nullable = false)
    private List<String> hiddenSpots = new ArrayList<>();

    @Convert(converter = ListStringConverter.class)
    @Column(name = "food_places", columnDefinition = "JSON", nullable = false)
    private List<String> foodPlaces = new ArrayList<>();

    /** Typical meet-up (Airbnb Experiences–style). */
    @Column(name = "meeting_point", length = 280)
    private String meetingPoint;

    @Column(name = "max_guests")
    private Integer maxGuests;

    /** Short “hosted by” line for the listing card. */
    @Column(name = "host_intro", columnDefinition = "TEXT")
    private String hostIntro;

    @Convert(converter = ListStringConverter.class)
    @Column(name = "languages", columnDefinition = "JSON", nullable = false)
    private List<String> languages = new ArrayList<>();

    @Convert(converter = ListStringConverter.class)
    @Column(name = "whats_included", columnDefinition = "JSON", nullable = false)
    private List<String> whatsIncluded = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Guide getGuide() { return guide; }
    public void setGuide(Guide guide) { this.guide = guide; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
    public List<String> getFamousSpots() { return famousSpots; }
    public void setFamousSpots(List<String> famousSpots) { this.famousSpots = famousSpots; }
    public List<String> getHiddenSpots() { return hiddenSpots; }
    public void setHiddenSpots(List<String> hiddenSpots) { this.hiddenSpots = hiddenSpots; }
    public List<String> getFoodPlaces() { return foodPlaces; }
    public void setFoodPlaces(List<String> foodPlaces) { this.foodPlaces = foodPlaces; }
    public String getMeetingPoint() { return meetingPoint; }
    public void setMeetingPoint(String meetingPoint) { this.meetingPoint = meetingPoint; }
    public Integer getMaxGuests() { return maxGuests; }
    public void setMaxGuests(Integer maxGuests) { this.maxGuests = maxGuests; }
    public String getHostIntro() { return hostIntro; }
    public void setHostIntro(String hostIntro) { this.hostIntro = hostIntro; }
    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) { this.languages = languages; }
    public List<String> getWhatsIncluded() { return whatsIncluded; }
    public void setWhatsIncluded(List<String> whatsIncluded) { this.whatsIncluded = whatsIncluded; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
