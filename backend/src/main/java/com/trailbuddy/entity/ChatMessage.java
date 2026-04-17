package com.trailbuddy.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnoreProperties({
            "password",
            "passwordHash",
            "authorities",
            "bookings",
            "reviews",
            "payments",
            "subscriptions",
            "sentMessages",
            "receivedMessages",
            "notifications",
            "storyLikes",
            "storyComments",
            "guide"
    })
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnoreProperties({
            "password",
            "passwordHash",
            "authorities",
            "bookings",
            "reviews",
            "payments",
            "subscriptions",
            "sentMessages",
            "receivedMessages",
            "notifications",
            "storyLikes",
            "storyComments",
            "guide"
    })
    private User receiver;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private MessageType type = MessageType.TEXT;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proposal_id")
    @JsonIgnoreProperties({"travelerRequest"})
    private GuideProposal proposal;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "read_status")
    private Boolean readStatus = false;

    // Constructors
    public ChatMessage() {}

    public ChatMessage(User sender, User receiver, String message) {
        this.sender = sender;
        this.receiver = receiver;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Boolean getReadStatus() {
        return readStatus;
    }

    public void setReadStatus(Boolean readStatus) {
        this.readStatus = readStatus;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public GuideProposal getProposal() {
        return proposal;
    }

    public void setProposal(GuideProposal proposal) {
        this.proposal = proposal;
    }

    public enum MessageType {
        TEXT,
        PROPOSAL
    }
}
