package com.trailbuddy.controller;

import com.trailbuddy.dto.CreateProposalPayload;
import com.trailbuddy.dto.CreateRequestPayload;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.TravelerMarketplaceService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/marketplace")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TravelerMarketplaceController {

    private static final Logger log = LoggerFactory.getLogger(TravelerMarketplaceController.class);

    @Autowired
    private TravelerMarketplaceService travelerMarketplaceService;

    @PostMapping("/createRequest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createRequest(@Valid @RequestBody CreateRequestPayload payload, Authentication authentication) {
        try {
            return ResponseEntity.ok(travelerMarketplaceService.createRequest(payload, (User) authentication.getPrincipal()));
        } catch (Exception ex) {
            log.error("marketplace createRequest failed", ex);
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = ex.getClass().getSimpleName();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
        }
    }

    @GetMapping("/my-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyRequests(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getTravelerRequests((User) authentication.getPrincipal()));
    }

    @GetMapping("/incoming-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getIncomingRequests(Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getGuideRequests((User) authentication.getPrincipal()));
    }

    @PostMapping("/createProposal")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createProposal(@Valid @RequestBody CreateProposalPayload payload, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.sendProposal(payload, (User) authentication.getPrincipal()));
    }

    @GetMapping("/getProposals/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProposals(@PathVariable Long requestId, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.getProposals(requestId, (User) authentication.getPrincipal()));
    }

    @PostMapping("/selectProposal/{proposalId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> selectProposal(@PathVariable Long proposalId, Authentication authentication) {
        return ResponseEntity.ok(travelerMarketplaceService.acceptProposal(proposalId, (User) authentication.getPrincipal()));
    }
}
