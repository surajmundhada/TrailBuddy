package com.trailbuddy.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_comments")
@EntityListeners(AuditingEntityListener.class)
public class StoryComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "comment_text", nullable = false, columnDefinition = "TEXT")
    private String commentText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private StoryComment parentComment;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<StoryComment> replies = new java.util.ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public StoryComment() {}

    public StoryComment(Story story, User user, String commentText) {
        this.story = story;
        this.user = user;
        this.commentText = commentText;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Story getStory() {
        return story;
    }

    public void setStory(Story story) {
        this.story = story;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public StoryComment getParentComment() {
        return parentComment;
    }

    public void setParentComment(StoryComment parentComment) {
        this.parentComment = parentComment;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public java.util.List<StoryComment> getReplies() {
        return replies;
    }

    public void setReplies(java.util.List<StoryComment> replies) {
        this.replies = replies;
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
    public boolean isReply() {
        return parentComment != null;
    }

    public String getUserFullName() {
        return user != null ? user.getFullName() : "Anonymous";
    }

    public void softDelete() {
        this.isDeleted = true;
        this.commentText = "[deleted]";
    }

    @Override
    public String toString() {
        return "StoryComment{" +
                "id=" + id +
                ", story=" + (story != null ? story.getId() : null) +
                ", user=" + (user != null ? user.getId() : null) +
                ", parentComment=" + (parentComment != null ? parentComment.getId() : null) +
                ", isDeleted=" + isDeleted +
                '}';
    }
}
