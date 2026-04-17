package com.trailbuddy.service;

import com.trailbuddy.entity.EmailVerificationToken;
import com.trailbuddy.entity.PasswordResetToken;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.EmailVerificationTokenRepository;
import com.trailbuddy.repository.PasswordResetTokenRepository;
import com.trailbuddy.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserService userService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // Dev-mode OTP store (in-memory). In production, use a persistent store like Redis.
    private static final ConcurrentHashMap<String, OtpRecord> PHONE_OTP_STORE = new ConcurrentHashMap<>();

    private static class OtpRecord {
        private final String code;
        private final LocalDateTime expiresAt;

        private OtpRecord(String code, LocalDateTime expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    @Transactional
    public User registerUser(User user, Role.RoleName roleName) {
        // Create user
        User createdUser = userService.createUser(user);

        // Assign role
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        createdUser.getRoles().add(role);
        userService.updateUser(createdUser);

        // Send verification email
        sendVerificationEmail(createdUser);

        return createdUser;
    }

    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Create password reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        // Make reset links more reliable during development/testing.
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(24)); // Token valid for 24 hours

        passwordResetTokenRepository.save(resetToken);

        // Send reset email
        sendPasswordResetEmail(user, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired or been used");
        }

        User user = resetToken.getUser();
        userService.resetPassword(user.getEmail(), newPassword);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        logger.info("Password reset completed for user: {}", user.getEmail());
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verificationToken.isUsed() || verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired or been used");
        }

        User user = verificationToken.getUser();
        userService.verifyEmail(user.getId());

        // Mark token as used
        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        logger.info("Email verified for user: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        sendVerificationEmail(user);
    }

    private void sendVerificationEmail(User user) {
        String token = UUID.randomUUID().toString();
        
        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setUser(user);
        verificationToken.setToken(token);
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(24)); // Token valid for 24 hours

        emailVerificationTokenRepository.save(verificationToken);

        String verificationUrl = frontendUrl + "/verify-email?token=" + token;
        
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(user.getEmail());
        mailMessage.setSubject("TrailBuddy - Email Verification");
        mailMessage.setText("Dear " + user.getFirstName() + ",\n\n" +
                "Thank you for registering with TrailBuddy! Please click the link below to verify your email address:\n\n" +
                verificationUrl + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "Best regards,\n" +
                "The TrailBuddy Team");

        try {
            mailSender.send(mailMessage);
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
            throw new RuntimeException("Failed to send verification email");
        }
    }

    private void sendPasswordResetEmail(User user, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(user.getEmail());
        mailMessage.setSubject("TrailBuddy - Password Reset");
        mailMessage.setText("Dear " + user.getFirstName() + ",\n\n" +
                "We received a request to reset your password. Please click the link below to reset your password:\n\n" +
                resetUrl + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't request this password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "The TrailBuddy Team");

        try {
            mailSender.send(mailMessage);
            logger.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
            throw new RuntimeException("Failed to send password reset email");
        }
    }

    @Transactional
    public void sendOtp(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new RuntimeException("Phone is required");
        }

        String normalizedPhone = phone.trim();
        int otpInt = ThreadLocalRandom.current().nextInt(0, 1000000);
        String otpCode = String.format("%06d", otpInt);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5); // 5 minutes OTP validity

        PHONE_OTP_STORE.put(normalizedPhone, new OtpRecord(otpCode, expiresAt));
        logger.info("Dev OTP for {} is {}", normalizedPhone, otpCode);
    }

    @Transactional
    public User verifyPhoneOtpAndGetUser(String phone, String code) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new RuntimeException("Phone is required");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("OTP code is required");
        }

        String normalizedPhone = phone.trim();
        String normalizedCode = code.trim();
        OtpRecord record = PHONE_OTP_STORE.get(normalizedPhone);

        if (record == null) {
            throw new RuntimeException("OTP not found or already verified");
        }
        if (record.expiresAt.isBefore(LocalDateTime.now())) {
            PHONE_OTP_STORE.remove(normalizedPhone);
            throw new RuntimeException("OTP has expired");
        }
        if (!record.code.equals(normalizedCode)) {
            throw new RuntimeException("Invalid OTP code");
        }

        // OTP is valid; consume it.
        PHONE_OTP_STORE.remove(normalizedPhone);

        User user = userService.findActiveByPhone(normalizedPhone)
                .orElseGet(() -> createUserForPhone(normalizedPhone));

        user.setPhoneVerified(true);
        return userService.updateUser(user);
    }

    @Transactional
    public User googleLoginOrCreate(String email, String firstName, String lastName) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required for Google sign-in");
        }

        String normalizedEmail = email.trim();
        User user = userService.findByEmail(normalizedEmail).orElseGet(() -> {
            String resolvedFirstName = (firstName == null || firstName.trim().isEmpty()) ? "Google" : firstName.trim();
            String resolvedLastName = (lastName == null || lastName.trim().isEmpty()) ? "User" : lastName.trim();

            User created = new User(
                    normalizedEmail,
                    "Temp123!@#",
                    resolvedFirstName,
                    resolvedLastName
            );
            created.setEmailVerified(true);

            Role role = roleRepository.findByName(Role.RoleName.USER)
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setName(Role.RoleName.USER);
                        return roleRepository.save(newRole);
                    });
            Set<Role> roles = new HashSet<>();
            roles.add(role);
            created.setRoles(roles);

            return userService.createUser(created);
        });

        if (user.getEmailVerified() == null || !user.getEmailVerified()) {
            user.setEmailVerified(true);
            userService.updateUser(user);
        }
        // Ensure every login has at least USER role.
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role role = roleRepository.findByName(Role.RoleName.USER)
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setName(Role.RoleName.USER);
                        return roleRepository.save(newRole);
                    });
            Set<Role> roles = new HashSet<>();
            roles.add(role);
            user.setRoles(roles);
            userService.updateUser(user);
        }

        return user;
    }

    private User createUserForPhone(String phone) {
        // phone is digits-only in most cases; keep email unique per phone.
        String sanitized = phone.replaceAll("[^0-9]", "");
        String email = "phone-" + sanitized + "@localguide.dev";

        Role role = roleRepository.findByName(Role.RoleName.USER)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName(Role.RoleName.USER);
                    return roleRepository.save(newRole);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User created = new User(
                email,
                "Temp123!@#",
                "Phone",
                "User"
        );
        created.setPhone(phone);
        created.setPhoneVerified(true);
        created.setEmailVerified(false);
        created.setRoles(roles);
        return userService.createUser(created);
    }
}
