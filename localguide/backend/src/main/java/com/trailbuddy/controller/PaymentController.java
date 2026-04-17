package com.trailbuddy.controller;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Payment;
import com.trailbuddy.service.PaymentService;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order/{bookingId}")
    public ResponseEntity<?> createPaymentOrder(@PathVariable Long bookingId, Authentication authentication) {
        logger.info("Creating payment order for booking: {}", bookingId);
        try {
            Map<String, Object> order = paymentService.createPaymentOrder(bookingId, authentication);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            logger.error("Error creating payment order", e);
            return ResponseEntity.badRequest().body("Error creating payment order: " + e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> paymentData, Authentication authentication) {
        logger.info("Verifying payment");
        try {
            Payment payment = paymentService.verifyPayment(paymentData, authentication);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            logger.error("Error verifying payment", e);
            return ResponseEntity.badRequest().body("Payment verification failed");
        }
    }

    @PostMapping("/webhook/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(@RequestBody String webhookPayload) {
        logger.info("Received Razorpay webhook");
        try {
            paymentService.handleWebhook(webhookPayload);
            return ResponseEntity.ok("Webhook processed successfully");
        } catch (Exception e) {
            logger.error("Error processing webhook", e);
            return ResponseEntity.badRequest().body("Webhook processing failed");
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Payment> getPaymentByBooking(@PathVariable Long bookingId, Authentication authentication) {
        logger.info("Getting payment for booking: {}", bookingId);
        Payment payment = paymentService.getPaymentByBooking(bookingId, authentication);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(Authentication authentication) {
        logger.info("Getting payment history");
        return ResponseEntity.ok(paymentService.getPaymentHistory(authentication));
    }

    @PostMapping("/mock-confirm/{bookingId}")
    public ResponseEntity<?> mockConfirmPaymentOrder(@PathVariable Long bookingId, Authentication authentication) throws Exception {
        logger.info("Mock confirming payment for booking: {}", bookingId);
        return ResponseEntity.ok(paymentService.mockConfirmPayment(bookingId, authentication));
    }
}
