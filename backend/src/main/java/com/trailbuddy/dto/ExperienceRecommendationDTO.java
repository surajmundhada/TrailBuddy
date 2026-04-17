package com.trailbuddy.dto;

import com.trailbuddy.model.ExperienceCategory;
import com.trailbuddy.model.ExperienceScope;
import com.trailbuddy.model.ExperienceType;

public class ExperienceRecommendationDTO {
    private Long id;
    private String experienceKey;
    private String title;
    private Integer price;
    private Boolean isFree;

    private ExperienceScope scope;
    private ExperienceType type;
    private ExperienceCategory category;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getExperienceKey() {
        return experienceKey;
    }

    public void setExperienceKey(String experienceKey) {
        this.experienceKey = experienceKey;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public Boolean getIsFree() {
        return isFree;
    }

    public void setIsFree(Boolean isFree) {
        this.isFree = isFree;
    }

    public ExperienceScope getScope() {
        return scope;
    }

    public void setScope(ExperienceScope scope) {
        this.scope = scope;
    }

    public ExperienceType getType() {
        return type;
    }

    public void setType(ExperienceType type) {
        this.type = type;
    }

    public ExperienceCategory getCategory() {
        return category;
    }

    public void setCategory(ExperienceCategory category) {
        this.category = category;
    }
}

