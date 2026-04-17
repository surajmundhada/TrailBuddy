package com.trailbuddy.entity;

import com.trailbuddy.model.ExperienceCategory;
import com.trailbuddy.model.ExperienceScope;
import com.trailbuddy.model.ExperienceType;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "experiences")
@EntityListeners(AuditingEntityListener.class)
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experience_key", nullable = false, unique = true, length = 64)
    private String experienceKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExperienceScope scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExperienceType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private ExperienceCategory category;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Integer price = 0;

    @Column(name = "is_free", nullable = false)
    private Boolean isFree = false;

    @Column(name = "city", length = 80)
    private String city;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> images;

    @Column(columnDefinition = "JSON")
    @Convert(converter = ListStringConverter.class)
    private List<String> tags;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Experience() {}

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
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

