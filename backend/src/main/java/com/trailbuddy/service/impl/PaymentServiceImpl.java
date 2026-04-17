package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Payment;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.PaymentRepository;
import com.trailbuddy.model.QuotationStatus;
import com.trailbuddy.service.PaymentService;
import com.trailbuddy.service.TripSessionService;
import com.trailbuddy.util.QrCodeUtil;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceImpl.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private TripSessionService tripSessionService;

    @Override
    public Map<String, Object> createPaymentOrder(Long bookingId, Authentication authentication) throws RazorpayException {
        User currentUser = (User) authentication.getPrincipal();
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }

        assertBookingPayable(booking);

        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", booking.getTotalAmount().multiply(java.math.BigDecimal.valueOf(100)).intValue()); // Amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "booking_" + bookingId);
        orderRequest.put("payment_capture", 1);

        Order order = razorpay.orders.create(orderRequest);

        // Persist orderId so verify can locate the booking by razorpayOrderId
        booking.setRazorpayOrderId((String) order.get("id"));
        bookingRepository.save(booking);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.get("id"));
        response.put("amount", order.get("amount"));
        response.put("currency", order.get("currency"));
        response.put("keyId", razorpayKeyId);

        return response;
    }

    @Override
    public Payment verifyPayment(Map<String, String> paymentData, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        String razorpayOrderId = paymentData.get("razorpay_order_id");
        String razorpayPaymentId = paymentData.get("razorpay_payment_id");
        String razorpaySignature = paymentData.get("razorpay_signature");

        // Verify signature
        String generatedSignature = calculateSignature(razorpayOrderId, razorpayPaymentId);
        
        if (!generatedSignature.equals(razorpaySignature)) {
            throw new RuntimeException("Invalid payment signature");
        }

        Booking booking = bookingRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Booking not found for razorpay order id"));

        // Create payment record (populate all non-null fields)
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setUser(currentUser);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency("INR");
        payment.setPaymentMethod(Payment.PaymentMethod.RAZORPAY);
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaymentDate(LocalDateTime.now());

        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setRazorpaySignature(razorpaySignature);

        // Update booking status
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Update guide stats
        if (booking.getGuide() != null) {
            Guide guide = booking.getGuide();
            guide.setTotalBookings((guide.getTotalBookings() == null ? 0 : guide.getTotalBookings()) + 1);
            guideRepository.save(guide);
        }

        tripSessionService.provisionSessionAfterBookingConfirmed(booking.getId());

        return paymentRepository.save(payment);
    }

    @Override
    public void handleWebhook(String webhookPayload) {
        // Handle Razorpay webhooks for payment status updates
        logger.info("Processing webhook payload: {}", webhookPayload);
        // Implementation for webhook handling
    }

    @Override
    public Payment getPaymentByBooking(Long bookingId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }

        return paymentRepository.findByBooking(booking)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPaymentHistory(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return paymentRepository.findByUserOrderByPaymentDateDesc(currentUser).stream()
                .map(this::paymentToSummary)
                .toList();
    }

    private Map<String, Object> paymentToSummary(Payment p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("amount", p.getAmount());
        m.put("currency", p.getCurrency());
        m.put("paymentMethod", p.getPaymentMethod() != null ? p.getPaymentMethod().name() : null);
        m.put("paymentStatus", p.getPaymentStatus() != null ? p.getPaymentStatus().name() : null);
        m.put("paymentDate", p.getPaymentDate());
        m.put("createdAt", p.getCreatedAt());
        m.put("razorpayOrderId", p.getRazorpayOrderId());
        m.put("razorpayPaymentId", p.getRazorpayPaymentId());
        if (p.getBooking() != null) {
            m.put("bookingId", p.getBooking().getId());
        }
        return m;
    }

    @Override
    public Payment mockConfirmPayment(Long bookingId, Map<String, Object> paymentData, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }

        assertBookingPayable(booking);

        Payment payment = paymentRepository.findByBooking(booking).orElseGet(Payment::new);

        payment.setBooking(booking);
        payment.setUser(currentUser);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency("INR");
        payment.setPaymentMethod(resolveMockPaymentMethod(paymentData));
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaymentDate(LocalDateTime.now());

        // Dummy Razorpay references for local/dev testing.
        payment.setRazorpayOrderId("order_mock_" + bookingId);
        payment.setRazorpayPaymentId("pay_mock_" + bookingId);
        payment.setRazorpaySignature("signature_mock_" + bookingId);

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Update guide stats
        if (booking.getGuide() != null) {
            Guide guide = booking.getGuide();
            guide.setTotalBookings((guide.getTotalBookings() == null ? 0 : guide.getTotalBookings()) + 1);
            guideRepository.save(guide);
        }

        tripSessionService.provisionSessionAfterBookingConfirmed(booking.getId());

        return paymentRepository.save(payment);
    }

    @Override
    public Map<String, Object> buildDummyQrPayload(Long bookingId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }
        assertBookingPayable(booking);
        String ref = "TBQR-" + bookingId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String payload = "TRAILBUDDY|PAY|" + ref + "|INR|" + booking.getTotalAmount().toPlainString() + "|BOOKING:" + bookingId;
        Map<String, Object> out = new HashMap<>();
        out.put("reference", ref);
        out.put("amountInr", booking.getTotalAmount());
        out.put("qrDataUrl", QrCodeUtil.pngDataUrl(payload));
        out.put("hint", "Dummy scan target for demos. Use Mock Pay to confirm without a real gateway.");
        return out;
    }

    private void assertBookingPayable(Booking booking) {
        QuotationStatus qs = booking.getQuotationStatus() != null ? booking.getQuotationStatus() : QuotationStatus.NONE;
        if (qs == QuotationStatus.AWAITING_GUIDE || qs == QuotationStatus.SENT) {
            throw new RuntimeException("Wait for your guide's quotation and accept it before paying.");
        }
        if (qs == QuotationStatus.DECLINED) {
            throw new RuntimeException("This booking was declined. Create a new booking.");
        }
        if (booking.getTotalAmount() == null || booking.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("No payable amount on this booking yet.");
        }
    }

    private Payment.PaymentMethod resolveMockPaymentMethod(Map<String, Object> paymentData) {
        String rawMethod = paymentData != null && paymentData.get("paymentMethod") != null
                ? String.valueOf(paymentData.get("paymentMethod")).trim().toUpperCase()
                : "CARD";
        try {
            return Payment.PaymentMethod.valueOf(rawMethod);
        } catch (Exception ignored) {
            return Payment.PaymentMethod.CARD;
        }
    }

    private String calculateSignature(String orderId, String paymentId) {
        String data = orderId + "|" + paymentId;
        javax.crypto.Mac mac = null;
        try {
            mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes());
            return java.util.Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating signature", e);
        }
    }
}
