package com.trailbuddy.service;

import com.trailbuddy.entity.Payment;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    Map<String, Object> createPaymentOrder(Long bookingId, Authentication authentication) throws Exception;
    Payment verifyPayment(Map<String, String> paymentData, Authentication authentication) throws Exception;
    void handleWebhook(String webhookPayload) throws Exception;
    Payment getPaymentByBooking(Long bookingId, Authentication authentication);
    List<Payment> getPaymentHistory(Authentication authentication);
    Payment mockConfirmPayment(Long bookingId, Authentication authentication) throws Exception;
}
