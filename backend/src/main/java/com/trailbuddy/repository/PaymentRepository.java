package com.trailbuddy.repository;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Payment;
import com.trailbuddy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBooking(Booking booking);
    List<Payment> findByUserOrderByPaymentDateDesc(User user);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
}
