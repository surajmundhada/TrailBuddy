package com.trailbuddy.repository;

import com.trailbuddy.entity.TripEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripEventRepository extends JpaRepository<TripEvent, Long> {
    List<TripEvent> findByTripSession_IdOrderByCreatedAtAsc(Long tripSessionId);
    List<TripEvent> findByTripSession_Booking_IdOrderByCreatedAtAsc(Long bookingId);
}

