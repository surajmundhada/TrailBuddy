package com.trailbuddy.controller;

import com.trailbuddy.entity.User;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.service.GuideService;
import com.trailbuddy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private GuideService guideService;

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: Failed to get user profile");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody User userDetails, Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            currentUser.setFirstName(userDetails.getFirstName());
            currentUser.setLastName(userDetails.getLastName());
            currentUser.setPhone(userDetails.getPhone());
            
            User updatedUser = userService.updateUser(currentUser);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: Failed to update profile");
        }
    }

    @GetMapping("/guide-status")
    public ResponseEntity<?> getGuideStatus(Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            try {
                Guide g = guideService.resolveGuideProfile(currentUser);
                return ResponseEntity.ok(Map.of(
                        "hasGuide", true,
                        "aadharVerified", g.getAadharVerified(),
                        "isVerified", g.getIsVerified(),
                        "isApproved", g.getIsApproved()
                ));
            } catch (Exception ignored) {
                return ResponseEntity.ok(Map.of(
                        "hasGuide", false,
                        "aadharVerified", false,
                        "isVerified", false,
                        "isApproved", false
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
