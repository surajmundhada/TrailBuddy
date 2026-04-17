package com.trailbuddy.controller;

import com.trailbuddy.entity.User;
import com.trailbuddy.service.DigiLockerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/digilocker")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DigiLockerController {

    private static final Logger logger = LoggerFactory.getLogger(DigiLockerController.class);

    @Autowired
    private DigiLockerService digiLockerService;

    @GetMapping("/auth-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getAuthUrl(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        String url = digiLockerService.buildAuthUrl(currentUser.getId());
        return ResponseEntity.ok(Map.of("url", url));
    }

    // Callback from DigiLocker (no auth header on this request).
    @GetMapping("/callback")
    public RedirectView handleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false, name = "error") String error
    ) {
        String redirectBase = "http://localhost:3000/become-guide";

        if (error != null) {
            String encoded = URLEncoder.encode(error, StandardCharsets.UTF_8);
            return new RedirectView(redirectBase + "?digilocker=error&message=" + encoded);
        }

        try {
            digiLockerService.handleCallback(code, state);
            return new RedirectView(redirectBase + "?digilocker=success");
        } catch (Exception e) {
            logger.error("DigiLocker callback failed: {}", e.getMessage());
            String encoded = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            return new RedirectView(redirectBase + "?digilocker=error&message=" + encoded);
        }
    }
}

