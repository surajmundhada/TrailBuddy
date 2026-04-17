package com.trailbuddy.model;

import java.util.ArrayList;
import java.util.List;

public class PreferenceProfile {

    private List<String> activities = new ArrayList<>();
    private List<String> avoid = new ArrayList<>();
    private List<String> interests = new ArrayList<>();
    private String vibe = "balanced";

    public List<String> getActivities() {
        return activities;
    }

    public void setActivities(List<String> activities) {
        this.activities = activities;
    }

    public List<String> getAvoid() {
        return avoid;
    }

    public void setAvoid(List<String> avoid) {
        this.avoid = avoid;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests;
    }

    public String getVibe() {
        return vibe;
    }

    public void setVibe(String vibe) {
        this.vibe = vibe;
    }
}
