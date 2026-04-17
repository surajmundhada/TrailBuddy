package com.trailbuddy.repository;

import com.trailbuddy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    @Query("SELECT u FROM User u WHERE u.phone = :phone AND u.isActive = true")
    Optional<User> findActiveByPhone(@Param("phone") String phone);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true")
    Optional<User> findActiveByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'GUIDE' AND u.isActive = true")
    java.util.List<User> findActiveGuides();

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.isActive = true")
    java.util.List<User> findActiveByRole(@Param("roleName") String roleName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = 'GUIDE' AND u.isActive = true")
    long countActiveGuides();

    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.isActive = true")
    java.util.List<User> findUnverifiedUsers();

    @Query("SELECT u FROM User u WHERE u.isActive = false")
    java.util.List<User> findInactiveUsers();
}
