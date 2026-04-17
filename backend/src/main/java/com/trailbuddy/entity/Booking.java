package com.trailbuddy.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.trailbuddy.model.QuotationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
@EntityListeners(AuditingEntityListener.class)
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guide_id", nullable = false)
    private Guide guide;

    @Column(name = "start_date", nullable = false)
    @NotNull
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    @NotNull
    private LocalDate endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "total_amount", nullable = false)
    @NotNull
    private BigDecimal totalAmount;

    @Column(name = "platform_fee", nullable = false)
    @NotNull
    private BigDecimal platformFee;

    @Column(name = "guide_earnings", nullable = false)
    @NotNull
    private BigDecimal guideEarnings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "special_requirements", columnDefinition = "TEXT")
    private String specialRequirements;

    /** JSON: e.g. {"avoid":["museums"],"wants":["trek","food"]} */
    @Column(name = "traveler_preferences", columnDefinition = "TEXT")
    private String travelerPreferences;

    /** Guide's curated plan + inclusions (shown to traveler with quotation). */
    @Column(name = "guide_curated_quotation", columnDefinition = "TEXT")
    private String guideCuratedQuotation;

    @Enumerated(EnumType.STRING)
    @Column(name = "quotation_status", nullable = false, length = 32)
    private QuotationStatus quotationStatus = QuotationStatus.NONE;

    /** When set, this trip was booked as a fixed-price listed experience (Hidden Gems / guide package). */
    @Column(name = "guide_package_id")
    private Long guidePackageId;

    @Column(name = "traveler_request_id")
    private Long travelerRequestId;

    @Column(name = "proposal_id")
    private Long proposalId;

    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Payment payment;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Review review;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.Set<ChatMessage> chatMessages = new java.util.HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Booking() {}

    public Booking(User user, Guide guide, LocalDate startDate, LocalDate endDate, 
                   BigDecimal totalAmount, BigDecimal platformFee, BigDecimal guideEarnings) {
        this.user = user;
        this.guide = guide;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalAmount = totalAmount;
        this.platformFee = platformFee;
        this.guideEarnings = guideEarnings;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Guide getGuide() {
        return guide;
    }

    public void setGuide(Guide guide) {
        this.guide = guide;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(BigDecimal platformFee) {
        this.platformFee = platformFee;
    }

    public BigDecimal getGuideEarnings() {
        return guideEarnings;
    }

    public void setGuideEarnings(BigDecimal guideEarnings) {
        this.guideEarnings = guideEarnings;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getSpecialRequirements() {
        return specialRequirements;
    }

    public void setSpecialRequirements(String specialRequirements) {
        this.specialRequirements = specialRequirements;
    }

    public String getTravelerPreferences() {
        return travelerPreferences;
    }

    public void setTravelerPreferences(String travelerPreferences) {
        this.travelerPreferences = travelerPreferences;
    }

    public String getGuideCuratedQuotation() {
        return guideCuratedQuotation;
    }

    public void setGuideCuratedQuotation(String guideCuratedQuotation) {
        this.guideCuratedQuotation = guideCuratedQuotation;
    }

    public QuotationStatus getQuotationStatus() {
        return quotationStatus;
    }

    public void setQuotationStatus(QuotationStatus quotationStatus) {
        this.quotationStatus = quotationStatus;
    }

    public Long getGuidePackageId() {
        return guidePackageId;
    }

    public void setGuidePackageId(Long guidePackageId) {
        this.guidePackageId = guidePackageId;
    }

    public Long getTravelerRequestId() {
        return travelerRequestId;
    }

    public void setTravelerRequestId(Long travelerRequestId) {
        this.travelerRequestId = travelerRequestId;
    }

    public Long getProposalId() {
        return proposalId;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }

    public java.util.Set<ChatMessage> getChatMessages() {
        return chatMessages;
    }

    public void setChatMessages(java.util.Set<ChatMessage> chatMessages) {
        this.chatMessages = chatMessages;
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
    public boolean isCompleted() {
        return status == BookingStatus.COMPLETED;
    }

    public boolean isCancelled() {
        return status == BookingStatus.CANCELLED;
    }

    public boolean isConfirmed() {
        return status == BookingStatus.CONFIRMED;
    }

    public boolean isPending() {
        return status == BookingStatus.PENDING;
    }

    public long getDurationInDays() {
        return java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "id=" + id +
                ", user=" + (user != null ? user.getId() : null) +
                ", guide=" + (guide != null ? guide.getId() : null) +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", totalAmount=" + totalAmount +
                ", status=" + status +
                '}';
    }

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        CANCELLED,
        COMPLETED,
        REFUNDED
    }
}
