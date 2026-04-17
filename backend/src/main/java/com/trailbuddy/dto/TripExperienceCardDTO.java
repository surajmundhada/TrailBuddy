package com.trailbuddy.dto;

public class TripExperienceCardDTO {
    private Long experienceId;
    private String experienceKey;
    private String title;
    private String type;

    // 0 => free
    private Integer price;

    private Boolean unlocked;
    private Boolean locked;

    // CTA for UI (e.g. "Unlock for ₹29")
    private String ctaLabel;

    public String getExperienceKey() {
        return experienceKey;
    }

    public void setExperienceKey(String experienceKey) {
        this.experienceKey = experienceKey;
    }

    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public Boolean getUnlocked() {
        return unlocked;
    }

    public void setUnlocked(Boolean unlocked) {
        this.unlocked = unlocked;
    }

    public Boolean getLocked() {
        return locked;
    }

    public void setLocked(Boolean locked) {
        this.locked = locked;
    }

    public String getCtaLabel() {
        return ctaLabel;
    }

    public void setCtaLabel(String ctaLabel) {
        this.ctaLabel = ctaLabel;
    }
}

