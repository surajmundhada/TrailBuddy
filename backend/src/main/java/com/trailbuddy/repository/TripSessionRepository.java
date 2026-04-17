package com.trailbuddy.repository;

import com.trailbuddy.entity.TripSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripSessionRepository extends JpaRepository<TripSession, Long> {
    Optional<TripSession> findByBooking_Id(Long bookingId);
}

