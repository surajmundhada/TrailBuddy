package com.trailbuddy.repository;

import com.trailbuddy.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    Page<Story> findByGuideId(Long guideId, Pageable pageable);
}
