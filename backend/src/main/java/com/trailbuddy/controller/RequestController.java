package com.trailbuddy.controller;

import com.trailbuddy.dto.CreateRequestPayload;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.TravelerMarketplaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RequestController {

    @Autowired
    private TravelerMarketplaceService travelerMarketplaceService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createRequest(@Valid @RequestBody CreateRequestPayload payload, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.createRequest(payload, (User) authentication.getPrincipal()));
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyRequests(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getTravelerRequests((User) authentication.getPrincipal()));
    }

    @GetMapping("/for-guides")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> getRequestsForGuides(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getGuideRequests((User) authentication.getPrincipal()));
    }
}
