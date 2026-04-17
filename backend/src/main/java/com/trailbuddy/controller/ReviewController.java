package com.trailbuddy.controller;

import com.trailbuddy.entity.User;
import com.trailbuddy.service.ReviewQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReviewController {

    @Autowired
    private ReviewQueryService reviewQueryService;

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMyReviews(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(reviewQueryService.getReviewsForCurrentUser(user));
    }

    @GetMapping("/guide/{guideId}")
    public ResponseEntity<List<Map<String, Object>>> getGuideReviews(@PathVariable Long guideId) {
        return ResponseEntity.ok(reviewQueryService.getPublicReviewsForGuide(guideId));
    }
}
