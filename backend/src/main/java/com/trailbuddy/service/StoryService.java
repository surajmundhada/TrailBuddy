package com.trailbuddy.service;

import com.trailbuddy.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

public interface StoryService {
    Page<Story> getAllStories(Pageable pageable);
    Story getStoryById(Long id);
    Story createStory(Story story, Authentication authentication);
    Story updateStory(Long id, Story story, Authentication authentication);
    void deleteStory(Long id, Authentication authentication);
    Page<Story> getStoriesByGuide(Long guideId, Pageable pageable);
}
