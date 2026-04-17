package com.trailbuddy.controller;

import com.trailbuddy.entity.ExperiencePurchase;
import com.trailbuddy.service.ExperiencePurchaseService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/experience-purchases")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExperiencePurchaseController {

    private static final Logger logger = LoggerFactory.getLogger(ExperiencePurchaseController.class);

    @Autowired
    private ExperiencePurchaseService experiencePurchaseService;

    @PostMapping("/create-order")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createOrder(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Object experienceIdRaw = body.get("experienceId");
            if (experienceIdRaw == null) {
                return ResponseEntity.badRequest().body("Error: experienceId is required");
            }
            Long experienceId = experienceIdRaw instanceof Number
                    ? ((Number) experienceIdRaw).longValue()
                    : Long.parseLong(String.valueOf(experienceIdRaw));

            Long bookingId = null;
            Object bookingIdRaw = body.get("bookingId");
            if (bookingIdRaw != null) {
                bookingId = bookingIdRaw instanceof Number
                        ? ((Number) bookingIdRaw).longValue()
                        : Long.parseLong(String.valueOf(bookingIdRaw));
            }

            return ResponseEntity.ok(
                    experiencePurchaseService.createExperienceOrder(experienceId, bookingId, authentication)
            );
        } catch (Exception e) {
            logger.error("Failed to create experience order", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> verify(
            @RequestBody Map<String, String> paymentData,
            Authentication authentication
    ) {
        try {
            ExperiencePurchase purchase = experiencePurchaseService.verifyExperiencePayment(paymentData, authentication);
            return ResponseEntity.ok(purchase);
        } catch (Exception e) {
            logger.error("Failed to verify experience payment", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/mock-confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> mockConfirm(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Object purchaseIdRaw = body.get("purchaseId");
            if (purchaseIdRaw == null) {
                return ResponseEntity.badRequest().body("Error: purchaseId is required");
            }
            Long purchaseId = purchaseIdRaw instanceof Number
                    ? ((Number) purchaseIdRaw).longValue()
                    : Long.parseLong(String.valueOf(purchaseIdRaw));
            ExperiencePurchase purchase = experiencePurchaseService.mockConfirmExperiencePayment(purchaseId, authentication);
            return ResponseEntity.ok(Map.of(
                    "id", purchase.getId(),
                    "status", purchase.getStatus() != null ? purchase.getStatus().name() : "COMPLETED",
                    "paymentRef", purchase.getRazorpayPaymentId() != null ? purchase.getRazorpayPaymentId() : ""
            ));
        } catch (Exception e) {
            logger.error("Failed to mock-confirm experience payment", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

