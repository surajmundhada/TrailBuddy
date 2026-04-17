package com.trailbuddy.config;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Story;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.RoleRepository;
import com.trailbuddy.repository.StoryRepository;
import com.trailbuddy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;

import com.trailbuddy.repository.UserRepository;

@Component
public class DevDataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StoryRepository storyRepository;

    @Value("${platform.commission.percentage:15}")
    private BigDecimal commissionPercentage;

    @Override
    public void run(String... args) {
        seedRoles();
        User admin = seedUserIfMissing("admin@trailbuddy.com", "Admin123!", "Admin", "Root");
        User traveler = seedUserIfMissing("traveler@trailbuddy.com", "Traveler123!", "Travel", "User");
        User guideUser = seedUserIfMissing("guide@trailbuddy.com", "Guide123!", "Local", "Guide");
        User mumbaiGuideUser = seedUserIfMissing("mumbai-guide@trailbuddy.com", "Guide123!", "Mumbai", "Guide");

        seedRoleForUser(admin, Role.RoleName.ADMIN);
        seedRoleForUser(traveler, Role.RoleName.USER);
        seedRoleForUser(guideUser, Role.RoleName.GUIDE);
        seedRoleForUser(mumbaiGuideUser, Role.RoleName.GUIDE);

        Guide delhiGuide = getOrCreateGuide(guideUser, "Delhi", "Delhi", "123456789012");
        Guide mumbaiGuide = getOrCreateGuide(mumbaiGuideUser, "Mumbai", "Maharashtra", "987654321098");

        // Seed bookings so every seeded account has at least one booking to display.
        // When ddl-auto=update, we must avoid creating duplicate bookings on every restart.
        seedBookingIfMissing(traveler, delhiGuide);
        seedBookingIfMissing(traveler, mumbaiGuide);
        seedBookingIfMissing(guideUser, mumbaiGuide);
        seedBookingIfMissing(mumbaiGuideUser, delhiGuide);
        seedBookingIfMissing(admin, delhiGuide);

        seedStoryIfMissing(delhiGuide);
    }

    private void seedRoles() {
        for (Role.RoleName roleName : Role.RoleName.values()) {
            roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));
        }
    }

    private User seedUserIfMissing(String email, String rawPassword, String firstName, String lastName) {
        if (userService.existsByEmail(email)) {
            return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User missing: " + email));
        }

        User user = new User(email, rawPassword, firstName, lastName);
        user.setIsActive(true);
        user.setPhone("9876543210");
        return userService.createUser(user);
    }

    private void seedRoleForUser(User user, Role.RoleName roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        boolean alreadyHasRole = user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.getName() == roleName);
        if (!alreadyHasRole) {
            user.getRoles().add(role);
            userService.updateUser(user);
        }
    }

    private Guide getOrCreateGuide(User guideUser, String city, String state, String aadharNumber) {
        // Avoid duplicates on restarts when ddl-auto=update.
        return guideRepository.findByUserId(guideUser.getId())
                .orElseGet(() -> {
                    Guide guide = new Guide();
                    guide.setUser(guideUser);
                    guide.setAadharNumber(aadharNumber);
                    guide.setAadharVerified(true);

                    guide.setBio("Local guide specializing in authentic city experiences and curated local culture.");
                    guide.setCity(city);
                    guide.setState(state);
                    guide.setLanguages(List.of("Hindi", "English"));
                    guide.setExpertiseAreas(List.of("Heritage Tours", "Cultural Tours"));
                    guide.setHourlyRate(new BigDecimal("1000"));
                    guide.setDailyRate(new BigDecimal("8000"));
                    guide.setExperienceYears(7);
                    guide.setTotalBookings(0);
                    guide.setAverageRating(new BigDecimal("4.7"));
                    guide.setTotalReviews(0);
                    guide.setIsVerified(true);
                    guide.setIsApproved(true);
                    guide.setIsAvailable(true);
                    return guideRepository.save(guide);
                });
    }

    private void seedBookingIfMissing(User traveler, Guide guide) {
        // Create one pending booking for the user + guide if not already present.
        List<Booking> existingPending = bookingRepository.findByUserIdAndStatus(
                traveler.getId(), Booking.BookingStatus.PENDING);
        boolean alreadyHas = existingPending.stream().anyMatch(b -> b.getGuide() != null && b.getGuide().getId().equals(guide.getId()));
        if (alreadyHas) return;

        // Create one pending booking for the traveler.
        BigDecimal totalAmount = guide.getDailyRate() != null ? guide.getDailyRate() : BigDecimal.valueOf(8000);
        BigDecimal feeRate = commissionPercentage.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        BigDecimal platformFee = totalAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);

        Booking booking = new Booking();
        booking.setUser(traveler);
        booking.setGuide(guide);

        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(2);
        booking.setStartDate(start);
        booking.setEndDate(end);

        booking.setTotalAmount(totalAmount);
        booking.setPlatformFee(platformFee);
        booking.setGuideEarnings(guideEarnings);
        booking.setStatus(Booking.BookingStatus.PENDING);

        bookingRepository.save(booking);
    }

    private void seedStoryIfMissing(Guide guide) {
        boolean storyExists = storyRepository.findByGuideId(guide.getId(), PageRequest.of(0, 1)).hasContent();
        if (storyExists) return;

        Story story = new Story();
        story.setGuide(guide);
        story.setTitle("Delhi Heritage Walk - Sample Story");
        story.setContent("A quick sample story to test the Stories page. Explore the old lanes, heritage monuments, and local flavors with your guide.");
        story.setImages(List.of());
        story.setTags(List.of("heritage", "delhi", "food"));
        story.setLocation(guide.getCity());
        story.setIsPublic(true);
        storyRepository.save(story);
    }
}

