package com.trailbuddy.controller;

import com.trailbuddy.dto.CreateProposalPayload;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.TravelerMarketplaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/proposals")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProposalController {

    @Autowired
    private TravelerMarketplaceService travelerMarketplaceService;

    @PostMapping("/send")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> sendProposal(@Valid @RequestBody CreateProposalPayload payload, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.sendProposal(payload, (User) authentication.getPrincipal()));
    }

    @GetMapping("/traveler")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTravelerProposals(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getTravelerProposals((User) authentication.getPrincipal()));
    }

    @GetMapping("/guide")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<?> getGuideProposals(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getGuideProposals((User) authentication.getPrincipal()));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> acceptProposal(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.acceptProposal(id, (User) authentication.getPrincipal()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> rejectProposal(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.rejectProposal(id, (User) authentication.getPrincipal()));
    }
}
