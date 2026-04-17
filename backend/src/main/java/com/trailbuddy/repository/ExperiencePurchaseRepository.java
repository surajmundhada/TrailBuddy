package com.trailbuddy.repository;

import com.trailbuddy.entity.ExperiencePurchase;
import com.trailbuddy.entity.Experience;
import com.trailbuddy.entity.TripSession;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.ExperiencePurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperiencePurchaseRepository extends JpaRepository<ExperiencePurchase, Long> {
    Optional<ExperiencePurchase> findByRazorpayOrderId(String razorpayOrderId);

    List<ExperiencePurchase> findByUserAndExperienceAndTripSessionAndStatus(
            User user,
            Experience experience,
            TripSession tripSession,
            ExperiencePurchaseStatus status
    );

    List<ExperiencePurchase> findByUserAndTripSessionAndStatus(
            User user,
            TripSession tripSession,
            ExperiencePurchaseStatus status
    );
}

