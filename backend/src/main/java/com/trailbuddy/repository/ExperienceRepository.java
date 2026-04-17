package com.trailbuddy.repository;

import com.trailbuddy.entity.Experience;
import com.trailbuddy.model.ExperienceScope;
import com.trailbuddy.model.ExperienceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    Optional<Experience> findByExperienceKey(String experienceKey);
    List<Experience> findByScope(ExperienceScope scope);
    List<Experience> findByScopeAndCategory(ExperienceScope scope, ExperienceCategory category);
}

