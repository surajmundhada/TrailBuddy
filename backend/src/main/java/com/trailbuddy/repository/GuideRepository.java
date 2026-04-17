package com.trailbuddy.repository;

import com.trailbuddy.entity.Guide;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuideRepository extends JpaRepository<Guide, Long> {
    List<Guide> findByCity(String city);
    
    // City-only search - expertise filtered in service layer due to JSON storage
    List<Guide> findByCity(String city, Pageable pageable);
    
    List<Guide> findByAadharVerified(Boolean aadharVerified);
    Page<Guide> findByAadharVerified(Boolean aadharVerified, Pageable pageable);
    List<Guide> findByAverageRatingGreaterThan(Double rating);

    @Query("SELECT g FROM Guide g WHERE g.user.id = :userId")
    Optional<Guide> findByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT g FROM Guide g
        WHERE LOWER(TRIM(g.user.firstName)) = LOWER(TRIM(:firstName))
          AND LOWER(TRIM(g.user.lastName)) = LOWER(TRIM(:lastName))
    """)
    List<Guide> findByUserFullName(@Param("firstName") String firstName, @Param("lastName") String lastName);

    @Query("""
        SELECT g FROM Guide g
        WHERE g.aadharVerified <> true
           OR g.isVerified <> true
           OR g.isApproved <> true
        ORDER BY g.createdAt DESC, g.id DESC
    """)
    List<Guide> findPendingVerificationQueue();
}
