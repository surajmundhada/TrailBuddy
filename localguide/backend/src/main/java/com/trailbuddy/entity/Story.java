package com.trailbuddy.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "stories")
@EntityListeners(AuditingEntityListener.class)
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // EAGER because open-in-view is disabled; we need guide details for JSON responses.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guide_id", nullable = false)
    private Guide guide;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> images;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> tags;

    private String location;

    @Column(name = "is_public")
    private Boolean isPublic = true;

    @Column(name = "views_count")
    private Integer viewsCount = 0;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    private Integer commentsCount = 0;

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StoryLike> likes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StoryComment> comments = new java.util.ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Story() {}

    public Story(Guide guide, String title, String content) {
        this.guide = guide;
        this.title = title;
        this.content = content;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Guide getGuide() {
        return guide;
    }

    public void setGuide(Guide guide) {
        this.guide = guide;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public Integer getViewsCount() {
        return viewsCount;
    }

    public void setViewsCount(Integer viewsCount) {
        this.viewsCount = viewsCount;
    }

    public Integer getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(Integer likesCount) {
        this.likesCount = likesCount;
    }

    public Integer getCommentsCount() {
        return commentsCount;
    }

    public void setCommentsCount(Integer commentsCount) {
        this.commentsCount = commentsCount;
    }

    public List<StoryLike> getLikes() {
        return likes;
    }

    public void setLikes(List<StoryLike> likes) {
        this.likes = likes;
    }

    public List<StoryComment> getComments() {
        return comments;
    }

    public void setComments(List<StoryComment> comments) {
        this.comments = comments;
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
    public void incrementViews() {
        this.viewsCount++;
    }

    public void incrementLikes() {
        this.likesCount++;
    }

    public void decrementLikes() {
        if (this.likesCount > 0) {
            this.likesCount--;
        }
    }

    public void incrementComments() {
        this.commentsCount++;
    }

    public void decrementComments() {
        if (this.commentsCount > 0) {
            this.commentsCount--;
        }
    }

    public String getGuideName() {
        return guide != null ? guide.getFullName() : "Unknown Guide";
    }

    public String getGuideCity() {
        return guide != null ? guide.getCity() : "Unknown";
    }

    @Override
    public String toString() {
        return "Story{" +
                "id=" + id +
                ", guide=" + (guide != null ? guide.getId() : null) +
                ", title='" + title + '\'' +
                ", location='" + location + '\'' +
                ", isPublic=" + isPublic +
                ", viewsCount=" + viewsCount +
                ", likesCount=" + likesCount +
                ", commentsCount=" + commentsCount +
                '}';
    }
}
