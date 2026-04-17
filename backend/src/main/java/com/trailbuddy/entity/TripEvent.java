package com.trailbuddy.entity;

import com.trailbuddy.model.TripEventType;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "trip_events")
@EntityListeners(AuditingEntityListener.class)
public class TripEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trip_session_id", nullable = false)
    private TripSession tripSession;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64, columnDefinition = "VARCHAR(64)")
    private TripEventType eventType;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "accuracy_m")
    private Double accuracyMeters;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TripEvent() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TripSession getTripSession() {
        return tripSession;
    }

    public void setTripSession(TripSession tripSession) {
        this.tripSession = tripSession;
    }

    public TripEventType getEventType() {
        return eventType;
    }

    public void setEventType(TripEventType eventType) {
        this.eventType = eventType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

