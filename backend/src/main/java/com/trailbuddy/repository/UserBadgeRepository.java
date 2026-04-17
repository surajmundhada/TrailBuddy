package com.trailbuddy.repository;

import com.trailbuddy.entity.UserBadge;
import com.trailbuddy.model.BadgeType;
import com.trailbuddy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    Optional<UserBadge> findByUserAndBadgeType(User user, BadgeType badgeType);

    List<UserBadge> findByUser(User user);
}

