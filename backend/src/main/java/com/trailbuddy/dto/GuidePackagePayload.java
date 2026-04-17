package com.trailbuddy.dto;

import java.util.ArrayList;
import java.util.List;

public class GuidePackagePayload {
    private String title;
    private String description;
    private String city;
    private String duration;
    private Integer price;
    private List<String> famousSpots = new ArrayList<>();
    private List<String> hiddenSpots = new ArrayList<>();
    private List<String> foodPlaces = new ArrayList<>();
    private String meetingPoint;
    private Integer maxGuests;
    private String hostIntro;
    private List<String> languages = new ArrayList<>();
    private List<String> whatsIncluded = new ArrayList<>();

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
}
