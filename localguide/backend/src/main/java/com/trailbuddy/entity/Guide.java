package com.trailbuddy.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "guides")
@EntityListeners(AuditingEntityListener.class)
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // EAGER to avoid LazyInitializationException because open-in-view is disabled.
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "aadhar_number", length = 12, unique = true)
    private String aadharNumber;

    @Column(name = "aadhar_verified")
    private Boolean aadharVerified = false;

    @Lob
    private String bio;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> languages;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> expertiseAreas;

    @Column(name = "hourly_rate")
    private BigDecimal hourlyRate;

    @Column(name = "daily_rate")
    private BigDecimal dailyRate;

    @Column(name = "experience_years")
    private Integer experienceYears = 0;

    @Column(name = "total_bookings")
    private Integer totalBookings = 0;

    @Column(name = "average_rating")
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "is_approved")
    private Boolean isApproved = false;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(name = "verification_documents", columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> verificationDocuments;

    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Booking> bookings = new java.util.HashSet<>();

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Review> reviews = new java.util.HashSet<>();

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<GuideAvailability> availability = new java.util.HashSet<>();

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Story> stories = new java.util.HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Guide() {}

    public Guide(User user, String city, String state) {
        this.user = user;
        this.city = city;
        this.state = state;
    }

    // Getters and Setters
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

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }

    public Boolean getAadharVerified() {
        return aadharVerified;
    }

    public void setAadharVerified(Boolean aadharVerified) {
        this.aadharVerified = aadharVerified;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages;
    }

    public List<String> getExpertiseAreas() {
        return expertiseAreas;
    }

    public void setExpertiseAreas(List<String> expertiseAreas) {
        this.expertiseAreas = expertiseAreas;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public BigDecimal getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(BigDecimal dailyRate) {
        this.dailyRate = dailyRate;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public Integer getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(Integer totalBookings) {
        this.totalBookings = totalBookings;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public Boolean getIsApproved() {
        return isApproved;
    }

    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public List<String> getVerificationDocuments() {
        return verificationDocuments;
    }

    public void setVerificationDocuments(List<String> verificationDocuments) {
        this.verificationDocuments = verificationDocuments;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Set<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(Set<Booking> bookings) {
        this.bookings = bookings;
    }

    public Set<Review> getReviews() {
        return reviews;
    }

    public void setReviews(Set<Review> reviews) {
        this.reviews = reviews;
    }

    public Set<GuideAvailability> getAvailability() {
        return availability;
    }

    public void setAvailability(Set<GuideAvailability> availability) {
        this.availability = availability;
    }

    public Set<Story> getStories() {
        return stories;
    }

    public void setStories(Set<Story> stories) {
        this.stories = stories;
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

    // Helper methods
    public String getFullName() {
        return user != null ? user.getFullName() : "";
    }

    public String getEmail() {
        return user != null ? user.getEmail() : "";
    }

    public String getProfileImageUrl() {
        return user != null ? user.getProfileImageUrl() : null;
    }

    public boolean isWomenFriendly() {
        return languages != null && languages.contains("Hindi") && 
               expertiseAreas != null && expertiseAreas.contains("Cultural Tours");
    }

    @Override
    public String toString() {
        return "Guide{" +
                "id=" + id +
                ", user=" + (user != null ? user.getId() : null) +
                ", city='" + city + '\'' +
                ", state='" + state + '\'' +
                ", isVerified=" + isVerified +
                ", isApproved=" + isApproved +
                ", averageRating=" + averageRating +
                '}';
    }
}
