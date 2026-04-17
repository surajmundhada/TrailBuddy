package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Story;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.StoryRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.service.StoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class StoryServiceImpl implements StoryService {

    private static final Logger logger = LoggerFactory.getLogger(StoryServiceImpl.class);

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Override
    public Page<Story> getAllStories(Pageable pageable) {
        return storyRepository.findAll(pageable);
    }

    @Override
    public Story getStoryById(Long id) {
        return storyRepository.findById(id).orElseThrow(() -> 
            new RuntimeException("Story not found with id: " + id));
    }

    @Override
    public Story createStory(Story story, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        Guide guide = guideRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Guide not found for current user"));

        story.setGuide(guide);
        return storyRepository.save(story);
    }

    @Override
    public Story updateStory(Long id, Story story, Authentication authentication) {
        Story existingStory = getStoryById(id);
        User currentUser = (User) authentication.getPrincipal();
        
        if (!existingStory.getGuide().getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only update your own stories");
        }
        
        story.setId(id);
        // Keep the existing guide
        story.setGuide(existingStory.getGuide());
        return storyRepository.save(story);
    }

    @Override
    public void deleteStory(Long id, Authentication authentication) {
        Story existingStory = getStoryById(id);
        User currentUser = (User) authentication.getPrincipal();
        
        if (!existingStory.getGuide().getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own stories");
        }
        
        storyRepository.delete(existingStory);
    }

    @Override
    public Page<Story> getStoriesByGuide(Long guideId, Pageable pageable) {
        return storyRepository.findByGuideId(guideId, pageable);
    }
}
