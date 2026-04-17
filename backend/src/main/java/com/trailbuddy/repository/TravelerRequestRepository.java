package com.trailbuddy.repository;

import com.trailbuddy.entity.TravelerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TravelerRequestRepository extends JpaRepository<TravelerRequest, Long> {

    List<TravelerRequest> findByTravelerKeyOrderByCreatedAtDesc(String travelerKey);

    List<TravelerRequest> findByTravelerIdOrderByCreatedAtDesc(Long travelerId);

    List<TravelerRequest> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT r FROM TravelerRequest r
        WHERE LOWER(TRIM(r.city)) = LOWER(TRIM(:city))
        ORDER BY r.createdAt DESC
    """)
    List<TravelerRequest> findForGuideCity(@Param("city") String city);
}
