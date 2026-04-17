package com.trailbuddy.controller;

import com.trailbuddy.entity.Story;
import com.trailbuddy.service.StoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/stories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StoriesController {

    private static final Logger logger = LoggerFactory.getLogger(StoriesController.class);

    @Autowired
    private StoryService storyService;

    @GetMapping
    public ResponseEntity<Page<Story>> getAllStories(Pageable pageable) {
        logger.info("Getting all stories");
        Page<Story> stories = storyService.getAllStories(pageable);
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Story> getStoryById(@PathVariable Long id) {
        logger.info("Getting story by id: {}", id);
        Story story = storyService.getStoryById(id);
        return ResponseEntity.ok(story);
    }

    @PostMapping
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<Story> createStory(@Valid @RequestBody Story story, Authentication authentication) {
        logger.info("Creating new story");
        Story createdStory = storyService.createStory(story, authentication);
        return ResponseEntity.ok(createdStory);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<Story> updateStory(@PathVariable Long id, @Valid @RequestBody Story story, Authentication authentication) {
        logger.info("Updating story with id: {}", id);
        Story updatedStory = storyService.updateStory(id, story, authentication);
        return ResponseEntity.ok(updatedStory);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<Void> deleteStory(@PathVariable Long id, Authentication authentication) {
        logger.info("Deleting story with id: {}", id);
        storyService.deleteStory(id, authentication);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/guide/{guideId}")
    public ResponseEntity<Page<Story>> getStoriesByGuide(@PathVariable Long guideId, Pageable pageable) {
        logger.info("Getting stories for guide: {}", guideId);
        Page<Story> stories = storyService.getStoriesByGuide(guideId, pageable);
        return ResponseEntity.ok(stories);
    }
}
