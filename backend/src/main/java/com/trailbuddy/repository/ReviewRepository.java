package com.trailbuddy.repository;

import com.trailbuddy.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBooking_Id(Long bookingId);

    List<Review> findByGuide_Id(Long guideId);

    List<Review> findByGuide_IdOrderByCreatedAtDesc(Long guideId);

    List<Review> findByUser_IdOrderByCreatedAtDesc(Long userId);
}

