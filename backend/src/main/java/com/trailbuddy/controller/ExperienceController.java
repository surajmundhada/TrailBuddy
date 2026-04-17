package com.trailbuddy.controller;

import com.trailbuddy.entity.Experience;
import com.trailbuddy.model.ExperienceCategory;
import com.trailbuddy.model.ExperienceScope;
import com.trailbuddy.repository.ExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/experiences")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExperienceController {

    @Autowired
    private ExperienceRepository experienceRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Experience> getExperienceById(@PathVariable Long id) {
        return experienceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/catalog/without-guide")
    public ResponseEntity<List<Experience>> getWithoutGuideCatalog() {
        return ResponseEntity.ok(experienceRepository.findByScope(ExperienceScope.WITHOUT_GUIDE));
    }

    @GetMapping("/catalog/without-guide/quick")
    public ResponseEntity<List<Experience>> getQuickExperiences() {
        return ResponseEntity.ok(
                experienceRepository.findByScopeAndCategory(
                        ExperienceScope.WITHOUT_GUIDE,
                        ExperienceCategory.QUICK_EXPERIENCE
                )
        );
    }

    @GetMapping("/catalog/without-guide/city-tours")
    public ResponseEntity<List<Experience>> getCityTours() {
        return ResponseEntity.ok(
                experienceRepository.findByScopeAndCategory(
                        ExperienceScope.WITHOUT_GUIDE,
                        ExperienceCategory.CITY_TOUR
                )
        );
    }

    @GetMapping("/catalog/trip-addon")
    public ResponseEntity<List<Experience>> getTripAddonCatalog() {
        return ResponseEntity.ok(experienceRepository.findByScope(ExperienceScope.TRIP_ADDON));
    }
}

