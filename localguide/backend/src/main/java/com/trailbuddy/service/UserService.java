package com.trailbuddy.service;

import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.RoleRepository;
import com.trailbuddy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        // `User` already implements `UserDetails`, so we return the entity itself.
        // This keeps `authentication.getPrincipal()` as `com.trailbuddy.entity.User`.
        return user;
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findById(userId);
        user.setIsActive(false);
        userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findActiveByEmail(email);
    }

    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findActiveGuides() {
        return userRepository.findActiveGuides();
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }

    public Optional<User> findActiveByPhone(String phone) {
        return userRepository.findActiveByPhone(phone);
    }

    @Transactional
    public User addRoleToUser(Long userId, Role.RoleName roleName) {
        User user = findById(userId);
        Role role = new Role();
        role.setName(roleName);
        user.getRoles().add(role);
        return userRepository.save(user);
    }

    @Transactional
    public User removeRoleFromUser(Long userId, Role.RoleName roleName) {
        User user = findById(userId);
        user.getRoles().removeIf(role -> role.getName().equals(roleName));
        return userRepository.save(user);
    }

    @Transactional
    public User changePassword(Long userId, String oldPassword, String newPassword) {
        User user = findById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Old password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    @Transactional
    public User resetPassword(String email, String newPassword) {
        User user = findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    @Transactional
    public User verifyEmail(Long userId) {
        User user = findById(userId);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    @Transactional
    public User verifyPhone(Long userId) {
        User user = findById(userId);
        user.setPhoneVerified(true);
        return userRepository.save(user);
    }

    public long countActiveUsers() {
        return userRepository.countActiveUsers();
    }

    public long countActiveGuides() {
        return userRepository.countActiveGuides();
    }

    public List<User> findUnverifiedUsers() {
        return userRepository.findUnverifiedUsers();
    }

    public List<User> findInactiveUsers() {
        return userRepository.findInactiveUsers();
    }

    @Transactional
    public User updateProfile(Long userId, String firstName, String lastName, String phone) {
        User user = findById(userId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        if (phone != null && !phone.equals(user.getPhone())) {
            if (existsByPhone(phone)) {
                throw new RuntimeException("Phone number already exists");
            }
            user.setPhone(phone);
            user.setPhoneVerified(false);
        }
        return userRepository.save(user);
    }

    @Transactional
    public User updateProfilePicture(Long userId, String profileImageUrl) {
        User user = findById(userId);
        user.setProfileImageUrl(profileImageUrl);
        return userRepository.save(user);
    }

    public Optional<Role> findRoleByName(Role.RoleName roleName) {
        return roleRepository.findByName(roleName);
    }

    @Transactional
    public Role saveRole(Role role) {
        return roleRepository.save(role);
    }

    public boolean checkPassword(Long userId, String password) {
        User user = findById(userId);
        return passwordEncoder.matches(password, user.getPasswordHash());
    }
}
