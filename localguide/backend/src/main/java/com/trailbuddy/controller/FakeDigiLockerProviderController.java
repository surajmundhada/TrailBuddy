package com.trailbuddy.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/fake-digilocker")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FakeDigiLockerProviderController {

    private static final Logger logger = LoggerFactory.getLogger(FakeDigiLockerProviderController.class);

    @GetMapping(value = "/authorize", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> authorize(
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam(value = "state", required = false) String state
    ) {
        // Show a realistic consent screen instead of instant redirect.
        String encodedRedirect = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        String encodedState = URLEncoder.encode(state == null ? "" : state, StandardCharsets.UTF_8);
        String allowUrl = "/api/fake-digilocker/approve?redirect_uri=" + encodedRedirect + "&state=" + encodedState;
        String denyUrl = "/api/fake-digilocker/deny?redirect_uri=" + encodedRedirect + "&state=" + encodedState;

        String html = """
                <!doctype html>
                <html>
                <head>
                  <meta charset="utf-8" />
                  <title>DigiLocker Consent (Demo)</title>
                  <style>
                    body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 24px; }
                    .card { max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
                    h1 { margin: 0 0 8px; font-size: 22px; }
                    .muted { color: #6b7280; font-size: 13px; margin-bottom: 12px; }
                    .badge { display:inline-block; margin-bottom: 10px; font-size: 12px; color: #1f2937; background: #e5e7eb; padding: 4px 8px; border-radius: 999px; }
                    ul { color: #374151; margin-top: 8px; margin-bottom: 16px; }
                    .actions { display: flex; gap: 10px; }
                    .btn { text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                    .btn-primary { background: #2563eb; color: #fff; }
                    .btn-muted { border: 1px solid #d1d5db; color: #111827; background: #fff; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <span class="badge">DigiLocker Sandbox (Demo)</span>
                    <h1>Allow TrailBuddy to access your DigiLocker data?</h1>
                    <p class="muted">This demo simulates Aadhaar eKYC consent for guide verification.</p>
                    <ul>
                      <li>Name</li>
                      <li>Date of Birth</li>
                      <li>Masked Aadhaar</li>
                      <li>Email</li>
                    </ul>
                    <div class="actions">
                      <a class="btn btn-primary" href="%s">Allow Access</a>
                      <a class="btn btn-muted" href="%s">Deny</a>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(allowUrl, denyUrl);

        return ResponseEntity.ok(html);
    }

    @GetMapping("/approve")
    public void approve(
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam(value = "state", required = false) String state,
            HttpServletResponse response
    ) throws IOException {
        String code = "demo_auth_code";
        StringBuilder target = new StringBuilder(redirectUri)
                .append(redirectUri.contains("?") ? "&" : "?")
                .append("code=").append(code);
        if (state != null && !state.isBlank()) {
            target.append("&state=").append(state);
        }
        logger.info("FakeDigiLockerProvider approve: redirecting to {}", target);
        response.sendRedirect(target.toString());
    }

    @GetMapping("/deny")
    public void deny(
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam(value = "state", required = false) String state,
            HttpServletResponse response
    ) throws IOException {
        StringBuilder target = new StringBuilder(redirectUri)
                .append(redirectUri.contains("?") ? "&" : "?")
                .append("error=access_denied");
        if (state != null && !state.isBlank()) {
            target.append("&state=").append(state);
        }
        logger.info("FakeDigiLockerProvider deny: redirecting to {}", target);
        response.sendRedirect(target.toString());
    }

    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, Object> token() {
        // Return a fixed access token for demo purposes.
        return Map.of(
                "access_token", "demo_access_token",
                "token_type", "Bearer",
                "expires_in", 3600
        );
    }

    @GetMapping("/ekyc")
    public Map<String, Object> ekyc() {
        // Simulated eKYC data.
        return Map.of(
                "name", "Shrikant Somani",
                "dob", "2004-01-01",
                "aadhaar", "XXXX-XXXX-1234",
                "email", "test@example.com"
        );
    }
}

