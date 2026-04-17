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
                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                      font-family: 'Inter', Arial, sans-serif;
                      background: #0a0f1e;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 24px;
                    }
                    .card {
                      width: 100%%;
                      max-width: 480px;
                      background: rgba(255,255,255,0.04);
                      border: 1px solid rgba(255,255,255,0.08);
                      border-radius: 20px;
                      padding: 28px 32px;
                      backdrop-filter: blur(12px);
                      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
                    }
                    .badge {
                      display: inline-block;
                      margin-bottom: 16px;
                      font-size: 11px;
                      font-weight: 600;
                      color: #94a3b8;
                      background: rgba(255,255,255,0.06);
                      border: 1px solid rgba(255,255,255,0.1);
                      padding: 4px 10px;
                      border-radius: 999px;
                      letter-spacing: 0.03em;
                    }
                    h1 {
                      font-size: 20px;
                      font-weight: 700;
                      color: #f1f5f9;
                      margin-bottom: 8px;
                      line-height: 1.3;
                    }
                    .muted {
                      color: #64748b;
                      font-size: 13px;
                      margin-bottom: 20px;
                      line-height: 1.5;
                    }
                    .data-box {
                      background: rgba(255,255,255,0.03);
                      border: 1px solid rgba(255,255,255,0.07);
                      border-radius: 12px;
                      padding: 14px 18px;
                      margin-bottom: 24px;
                    }
                    .data-box-label {
                      font-size: 10px;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.08em;
                      color: #475569;
                      margin-bottom: 10px;
                    }
                    ul {
                      list-style: none;
                      display: flex;
                      flex-direction: column;
                      gap: 6px;
                    }
                    ul li {
                      font-size: 13px;
                      color: #cbd5e1;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    ul li::before {
                      content: '';
                      width: 6px;
                      height: 6px;
                      border-radius: 50%%;
                      background: #22d3ee;
                      flex-shrink: 0;
                    }
                    .divider {
                      height: 1px;
                      background: rgba(255,255,255,0.06);
                      margin-bottom: 20px;
                    }
                    .actions { display: flex; gap: 10px; }
                    .btn {
                      text-decoration: none;
                      padding: 10px 20px;
                      border-radius: 12px;
                      font-weight: 600;
                      font-size: 13px;
                      transition: opacity 0.15s;
                      display: inline-block;
                    }
                    .btn:hover { opacity: 0.85; }
                    .btn-primary {
                      background: linear-gradient(135deg, #06b6d4, #6366f1);
                      color: #fff;
                      box-shadow: 0 4px 16px rgba(6,182,212,0.25);
                    }
                    .btn-muted {
                      border: 1px solid rgba(255,255,255,0.1);
                      color: #94a3b8;
                      background: rgba(255,255,255,0.04);
                    }
                    .btn-muted:hover { background: rgba(255,255,255,0.08); }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <span class="badge">DigiLocker Sandbox (Demo)</span>
                    <h1>Allow TrailBuddy to access your DigiLocker data?</h1>
                    <p class="muted">This demo simulates Aadhaar eKYC consent for guide verification.</p>
                    <div class="data-box">
                      <div class="data-box-label">Data requested</div>
                      <ul>
                        <li>Name</li>
                        <li>Date of Birth</li>
                        <li>Masked Aadhaar</li>
                        <li>Email</li>
                      </ul>
                    </div>
                    <div class="divider"></div>
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

