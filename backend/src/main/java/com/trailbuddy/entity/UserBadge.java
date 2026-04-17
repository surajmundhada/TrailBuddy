package com.trailbuddy.entity;

import com.trailbuddy.model.BadgeType;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges")
@EntityListeners(AuditingEntityListener.class)
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false, length = 64)
    private BadgeType badgeType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_session_id")
    private TripSession tripSession;

    @CreatedDate
    @Column(name = "awarded_at", nullable = false, updatable = false)
    private LocalDateTime awardedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UserBadge() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BadgeType getBadgeType() {
        return badgeType;
    }

    public void setBadgeType(BadgeType badgeType) {
        this.badgeType = badgeType;
    }

    public TripSession getTripSession() {
        return tripSession;
    }

    public void setTripSession(TripSession tripSession) {
        this.tripSession = tripSession;
    }

    public LocalDateTime getAwardedAt() {
        return awardedAt;
    }

    public void setAwardedAt(LocalDateTime awardedAt) {
        this.awardedAt = awardedAt;
    }
}

