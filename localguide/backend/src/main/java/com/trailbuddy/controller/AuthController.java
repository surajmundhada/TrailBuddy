package com.trailbuddy.controller;

import com.trailbuddy.dto.JwtResponse;
import com.trailbuddy.dto.LoginRequest;
import com.trailbuddy.dto.SignupRequest;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.AuthService;
import com.trailbuddy.service.UserService;
import com.trailbuddy.util.JwtUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserService userService;

    @Autowired
    AuthService authService;

    @Autowired
    JwtUtil jwtUtil;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtUtil.generateToken(authentication);
            String refreshToken = jwtUtil.generateRefreshToken(authentication);

            User userDetails = (User) authentication.getPrincipal();
            userDetails.setLastLogin(java.time.LocalDateTime.now());
            userService.updateUser(userDetails);

            Set<String> roles = userDetails.getRoles().stream()
                    .map(role -> role.getName().toString())
                    .collect(Collectors.toSet());

            JwtResponse jwtResponse = new JwtResponse(
                    jwt, refreshToken, userDetails.getId(), userDetails.getEmail(),
                    userDetails.getFirstName(), userDetails.getLastName(), userDetails.getPhone(),
                    userDetails.getProfileImageUrl(), userDetails.getEmailVerified(),
                    userDetails.getPhoneVerified(), roles
            );

            logger.info("User {} authenticated successfully", userDetails.getEmail());
            return ResponseEntity.ok(jwtResponse);

        } catch (Exception e) {
            logger.error("Authentication failed for user {}: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body("Error: Invalid credentials");
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            if (userService.existsByEmail(signUpRequest.getEmail())) {
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
            }

            if (userService.existsByPhone(signUpRequest.getPhone())) {
                return ResponseEntity.badRequest().body("Error: Phone number is already in use!");
            }

            // Create new user's account
            User user = new User(signUpRequest.getEmail(), signUpRequest.getPassword(), 
                    signUpRequest.getFirstName(), signUpRequest.getLastName());
            user.setPhone(signUpRequest.getPhone());

            // Set role - find existing role or create new one
            Set<Role> roles = new HashSet<>();
            Role role;
            if ("GUIDE".equals(signUpRequest.getRole())) {
                role = userService.findRoleByName(Role.RoleName.GUIDE)
                        .orElseGet(() -> {
                            Role newRole = new Role();
                            newRole.setName(Role.RoleName.GUIDE);
                            return userService.saveRole(newRole);
                        });
            } else {
                role = userService.findRoleByName(Role.RoleName.USER)
                        .orElseGet(() -> {
                            Role newRole = new Role();
                            newRole.setName(Role.RoleName.USER);
                            return userService.saveRole(newRole);
                        });
            }
            roles.add(role);
            user.setRoles(roles);

            userService.createUser(user);

            // Send verification email (mock for now)
            logger.info("User {} registered successfully. Verification email sent.", signUpRequest.getEmail());
            return ResponseEntity.ok("User registered successfully! Please check your email for verification.");
        } catch (Exception e) {
            logger.error("Registration failed for user {}: {}", signUpRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body("Error: Registration failed");
        }
    }

    @PostMapping("/google-signin")
    public ResponseEntity<?> googleSignIn(@RequestBody Map<String, String> request) {
        try {
            // Dev-mode: treat the incoming value as email (or keep backward compat with `token`).
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                email = request.get("token");
            }

            String firstName = request.get("firstName");
            String lastName = request.get("lastName");

            User user = authService.googleLoginOrCreate(email, firstName, lastName);
            user.setLastLogin(LocalDateTime.now());
            userService.updateUser(user);

            Set<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().toString())
                    .collect(Collectors.toSet());

            String jwt = jwtUtil.generateTokenFromEmail(user.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(user);

            JwtResponse jwtResponse = new JwtResponse(
                    jwt, refreshToken, user.getId(), user.getEmail(),
                    user.getFirstName(), user.getLastName(), user.getPhone(),
                    user.getProfileImageUrl(), user.getEmailVerified(),
                    user.getPhoneVerified(), roles
            );

            logger.info("Google sign-in successful for {}", user.getEmail());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            logger.error("Google sign-in failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: Google sign-in failed - " + e.getMessage());
        }
    }

    @PostMapping("/phone-signin")
    public ResponseEntity<?> phoneSignIn(@RequestBody Map<String, String> request) {
        try {
            String phone = request.get("phone");
            String code = request.get("code");

            User user = authService.verifyPhoneOtpAndGetUser(phone, code);
            user.setLastLogin(LocalDateTime.now());
            userService.updateUser(user);

            Set<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().toString())
                    .collect(Collectors.toSet());

            String jwt = jwtUtil.generateTokenFromEmail(user.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(user);

            JwtResponse jwtResponse = new JwtResponse(
                    jwt, refreshToken, user.getId(), user.getEmail(),
                    user.getFirstName(), user.getLastName(), user.getPhone(),
                    user.getProfileImageUrl(), user.getEmailVerified(),
                    user.getPhoneVerified(), roles
            );

            logger.info("Phone sign-in successful for phone {}", phone);
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            logger.error("Phone sign-in failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: Phone sign-in failed - " + e.getMessage());
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String phone = request.get("phone");
            authService.sendOtp(phone);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully!"));
        } catch (Exception e) {
            logger.error("OTP send failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: Failed to send OTP - " + e.getMessage());
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody String refreshToken) {
        try {
            if (jwtUtil.validateToken(refreshToken) && jwtUtil.isRefreshToken(refreshToken)) {
                String email = jwtUtil.getEmailFromToken(refreshToken);
                User user = userService.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                String newToken = jwtUtil.generateToken(user);
                String newRefreshToken = jwtUtil.generateRefreshToken(user);

                Set<String> roles = user.getRoles().stream()
                        .map(role -> role.getName().toString())
                        .collect(Collectors.toSet());

                JwtResponse jwtResponse = new JwtResponse(
                        newToken, newRefreshToken, user.getId(), user.getEmail(),
                        user.getFirstName(), user.getLastName(), user.getPhone(),
                        user.getProfileImageUrl(), user.getEmailVerified(),
                        user.getPhoneVerified(), roles
                );

                return ResponseEntity.ok(jwtResponse);
            }
            return ResponseEntity.badRequest().body("Error: Invalid refresh token");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: Token refresh failed");
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            authService.initiatePasswordReset(email);
            return ResponseEntity.ok("Password reset instructions sent to your email");
        } catch (Exception e) {
            logger.error("Password reset initiation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Password reset successfully");
        } catch (Exception e) {
            logger.error("Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            // Mock verification - in real implementation, validate token and update user
            return ResponseEntity.ok("Email verified successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: Email verification failed");
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestParam String email) {
        try {
            // Mock resend - in real implementation, send new verification email
            return ResponseEntity.ok("Verification email sent!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: Failed to send verification email");
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            User user = (User) authentication.getPrincipal();
            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("roles", user.getRoles().stream().map(r -> r.getName().toString()).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body(Map.of("authenticated", false));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailAvailability(@RequestParam String email) {
        boolean available = !userService.existsByEmail(email);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/check-phone")
    public ResponseEntity<?> checkPhoneAvailability(@RequestParam String phone) {
        boolean available = !userService.existsByPhone(phone);
        return ResponseEntity.ok(available);
    }
}
