package com.trailbuddy.service.impl;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.trailbuddy.entity.*;
import com.trailbuddy.entity.TripEvent;
import com.trailbuddy.repository.TripEventRepository;
import com.trailbuddy.model.TripEventType;
import com.trailbuddy.model.ExperiencePurchaseStatus;
import com.trailbuddy.repository.*;
import com.trailbuddy.service.ExperiencePurchaseService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ExperiencePurchaseServiceImpl implements ExperiencePurchaseService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.mock-enabled:false}")
    private boolean razorpayMockEnabled;

    @Autowired
    private ExperiencePurchaseRepository experiencePurchaseRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TripSessionRepository tripSessionRepository;

    @Autowired
    private TripEventRepository tripEventRepository;

    @Override
    @Transactional
    public Map<String, Object> createExperienceOrder(Long experienceId, Long bookingId, Authentication authentication) throws Exception {
        User currentUser = (User) authentication.getPrincipal();

        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new RuntimeException("Experience not found: " + experienceId));

        // For free experiences, we still persist a completed purchase record (simplifies UI).
        if (Boolean.TRUE.equals(experience.getIsFree()) || experience.getPrice() == null || experience.getPrice() <= 0) {
            TripSession session = null;
            if (bookingId != null) {
                session = tripSessionRepository.findByBooking_Id(bookingId).orElse(null);
            }
            ExperiencePurchase purchase = ensurePurchaseRecord(currentUser, experience, session, ExperiencePurchaseStatus.COMPLETED);
            return Map.of(
                    "status", "COMPLETED",
                    "purchaseId", purchase.getId(),
                    "amount", 0,
                    "currency", "INR"
            );
        }

        TripSession session = null;
        if (bookingId != null) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

            if (booking.getUser() == null || !booking.getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Unauthorized experience purchase");
            }

            session = tripSessionRepository.findByBooking_Id(bookingId)
                    .orElseGet(() -> {
                        TripSession created = new TripSession();
                        created.setBooking(booking);
                        // Avoid leaking OTP; purchases will still work without OTP display.
                        created.setTripStatus(com.trailbuddy.model.TripStatus.AWAITING_OTP);
                        created.setOtpSalt("seed");
                        created.setOtpHash("seed");
                        created.setOtpExpiresAt(LocalDateTime.now().plusMinutes(1));
                        return tripSessionRepository.save(created);
                    });
        }

        ExperiencePurchase existingPending = findExistingPurchase(currentUser, experience, session, ExperiencePurchaseStatus.PENDING);
        if (existingPending != null) {
            throw new RuntimeException("A pending purchase already exists for this experience");
        }

        int priceRupees = experience.getPrice() != null ? experience.getPrice() : 0;
        int amountPaise = priceRupees * 100;

        // Create a new pending purchase record and Razorpay order.
        ExperiencePurchase purchase = new ExperiencePurchase();
        purchase.setUser(currentUser);
        purchase.setExperience(experience);
        purchase.setTripSession(session);
        purchase.setAmount(BigDecimal.valueOf(priceRupees).intValue());
        purchase.setStatus(ExperiencePurchaseStatus.PENDING);

        if (shouldUseMockRazorpay()) {
            purchase.setStatus(ExperiencePurchaseStatus.PENDING);
            ensureMockOrderId(purchase);
            ExperiencePurchase created = experiencePurchaseRepository.save(purchase);
            return Map.of(
                    "status", "PENDING",
                    "requiresMockConfirmation", true,
                    "purchaseId", created.getId(),
                    "amount", amountPaise,
                    "currency", "INR"
            );
        }

        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId.trim(), razorpayKeySecret.trim());
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "exp_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);

            Order order = razorpay.orders.create(orderRequest);

            purchase.setRazorpayOrderId((String) order.get("id"));
            experiencePurchaseRepository.save(purchase);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", razorpayKeyId.trim());
            response.put("purchaseId", purchase.getId());

            return response;
        } catch (RazorpayException ex) {
            // If credentials are invalid, fall back only when explicitly mock-enabled.
            if (razorpayMockEnabled) {
                purchase.setStatus(ExperiencePurchaseStatus.PENDING);
                ensureMockOrderId(purchase);
                ExperiencePurchase created = experiencePurchaseRepository.save(purchase);
                return Map.of(
                        "status", "PENDING",
                        "requiresMockConfirmation", true,
                        "purchaseId", created.getId(),
                        "amount", amountPaise,
                        "currency", "INR"
                );
            }
            throw ex;
        }
    }

    @Override
    @Transactional
    public ExperiencePurchase mockConfirmExperiencePayment(Long purchaseId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        ExperiencePurchase purchase = experiencePurchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new RuntimeException("Purchase not found: " + purchaseId));

        if (purchase.getUser() == null || purchase.getUser().getId() == null
                || !purchase.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized purchase confirmation");
        }

        if (purchase.getStatus() == ExperiencePurchaseStatus.COMPLETED) {
            return purchase;
        }

        purchase.setStatus(ExperiencePurchaseStatus.COMPLETED);
        attachMockPaymentRefs(purchase);
        experiencePurchaseRepository.save(purchase);

        if (purchase.getTripSession() != null) {
            TripEvent event = new TripEvent();
            event.setTripSession(purchase.getTripSession());
            event.setEventType(TripEventType.EXPERIENCE_UNLOCKED);
            String expTitle = purchase.getExperience() != null ? purchase.getExperience().getTitle() : null;
            event.setMessage("Experience unlocked: " + (expTitle != null ? expTitle : purchase.getExperience().getExperienceKey()));
            tripEventRepository.save(event);
        }

        return purchase;
    }

    @Override
    @Transactional
    public ExperiencePurchase verifyExperiencePayment(Map<String, String> paymentData, Authentication authentication) throws Exception {
        User currentUser = (User) authentication.getPrincipal();

        String razorpayOrderId = paymentData.get("razorpay_order_id");
        String razorpayPaymentId = paymentData.get("razorpay_payment_id");
        String razorpaySignature = paymentData.get("razorpay_signature");

        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            throw new RuntimeException("Missing payment verification fields");
        }

        // Verify signature.
        String generatedSignature = calculateSignature(razorpayOrderId, razorpayPaymentId);
        if (!generatedSignature.equals(razorpaySignature)) {
            throw new RuntimeException("Invalid payment signature");
        }

        ExperiencePurchase purchase = experiencePurchaseRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Purchase not found for razorpay order id"));

        if (purchase.getUser() == null || purchase.getUser().getId() == null
                || !purchase.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized purchase verification");
        }

        if (purchase.getStatus() == ExperiencePurchaseStatus.COMPLETED) {
            return purchase;
        }

        purchase.setRazorpayPaymentId(razorpayPaymentId);
        purchase.setRazorpaySignature(razorpaySignature);
        purchase.setStatus(ExperiencePurchaseStatus.COMPLETED);
        experiencePurchaseRepository.save(purchase);

        if (purchase.getTripSession() != null) {
            TripEvent event = new TripEvent();
            event.setTripSession(purchase.getTripSession());
            event.setEventType(TripEventType.EXPERIENCE_UNLOCKED);
            String expTitle = purchase.getExperience() != null ? purchase.getExperience().getTitle() : null;
            event.setMessage("Experience unlocked: " + (expTitle != null ? expTitle : purchase.getExperience().getExperienceKey()));
            tripEventRepository.save(event);
        }

        return purchase;
    }

    private ExperiencePurchase findExistingPurchase(User currentUser, Experience experience, TripSession session, ExperiencePurchaseStatus status) {
        if (session == null) {
            return null; // MVP: without-guide de-dup is handled via matching COMPLETED later.
        }
        return experiencePurchaseRepository.findByUserAndExperienceAndTripSessionAndStatus(
                        currentUser, experience, session, status)
                .stream()
                .findFirst()
                .orElse(null);
    }

    private ExperiencePurchase ensurePurchaseRecord(User user, Experience experience, TripSession session, ExperiencePurchaseStatus status) {
        if (session != null) {
            Optional<ExperiencePurchase> existing = experiencePurchaseRepository
                    .findByUserAndExperienceAndTripSessionAndStatus(user, experience, session, status)
                    .stream()
                    .findFirst();
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        ExperiencePurchase purchase = new ExperiencePurchase();
        purchase.setUser(user);
        purchase.setExperience(experience);
        purchase.setTripSession(session);
        purchase.setAmount(experience.getPrice() != null ? experience.getPrice() : 0);
        purchase.setStatus(status);
        // DB keeps razorpay_order_id non-null; free/mock rows get synthetic references.
        if (status == ExperiencePurchaseStatus.COMPLETED) {
            attachMockPaymentRefs(purchase);
        }
        return experiencePurchaseRepository.save(purchase);
    }

    private String calculateSignature(String orderId, String paymentId) {
        String data = orderId + "|" + paymentId;
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec =
                    new javax.crypto.spec.SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes());
            return java.util.Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating signature", e);
        }
    }

    private boolean shouldUseMockRazorpay() {
        if (razorpayMockEnabled) {
            return true;
        }
        String keyId = razorpayKeyId == null ? "" : razorpayKeyId.trim();
        String keySecret = razorpayKeySecret == null ? "" : razorpayKeySecret.trim();
        return keyId.isEmpty()
                || keySecret.isEmpty()
                || keyId.contains("XXXXXXXX")
                || keySecret.contains("XXXXXXXX");
    }

    private void attachMockPaymentRefs(ExperiencePurchase purchase) {
        ensureMockOrderId(purchase);
        if (purchase.getRazorpayPaymentId() == null || purchase.getRazorpayPaymentId().isBlank()) {
            purchase.setRazorpayPaymentId("pay_mock_exp_" + System.currentTimeMillis());
        }
        if (purchase.getRazorpaySignature() == null || purchase.getRazorpaySignature().isBlank()) {
            purchase.setRazorpaySignature("sig_mock_exp");
        }
    }

    private void ensureMockOrderId(ExperiencePurchase purchase) {
        if (purchase.getRazorpayOrderId() == null || purchase.getRazorpayOrderId().isBlank()) {
            purchase.setRazorpayOrderId("order_mock_exp_" + System.currentTimeMillis() + "_" + Math.abs(java.util.UUID.randomUUID().hashCode()));
        }
    }
}

