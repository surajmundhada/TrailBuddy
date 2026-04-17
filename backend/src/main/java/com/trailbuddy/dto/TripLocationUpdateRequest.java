package com.trailbuddy.dto;

public class TripLocationUpdateRequest {
    private Double latitude;
    private Double longitude;
    private Double accuracyMeters;
    private Boolean liveLocationEnabled;

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getAccuracyMeters() {
        return accuracyMeters;
    }

    public void setAccuracyMeters(Double accuracyMeters) {
        this.accuracyMeters = accuracyMeters;
    }

    public Boolean getLiveLocationEnabled() {
        return liveLocationEnabled;
    }

    public void setLiveLocationEnabled(Boolean liveLocationEnabled) {
        this.liveLocationEnabled = liveLocationEnabled;
    }
}

