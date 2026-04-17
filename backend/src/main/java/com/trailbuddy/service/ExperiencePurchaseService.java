package com.trailbuddy.service;

import com.trailbuddy.entity.ExperiencePurchase;
import org.springframework.security.core.Authentication;

import java.util.Map;

public interface ExperiencePurchaseService {
    Map<String, Object> createExperienceOrder(Long experienceId, Long bookingId, Authentication authentication) throws Exception;

    ExperiencePurchase verifyExperiencePayment(Map<String, String> paymentData, Authentication authentication) throws Exception;

    ExperiencePurchase mockConfirmExperiencePayment(Long purchaseId, Authentication authentication);
}

