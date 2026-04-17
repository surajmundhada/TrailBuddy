package com.trailbuddy.controller;

import com.trailbuddy.dto.GuidePackagePayload;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.GuidePackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/guide-packages")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GuidePackageController {

    @Autowired
    private GuidePackageService guidePackageService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPackages() {
        return ResponseEntity.ok(guidePackageService.getPackages());
    }

    /** Public catalog — MMT/Airbnb-style browse; same payload as {@link #getPackages()}. */
    @GetMapping("/explore")
    public ResponseEntity<?> explorePackages() {
        return ResponseEntity.ok(guidePackageService.getPackages());
    }

    @GetMapping("/by-guide/{guideId}")
    public ResponseEntity<?> getPackagesForGuide(@PathVariable Long guideId) {
        return ResponseEntity.ok(guidePackageService.getPackagesForGuide(guideId));
    }

    /** Public — single experience listing (same shape as explore cards). Path avoids clashing with /explore. */
    @GetMapping("/listing/{id}")
    public ResponseEntity<?> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(guidePackageService.getPackageById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> createPackage(@RequestBody GuidePackagePayload payload, Authentication authentication) {
        return ResponseEntity.ok(guidePackageService.createPackage(payload, (User) authentication.getPrincipal()));
    }
}
