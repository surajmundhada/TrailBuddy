package com.trailbuddy.config;

import com.trailbuddy.entity.Booking;
import com.trailbuddy.entity.Experience;
import com.trailbuddy.entity.GuidePackage;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.Story;
import com.trailbuddy.entity.Role;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.ExperienceRepository;
import com.trailbuddy.repository.GuidePackageRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.RoleRepository;
import com.trailbuddy.repository.StoryRepository;
import com.trailbuddy.service.UserService;
import com.trailbuddy.service.TripSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
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
    private GuidePackageRepository guidePackageRepository;

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Lazy
    @Autowired
    private TripSessionService tripSessionService;

    @Value("${platform.commission.percentage:15}")
    private BigDecimal commissionPercentage;

    @Override
    public void run(String... args) {
        seedRoles();
        User admin = seedUserIfMissing("admin@trailbuddy.com", "Admin123!", "Admin", "Root");
        User traveler = seedUserIfMissing("traveler@trailbuddy.com", "Traveler123!", "Travel", "User");

        seedRoleForUser(admin, Role.RoleName.ADMIN);
        seedRoleForUser(traveler, Role.RoleName.USER);

        // One verified guide + one Hidden Gems listing per city (explore catalog).
        for (HiddenGemCitySeed gem : hiddenGemCitySeeds()) {
            User guideUser = seedUserIfMissing(gem.email(), "Guide123!", gem.firstName(), gem.lastName());
            seedRoleForUser(guideUser, Role.RoleName.GUIDE);
            Guide guide = getOrCreateGuide(guideUser, gem.city(), gem.state(), gem.aadhar());
            seedBookingIfMissing(traveler, guide);
            upsertAirbnbStylePackage(
                    guide,
                    gem.title(),
                    gem.description(),
                    gem.city(),
                    gem.duration(),
                    gem.price(),
                    gem.famousSpots(),
                    gem.hiddenSpots(),
                    gem.foodPlaces(),
                    gem.meetingPoint(),
                    gem.maxGuests(),
                    gem.hostIntro(),
                    gem.languages(),
                    gem.whatsIncluded()
            );
        }

        User delhiGuideUser = userRepository.findByEmail("guide@trailbuddy.com")
                .orElseThrow(() -> new RuntimeException("Seeded Delhi guide user missing"));
        User mumbaiGuideUser = userRepository.findByEmail("mumbai-guide@trailbuddy.com")
                .orElseThrow(() -> new RuntimeException("Seeded Mumbai guide user missing"));
        Guide delhiGuide = guideRepository.findByUserId(delhiGuideUser.getId())
                .orElseThrow(() -> new RuntimeException("Seeded Delhi guide profile missing"));
        Guide mumbaiGuide = guideRepository.findByUserId(mumbaiGuideUser.getId())
                .orElseThrow(() -> new RuntimeException("Seeded Mumbai guide profile missing"));
        seedBookingIfMissing(delhiGuideUser, mumbaiGuide);
        seedBookingIfMissing(mumbaiGuideUser, delhiGuide);
        seedBookingIfMissing(admin, delhiGuide);

        // Demo: one paid booking + trip session so guide OTP pickup flow works without running payment in the UI.
        ensureOtpFlowDemoBookingConfirmed(traveler, delhiGuide);

        seedStoryIfMissing(delhiGuide);

        // Seed experiences for the “Experience Unlocks” + “Explore Without a Guide” flows.
        seedExperienceIfMissing(
                "AUDIO_STORIES_SINGLE",
                com.trailbuddy.model.ExperienceScope.TRIP_ADDON,
                com.trailbuddy.model.ExperienceType.AUDIO_STORIES,
                null,
                0,
                true,
                "Audio Stories",
                "On-the-go audio storytelling that helps you feel the city around you.",
                List.of("audio"),
                List.of("audio", "stories")
        );
        seedExperienceIfMissing(
                "HIDDEN_HISTORY_SINGLE",
                com.trailbuddy.model.ExperienceScope.TRIP_ADDON,
                com.trailbuddy.model.ExperienceType.HIDDEN_HISTORY,
                null,
                29,
                false,
                "Hidden History",
                "Unlock lesser-known chapters and context behind landmarks.",
                List.of("history"),
                List.of("history", "hidden")
        );
        seedExperienceIfMissing(
                "LOCAL_FOOD_SECRETS_SINGLE",
                com.trailbuddy.model.ExperienceScope.TRIP_ADDON,
                com.trailbuddy.model.ExperienceType.LOCAL_FOOD_SECRETS,
                null,
                29,
                false,
                "Local Food Secrets",
                "Taste your way through trusted local food spots with guided tips.",
                List.of("food"),
                List.of("food", "secrets")
        );
        seedExperienceIfMissing(
                "NEARBY_HIDDEN_GEMS_PACK",
                com.trailbuddy.model.ExperienceScope.TRIP_ADDON,
                com.trailbuddy.model.ExperienceType.NEARBY_HIDDEN_GEMS,
                null,
                149,
                false,
                "Nearby Hidden Gems (City Pack)",
                "A curated city pack with multi-location storytelling and guided map moments.",
                List.of("gems"),
                List.of("gems", "city")
        );

        // Without-guide catalogs (used on welcome/home).
        seedExperienceIfMissing(
                "HERITAGE_WALK_QUICK",
                com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE,
                com.trailbuddy.model.ExperienceType.HERITAGE_WALK,
                com.trailbuddy.model.ExperienceCategory.QUICK_EXPERIENCE,
                29,
                false,
                "Heritage Walk",
                "Quick heritage route with bite-sized storytelling.",
                List.of(),
                List.of("heritage", "walk")
        );
        seedExperienceIfMissing(
                "LOCAL_FOOD_EXPRESS_QUICK",
                com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE,
                com.trailbuddy.model.ExperienceType.LOCAL_FOOD_EXPRESS,
                com.trailbuddy.model.ExperienceCategory.QUICK_EXPERIENCE,
                29,
                false,
                "Local Food Express",
                "Short and engaging food trail with local secrets.",
                List.of(),
                List.of("food", "express")
        );
        seedExperienceIfMissing(
                "HIDDEN_STREETS_QUICK",
                com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE,
                com.trailbuddy.model.ExperienceType.HIDDEN_STREETS,
                com.trailbuddy.model.ExperienceCategory.QUICK_EXPERIENCE,
                29,
                false,
                "Hidden Streets",
                "Discover tucked-away streets and stories in minutes.",
                List.of(),
                List.of("hidden", "streets")
        );
        seedExperienceIfMissing(
                "UNTOLD_STORIES_QUICK",
                com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE,
                com.trailbuddy.model.ExperienceType.UNTOLD_STORIES,
                com.trailbuddy.model.ExperienceCategory.QUICK_EXPERIENCE,
                29,
                false,
                "Untold Stories",
                "Short audio + text narrative for people-watching and moments.",
                List.of(),
                List.of("stories", "untold")
        );
        seedExperienceIfMissing(
                "CITY_TOUR_PACK_FULL",
                com.trailbuddy.model.ExperienceScope.WITHOUT_GUIDE,
                com.trailbuddy.model.ExperienceType.CITY_TOUR_PACK,
                com.trailbuddy.model.ExperienceCategory.CITY_TOUR,
                149,
                false,
                "City Tour Pack",
                "Full curated audio + map guided journey across multiple locations.",
                List.of(),
                List.of("city", "tour")
        );
    }

    private void seedExperienceIfMissing(
            String experienceKey,
            com.trailbuddy.model.ExperienceScope scope,
            com.trailbuddy.model.ExperienceType type,
            com.trailbuddy.model.ExperienceCategory category,
            int price,
            boolean isFree,
            String title,
            String description,
            List<String> images,
            List<String> tags
    ) {
        Optional<Experience> existing = experienceRepository.findByExperienceKey(experienceKey);
        if (existing.isPresent()) {
            return;
        }

        Experience e = new Experience();
        e.setExperienceKey(experienceKey);
        e.setScope(scope);
        e.setType(type);
        e.setCategory(category);
        e.setTitle(title);
        e.setDescription(description);
        e.setContent(description);
        e.setPrice(price);
        e.setIsFree(isFree);
        e.setImages(images);
        e.setTags(tags);
        experienceRepository.save(e);
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

    /**
     * Ensures the seeded traveler has a CONFIRMED booking with the Delhi demo guide and a trip session (pickup OTP).
     */
    private void ensureOtpFlowDemoBookingConfirmed(User traveler, Guide guide) {
        if (traveler == null || guide == null) {
            return;
        }
        seedBookingIfMissing(traveler, guide);
        List<Booking> candidates = new ArrayList<>();
        candidates.addAll(bookingRepository.findByUserIdAndStatus(traveler.getId(), Booking.BookingStatus.CONFIRMED));
        candidates.addAll(bookingRepository.findByUserIdAndStatus(traveler.getId(), Booking.BookingStatus.PENDING));
        Booking match = candidates.stream()
                .filter(b -> b.getGuide() != null && b.getGuide().getId().equals(guide.getId()))
                .findFirst()
                .orElse(null);
        if (match == null) {
            return;
        }
        if (match.getStatus() != Booking.BookingStatus.CONFIRMED) {
            match.setStatus(Booking.BookingStatus.CONFIRMED);
            bookingRepository.save(match);
        }
        tripSessionService.provisionSessionAfterBookingConfirmed(match.getId());
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

    private record HiddenGemCitySeed(
            String email,
            String firstName,
            String lastName,
            String city,
            String state,
            String aadhar,
            String title,
            String description,
            String duration,
            int price,
            List<String> famousSpots,
            List<String> hiddenSpots,
            List<String> foodPlaces,
            String meetingPoint,
            int maxGuests,
            String hostIntro,
            List<String> languages,
            List<String> whatsIncluded
    ) {}

    /** Curated demo listings so Hidden Gems /explore has hosts across India, not only NCR + Mumbai. */
    private static List<HiddenGemCitySeed> hiddenGemCitySeeds() {
        List<HiddenGemCitySeed> out = new ArrayList<>();
        out.add(new HiddenGemCitySeed(
                "guide@trailbuddy.com", "Local", "Guide", "Delhi", "Delhi", "123456789012",
                "Old Delhi Royal Food & Hidden Haveli Walk",
                "Walk Old Delhi like a local host—not a bus tour. Monuments, rooftop lanes, haveli courtyards, and family-run kitchens with recipes unchanged for generations.",
                "1 day", 2499,
                List.of("Jama Masjid", "Red Fort (exterior)", "Chandni Chowk"),
                List.of("Kinari Bazaar rooftops", "Ballimaran heritage lane", "Secret haveli courtyards"),
                List.of("Paranthe Wali Gali", "Karim's", "Daulat ki Chaat", "Old stall chai"),
                "Chandni Chowk Metro Gate 1 — mural map (15 min early)", 8,
                "Raised between Ballimaran and Kinari Bazaar; I host the same pace for travelers I'd give friends.",
                List.of("Hindi", "English"),
                List.of("Small group", "Walking route", "Food tastings", "Recap map", "Rain backup stops")
        ));
        out.add(new HiddenGemCitySeed(
                "mumbai-guide@trailbuddy.com", "Mumbai", "Guide", "Mumbai", "Maharashtra", "987654321098",
                "Mumbai Icons, Koli Secrets & Coastal Food Trail",
                "Two days: sea mornings, heritage villages, Mohammed Ali Road nights—Airbnb-style structure with room for Mumbai's surprises.",
                "2 days", 4899,
                List.of("Gateway of India", "Marine Drive", "Colaba Causeway"),
                List.of("Khotachiwadi", "Worli Koliwada", "Bandra steps & street art"),
                List.of("Irani breakfast", "Mohammed Ali Road", "Koli seafood", "Filter coffee"),
                "Gateway — left lion tiles (D1); Bandra West (D2, messaged prior)", 6,
                "Licensed guide and Koliwada regular—postcard Mumbai plus working harbours and Irani cafes.",
                List.of("English", "Hindi", "Marathi"),
                List.of("Two hosted days", "Coastal & heritage", "Snacks & water", "WhatsApp between days")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-bengaluru@trailbuddy.com", "Namma", "Host", "Bengaluru", "Karnataka", "112233445501",
                "Cubbon to Cantonment — Lakes, Markets & Filter Coffee",
                "Slow Bengaluru: Cubbon mornings, KR Market colours, Jayanagar 4th Block eats, and corners only regulars know.",
                "1 day", 2199,
                List.of("Cubbon Park", "Vidhana Soudha exterior", "KR Market"),
                List.of("Russell Market lanes", "Jayanagar 4th Tiffin corridors", "Ulsoor lake edge calm"),
                List.of("Filter kaapi trail", "Benne masala dose", "Military hotel-style lunch"),
                "Cubbon Park metro Plaza side — banyan bench 10 min early", 8,
                "Engineer-turned-walker: I map Bengaluru as neighbourhoods, not traffic.",
                List.of("English", "Kannada", "Hindi"),
                List.of("Small group", "Local transit tips", "Breakfast + snack stops", "Route PDF")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-jaipur@trailbuddy.com", "Pink", "City", "Jaipur", "Rajasthan", "112233445502",
                "Amber Fort Views & Johari Bazaar Backlanes",
                "Fort drama at golden hour, then Johari and Tripolia without the souvenir trap—jewellers' courtyards and rooftop chai.",
                "1 day", 2799,
                List.of("Amber Fort approach", "Hawa Mahal photo walk", "City Palace edge"),
                List.of("Johari backlanes", "Tripolia gate angles", "Old walled city rooftops"),
                List.of("Kachori-sabzi", "Lassi", "Masala chai at a 60-year shop"),
                "Johari Bazaar main arch — left chai stall", 7,
                "Third-generation Johari lane regular; I decode pink city craft and chaos calmly.",
                List.of("Hindi", "English"),
                List.of("Heritage walking", "Shopping tips", "Sunset stop", "Water")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-goa@trailbuddy.com", "Coastal", "Host", "Goa", "Goa", "112233445503",
                "Fontainhas Latin Quarter & Old Goa Spice Stories",
                "Portuguese tiles, river churches, and beach-shack balance—heritage morning, hidden cove option, seafood evening.",
                "2 days", 4299,
                List.of("Basilica Old Goa", "Fontainhas", "Miramar sunset"),
                List.of("Velha Goa orchard lane", "Bat Island viewpoint track", "Assagao quiet cafes"),
                List.of("Fish thali", "Bebinca tasting", "Coconut toddy stop (seasonal)"),
                "Panaji Immaculate Conception steps — Day 1; Mapusa circle Day 2 texted eve before", 6,
                "Goa-born: I split time between Latin Quarter stories and working-fisherfolk kitchens.",
                List.of("English", "Hindi", "Konkani basics"),
                List.of("Two days hosted", "Heritage + coast", "Snacks", "Beach backup plan")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-kolkata@trailbuddy.com", "Para", "Walker", "Kolkata", "West Bengal", "112233445504",
                "North Kolkata Zamindar Lanes & College Street Boi Para",
                "Tram-era lanes, book stacks, adda cafés, and hidden courtyards—Kolkata intellectual and chaotic in one walk.",
                "1 day", 2299,
                List.of("Victoria Memorial lawns", "Howrah view", "College Street"),
                List.of("Shobhabazar rajbari lane", "Kumortuli lanes (season)", "Hidden courtyard thakur dalan"),
                List.of("Kochuri ghugni", "Mishti sampler", "Coffee House adda"),
                "College Street coffee house — central pillar 15 min early", 8,
                "North Kolkata raised; I read the city through paras, poras, and poetry.",
                List.of("Bengali", "English", "Hindi"),
                List.of("Walking + tram hop tip", "Book lane map", "Misti stops", "Monsoon indoor alt")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-chennai@trailbuddy.com", "Marina", "Guide", "Chennai", "Tamil Nadu", "112233445505",
                "Mylapore Temple Tank & Marina Dawn Food Circuit",
                "Filter coffee before light, Mylapore gopuram calm, Marina breeze, and hidden mess halls locals queue for.",
                "1 day", 2099,
                List.of("Kapaleeshwarar temple tank", "Marina stretch", "San Thome exterior"),
                List.of("Mylapore flower bazaar back", "Triplicane mess lane", "Bessie rocky pockets"),
                List.of("Idli-vadai-sambar", "Meals on banana leaf", "Jigarthanda"),
                "Mylapore tank east steps — kolam side", 8,
                "Chennai weekend walker: temples, sea, and honest mess food only insiders time right.",
                List.of("Tamil", "English"),
                List.of("Early start option", "Vegetarian-friendly route", "Mess tips", "Water")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-hyderabad@trailbuddy.com", "Charminar", "Host", "Hyderabad", "Telangana", "112233445506",
                "Charminar Dawn & Laad Bazaar Pearl Backshops",
                "Before heat: Charminar angles, pearl stringing workshops, and haleem or dosa lanes your maps skip.",
                "1 day", 2399,
                List.of("Charminar", "Mecca Masjid edge", "Salar Jung approach"),
                List.of("Laad Bazaar upper workshops", "Pathar gatti secrets", "Old city roof chai"),
                List.of("Irani chai Osmania", "Haleem (season)", "Hyderabadi biryani insight stop"),
                "Charminar — Mecca Masjid side meeting tiles", 8,
                "Old City resident: I time lanes for light, crowds, and the best chai pause.",
                List.of("Urdu phrases", "Hindi", "English"),
                List.of("Dawn slot", "Small group", "Workshop peeks", "Hydration")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-pune@trailbuddy.com", "Ghats", "Walker", "Pune", "Maharashtra", "112233445507",
                "Shaniwar Wada to FC Road — Peths, Poetry & Misal",
                "Peshwa core, student FC energy, and a misal ranking only Punekars argue about.",
                "1 day", 1999,
                List.of("Shaniwar Wada", "Aga Khan Palace lawns", "FC Road pulse"),
                List.of("Kasba peth narrow cuts", "Tulshibaug lanes", "Hidden wada courtyards"),
                List.of("Misal marathon", "Bakarwadi", "Strong matka chai"),
                "Shaniwar Wada main gate — left ticket shade", 8,
                "Pune university days never left me—I'm still a flâneur with a misal spreadsheet.",
                List.of("Marathi", "Hindi", "English"),
                List.of("Walk + snack budget tips", "College crowd timing", "Map sketch")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-udaipur@trailbuddy.com", "Lake", "Host", "Udaipur", "Rajasthan", "112233445508",
                "Sunrise Lake Pichola Ghats & Vintage Pol Gates",
                "Ghats before boats, pol gates locals use, and rooftop views without the cover-charge circus.",
                "1 day", 3199,
                List.of("City Palace viewpoint", "Jagdish temple square", "Ambrai ghat"),
                List.of("Brahmpol to Hanuman ghat walk", "Hidden haveli tea", "Sunset island angle"),
                List.of("Dal baati insight", "Kachori", "Lassi by the lake"),
                "Jagdish Chowk — temple elephant niche", 6,
                "Udaipur mural artist: I thread lakes, pols, and light like a studio day.",
                List.of("Hindi", "English"),
                List.of("Sunrise option", "Small group", "Rooftop ethics", "Water")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-varanasi@trailbuddy.com", "Ghat", "Storyteller", "Varanasi", "Uttar Pradesh", "112233445509",
                "Assi to Dashashwamedh — Alleys, Aartis & Akhadas",
                "Alley logic, silk workshops, evening aarti positioning, and morning boat rhythm—respect-led, non-performative.",
                "2 days", 4599,
                List.of("Dashashwamedh Ghat", "Assi Ghat", "Kashi Vishwanath lane approach"),
                List.of("Silk weaver homes", "Hidden akhada courtyards", "Manikarnika respectful perimeter"),
                List.of("Blue lassi lane", "Kachori sabzi", "Banarasi paan story stop"),
                "Assi Ghat — Hanuman mural steps (Day 1); Dashashwamedh north Day 2", 6,
                "Varanasi decade on foot: I teach ghat etiquette and where silence still exists.",
                List.of("Hindi", "English"),
                List.of("Two days", "Boat add-on tips", "Clothing guidance", "Respect briefing")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-kochi@trailbuddy.com", "Cochin", "Host", "Kochi", "Kerala", "112233445510",
                "Fort Kochi Nets, Jew Town & Spice Warehouse Lofts",
                "Chinese nets mechanics, Jew Town lanes, and warehouse lofts turned galleries—Coastal Kerala slow travel.",
                "1 day", 2699,
                List.of("Chinese fishing nets", "St. Francis Church", "Jew Town"),
                List.of("Spice warehouse lofts", "Burgher street murals", "Hidden courtyard galleries"),
                List.of("Karimeen fry story", "Appam-stew stop", "Tender coconut trail"),
                "Fort Kochi nets — red bench co-op side", 7,
                "Fort Kochi resident: nets, spices, and Syrian Christian kitchen stories.",
                List.of("Malayalam", "English"),
                List.of("Small group", "Gallery timings", "Spice shopping tips", "Sun hat reminder")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-ahmedabad@trailbuddy.com", "Pol", "Walker", "Ahmedabad", "Gujarat", "112233445511",
                "Old City Pols, Stepwells & Law Garden Khakra Trail",
                "Unesco pol houses, Adalaj stepwell option, and Law Garden night market energy without getting lost.",
                "1 day", 1899,
                List.of("Jama Masjid (Ahmedabad)", "Bhadra Fort edge", "Law Garden"),
                List.of("Dhal ni pol", "Secret bird-feeder roofs", "Teen Darwaza angles"),
                List.of("Undhiyu season talk", "Fafda-jalebi", "Khakra tasting"),
                "Teen Darwaza — east arch shade", 8,
                "Heritage volunteer turned guide: pols are living flats, not museum sets.",
                List.of("Gujarati", "Hindi", "English"),
                List.of("Heritage walk", "Stepwell slot if open", "Night market map", "Water")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-shimla@trailbuddy.com", "Ridge", "Host", "Shimla", "Himachal Pradesh", "112233445512",
                "Ridge to Mall — Viceregal Echoes & Hidden Stair Lanes",
                "Raj summer capital layers: Ridge views, stair shortcuts locals use, and bakery stories from the hill station.",
                "1 day", 2599,
                List.of("The Ridge", "Christ Church", "Scandal Point"),
                List.of("Lower bazaar stair maze", "Hidden oak viewpoints", "Viceregal Lodge approach walk"),
                List.of("Tudor bakery bun", "Chana madra cafe", "Himachali siddu (season)"),
                "Ridge — Gaiety Theatre corner flagpole", 7,
                "Shimla decade: I time Ridge for cloud drama and stairs for knee-friendly loops.",
                List.of("Hindi", "English", "Pahari phrases"),
                List.of("Hill pacing", "Weather backup", "Small group", "Walking poles on request")
        ));
        out.add(new HiddenGemCitySeed(
                "guide-amritsar@trailbuddy.com", "Golden", "Host", "Amritsar", "Punjab", "112233445513",
                "Golden Temple Pre-Dawn & Partition Museum Quiet Hour",
                "Jallianwala context, Partition Museum before crowds, then langar rhythm and old-city kulcha lanes.",
                "1 day", 2399,
                List.of("Golden Temple", "Jallianwala Bagh", "Partition Museum"),
                List.of("Old city kulcha lanes", "Hidden phulkari workshops", "Ram Bagh calm"),
                List.of("Amritsari kulcha", "Langar insight", "Lassi"),
                "Partition Museum — ticket queue left tree", 8,
                "Amritsar born: I balance devotion, history, and the city's loud kindness.",
                List.of("Punjabi", "Hindi", "English"),
                List.of("Covering cloth guidance", "History context", "Small group", "Water")
        ));
        return out;
    }

    private void upsertAirbnbStylePackage(
            Guide guide,
            String title,
            String description,
            String city,
            String duration,
            int price,
            java.util.List<String> famousSpots,
            java.util.List<String> hiddenSpots,
            java.util.List<String> foodPlaces,
            String meetingPoint,
            int maxGuests,
            String hostIntro,
            java.util.List<String> languages,
            java.util.List<String> whatsIncluded
    ) {
        GuidePackage p = guidePackageRepository.findFirstByGuide_IdAndTitle(guide.getId(), title).orElseGet(GuidePackage::new);
        if (p.getId() == null) {
            p.setGuide(guide);
        }
        p.setTitle(title);
        p.setDescription(description);
        p.setCity(city);
        p.setDuration(duration);
        p.setPrice(price);
        p.setFamousSpots(famousSpots);
        p.setHiddenSpots(hiddenSpots);
        p.setFoodPlaces(foodPlaces);
        p.setMeetingPoint(meetingPoint);
        p.setMaxGuests(maxGuests);
        p.setHostIntro(hostIntro);
        p.setLanguages(languages);
        p.setWhatsIncluded(whatsIncluded);
        guidePackageRepository.save(p);
    }
}

