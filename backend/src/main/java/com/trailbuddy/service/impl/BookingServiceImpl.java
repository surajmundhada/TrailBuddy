package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuidePackage;
import com.trailbuddy.entity.Booking;
import com.trailbuddy.dto.BookingDTO;
import com.trailbuddy.dto.GuideQuotationRequest;
import com.trailbuddy.entity.GuideProposal;
import com.trailbuddy.entity.User;
import com.trailbuddy.model.QuotationStatus;
import com.trailbuddy.repository.GuidePackageRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.repository.BookingRepository;
import com.trailbuddy.repository.UserRepository;
import com.trailbuddy.service.BookingService;
import com.trailbuddy.service.TripSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private GuidePackageRepository guidePackageRepository;

    @Lazy
    @Autowired
    private TripSessionService tripSessionService;

    // Percentage value (e.g. 15 means 15%)
    @Value("${platform.commission.percentage:15}")
    private BigDecimal commissionPercentage;

    @Override
    public Booking createBooking(BookingDTO bookingDTO) {
        if (bookingDTO.getUserId() == null || bookingDTO.getGuideId() == null) {
            throw new RuntimeException("Missing userId/guideId for booking");
        }
        if (bookingDTO.getStartDate() == null || bookingDTO.getEndDate() == null) {
            throw new RuntimeException("Missing startDate/endDate for booking");
        }
        User user = userRepository.findById(bookingDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Guide guide = guideRepository.findById(bookingDTO.getGuideId())
                .orElseThrow(() -> new RuntimeException("Guide not found"));

        GuidePackage linkedPackage = null;
        if (bookingDTO.getGuidePackageId() != null) {
            linkedPackage = guidePackageRepository.findByIdAndGuide_Id(bookingDTO.getGuidePackageId(), guide.getId())
                    .orElseThrow(() -> new RuntimeException("Package not found for this guide"));
        }

        boolean packageListing = linkedPackage != null;
        boolean curatedFlow = !packageListing
                && (Boolean.TRUE.equals(bookingDTO.getUseCuratedQuotation())
                || (bookingDTO.getTravelerPreferences() != null && !bookingDTO.getTravelerPreferences().isBlank()));

        // Enforce non-overlapping bookings at service layer as well (defense in depth).
        List<Booking.BookingStatus> activeStatuses = new ArrayList<>();
        activeStatuses.add(Booking.BookingStatus.PENDING);
        activeStatuses.add(Booking.BookingStatus.CONFIRMED);
        activeStatuses.add(Booking.BookingStatus.COMPLETED);
        boolean overlap = bookingRepository.existsOverlappingBooking(
                guide.getId(),
                bookingDTO.getStartDate(),
                bookingDTO.getEndDate(),
                activeStatuses
        );
        if (overlap) {
            throw new RuntimeException("Guide is already booked for overlapping dates");
        }

        long tripDays = ChronoUnit.DAYS.between(bookingDTO.getStartDate(), bookingDTO.getEndDate()) + 1;
        if (tripDays <= 0) {
            throw new RuntimeException("Invalid booking dates");
        }

        boolean needsVehicle = Boolean.TRUE.equals(bookingDTO.getNeedsVehicle());
        boolean vehicleAc = Boolean.TRUE.equals(bookingDTO.getVehicleAc());
        int passengerCount = bookingDTO.getPassengerCount() != null ? bookingDTO.getPassengerCount() : 1;
        if (passengerCount <= 0) {
            throw new RuntimeException("Passenger count must be at least 1");
        }

        if (packageListing) {
            int expectedDays = experienceDayCount(linkedPackage.getDuration());
            if (tripDays != expectedDays) {
                throw new RuntimeException("Trip length must match this experience (" + expectedDays + " day(s))");
            }
            if (linkedPackage.getMaxGuests() != null && passengerCount > linkedPackage.getMaxGuests()) {
                throw new RuntimeException("This experience allows at most " + linkedPackage.getMaxGuests() + " guests");
            }
        }

        BigDecimal dailyRate = guide.getDailyRate() != null
                ? guide.getDailyRate()
                : (guide.getHourlyRate() != null ? guide.getHourlyRate().multiply(BigDecimal.valueOf(8)) : BigDecimal.ZERO);
        BigDecimal guideBaseAmount = dailyRate.multiply(BigDecimal.valueOf(tripDays)).setScale(2, RoundingMode.HALF_UP);
        if (packageListing) {
            guideBaseAmount = BigDecimal.valueOf(linkedPackage.getPrice()).setScale(2, RoundingMode.HALF_UP);
        }

        double distanceKm = bookingDTO.getDistanceKm() != null ? bookingDTO.getDistanceKm() : 0.0;
        BigDecimal vehicleAmount = BigDecimal.ZERO;
        if (needsVehicle) {
            if (distanceKm <= 0) {
                throw new RuntimeException("Distance (km) is required when vehicle is selected");
            }
            BigDecimal perKm = vehicleAc ? BigDecimal.valueOf(30) : BigDecimal.valueOf(25);
            vehicleAmount = perKm.multiply(BigDecimal.valueOf(distanceKm)).setScale(2, RoundingMode.HALF_UP);
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setGuide(guide);
        booking.setStartDate(bookingDTO.getStartDate());
        booking.setEndDate(bookingDTO.getEndDate());
        booking.setStatus(Booking.BookingStatus.PENDING);

        if (curatedFlow) {
            booking.setTravelerPreferences(bookingDTO.getTravelerPreferences());
            booking.setQuotationStatus(QuotationStatus.AWAITING_GUIDE);
            booking.setTotalAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            booking.setPlatformFee(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            booking.setGuideEarnings(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            booking.setSpecialRequirements(String.join("\n",
                    "passengerCount=" + passengerCount,
                    "needsVehicle=" + needsVehicle,
                    "vehicleAc=" + vehicleAc,
                    "distanceKm=" + distanceKm,
                    "guideBaseAmount=" + guideBaseAmount,
                    "vehicleAmount=" + vehicleAmount,
                    "curatedQuotationFlow=true"
            ));
            return bookingRepository.save(booking);
        }

        BigDecimal totalAmount = guideBaseAmount.add(vehicleAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal feeRate = commissionPercentage.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        BigDecimal platformFee = totalAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);

        booking.setQuotationStatus(QuotationStatus.NONE);
        booking.setTotalAmount(totalAmount);
        booking.setPlatformFee(platformFee);
        booking.setGuideEarnings(guideEarnings);
        if (packageListing) {
            booking.setGuidePackageId(linkedPackage.getId());
        }
        List<String> specLines = new ArrayList<>(List.of(
                "passengerCount=" + passengerCount,
                "needsVehicle=" + needsVehicle,
                "vehicleAc=" + vehicleAc,
                "distanceKm=" + distanceKm,
                "guideBaseAmount=" + guideBaseAmount,
                "vehicleAmount=" + vehicleAmount
        ));
        if (packageListing) {
            specLines.add("listedExperience=true");
            specLines.add("guidePackageId=" + linkedPackage.getId());
            specLines.add("packageTitle=" + linkedPackage.getTitle());
        }
        booking.setSpecialRequirements(String.join("\n", specLines));

        return bookingRepository.save(booking);
    }

    /** Parses strings like "1 day", "2 days", "3 day experience" for fixed-price package bookings. */
    private static int experienceDayCount(String duration) {
        if (duration == null || duration.isBlank()) {
            return 1;
        }
        Matcher m = Pattern.compile("(\\d+)\\s*day", Pattern.CASE_INSENSITIVE).matcher(duration.trim());
        if (m.find()) {
            int n = Integer.parseInt(m.group(1));
            return Math.max(1, Math.min(14, n));
        }
        return 1;
    }

    private BigDecimal[] splitPlatformAndGuideEarnings(BigDecimal totalAmount) {
        BigDecimal feeRate = commissionPercentage.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        BigDecimal platformFee = totalAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee).setScale(2, RoundingMode.HALF_UP);
        return new BigDecimal[]{platformFee, guideEarnings};
    }

    @Override
    public Booking submitGuideQuotation(Long bookingId, GuideQuotationRequest request, User guideUser) {
        if (request == null || request.getQuotedAmount() == null) {
            throw new RuntimeException("quotedAmount is required");
        }
        if (request.getQuotedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Quoted amount must be positive");
        }
        Guide guide = guideRepository.findByUserId(guideUser.getId())
                .orElseThrow(() -> new RuntimeException("Guide profile not found"));
        Booking booking = bookingRepository.findByIdAndGuideId(bookingId, guide.getId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getQuotationStatus() != QuotationStatus.AWAITING_GUIDE) {
            throw new RuntimeException("Quotation cannot be submitted for status: " + booking.getQuotationStatus());
        }

        BigDecimal total = request.getQuotedAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal[] split = splitPlatformAndGuideEarnings(total);
        booking.setGuideCuratedQuotation(request.getCuratedText());
        booking.setTotalAmount(total);
        booking.setPlatformFee(split[0]);
        booking.setGuideEarnings(split[1]);
        booking.setQuotationStatus(QuotationStatus.SENT);
        return bookingRepository.save(booking);
    }

    @Override
    public Booking acceptQuotation(Long bookingId, User traveler) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, traveler.getId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getQuotationStatus() != QuotationStatus.SENT) {
            throw new RuntimeException("No pending quotation to accept");
        }
        booking.setQuotationStatus(QuotationStatus.ACCEPTED);
        return bookingRepository.save(booking);
    }

    @Override
    public Booking declineQuotation(Long bookingId, User traveler) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, traveler.getId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getQuotationStatus() != QuotationStatus.SENT) {
            throw new RuntimeException("No pending quotation to decline");
        }
        booking.setQuotationStatus(QuotationStatus.DECLINED);
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason("Traveler declined the guide's quotation");
        return bookingRepository.save(booking);
    }

    @Override
    public Booking createBookingFromProposal(GuideProposal proposal, User traveler) {
        if (proposal == null) {
            throw new RuntimeException("Proposal is required");
        }
        Guide guide = guideRepository.findById(proposal.getGuideId())
                .orElseThrow(() -> new RuntimeException("Guide not found"));
        if (!Objects.equals(proposal.getTravelerId(), traveler.getId())) {
            throw new RuntimeException("Traveler does not own this proposal");
        }

        BigDecimal totalAmount = BigDecimal.valueOf(proposal.getPrice()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal[] split = splitPlatformAndGuideEarnings(totalAmount);
        LocalDate startDate = LocalDate.now().plusDays(1);
        int totalDays = proposal.getDays() == null || proposal.getDays() < 1 ? 1 : proposal.getDays();

        Booking booking = new Booking();
        booking.setUser(traveler);
        booking.setGuide(guide);
        booking.setStartDate(startDate);
        booking.setEndDate(startDate.plusDays(totalDays - 1L));
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setQuotationStatus(QuotationStatus.ACCEPTED);
        booking.setTotalAmount(totalAmount);
        booking.setPlatformFee(split[0]);
        booking.setGuideEarnings(split[1]);
        booking.setTravelerRequestId(proposal.getTravelerRequest().getId());
        booking.setProposalId(proposal.getId());
        booking.setTravelerPreferences(proposal.getTravelerRequest().getFreeText());
        booking.setGuideCuratedQuotation(proposal.getItinerary());
        booking.setSpecialRequirements(String.join("\n",
                "proposalAcceptanceFlow=true",
                "datesPendingFinalConfirmation=true",
                "proposalTitle=" + proposal.getTitle(),
                "proposalDays=" + totalDays
        ));

        return bookingRepository.save(booking);
    }

    @Override
    public Booking updateBooking(Long id, BookingDTO bookingDTO) {
        Booking booking = getBookingById(id);
        booking.setStartDate(bookingDTO.getStartDate());
        booking.setEndDate(bookingDTO.getEndDate());
        booking.setTotalAmount(new java.math.BigDecimal(bookingDTO.getAmount().toString()));
        booking.setStatus(Booking.BookingStatus.valueOf(bookingDTO.getStatus()));
        return bookingRepository.save(booking);
    }

    @Override
    public Booking getBookingById(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new RuntimeException("Booking not found");
        }

        if (user.isAdmin()) {
            return bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
        }

        Optional<Booking> travelerOwnedBooking = bookingRepository.findByIdAndUserId(id, user.getId());
        if (travelerOwnedBooking.isPresent()) {
            return travelerOwnedBooking.get();
        }

        if (user.isGuide()) {
            return bookingRepository.findByIdAndGuideUserId(id, user.getId())
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
        }

        throw new RuntimeException("Booking not found");
    }

    @Override
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    @Override
    public Page<Booking> getBookingsForUser(User user, Pageable pageable) {
        if (user == null) {
            throw new RuntimeException("Authenticated user is required");
        }

        if (user.isAdmin()) {
            return bookingRepository.findAll(pageable);
        }

        if (user.isGuide()) {
            return bookingRepository.findByGuideUserId(user.getId(), pageable);
        }

        return bookingRepository.findByUserId(user.getId(), pageable);
    }

    @Override
    public Page<Booking> getUserBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable);
    }

    @Override
    public Page<Booking> getGuideBookings(Long guideId, Pageable pageable) {
        return bookingRepository.findByGuideId(guideId, pageable);
    }

    @Override
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Override
    public Booking completeBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    @Override
    public Booking updateBookingStatus(Long id, Booking.BookingStatus status, String reason) {
        Booking booking = getBookingById(id);
        Booking.BookingStatus prev = booking.getStatus();
        booking.setStatus(status);
        if (reason != null) {
            booking.setCancellationReason(reason);
        }
        // Update guide stats when status changes to confirmed/completed.
        if (booking.getGuide() != null && prev != status) {
            Guide guide = booking.getGuide();
            if (status == Booking.BookingStatus.CONFIRMED || status == Booking.BookingStatus.COMPLETED) {
                guide.setTotalBookings((guide.getTotalBookings() == null ? 0 : guide.getTotalBookings()) + 1);
                guideRepository.save(guide);
            }
        }
        Booking saved = bookingRepository.save(booking);
        if (status == Booking.BookingStatus.CONFIRMED) {
            tripSessionService.provisionSessionAfterBookingConfirmed(saved.getId());
        }
        return saved;
    }

    @Override
    public Booking cancelBooking(Long id, String reason) {
        Booking booking = getBookingById(id);
        Booking.BookingStatus prev = booking.getStatus();
        // Cancellation policy (simple):
        // - If cancelled on/after start date => 50% fee
        // - Otherwise => 10% fee
        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        LocalDate today = LocalDate.now();
        boolean late = booking.getStartDate() != null && !today.isBefore(booking.getStartDate());
        BigDecimal feeRate = late ? new BigDecimal("0.50") : new BigDecimal("0.10");
        BigDecimal cancellationFee = total.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        // Store fee in specialRequirements field (keeps schema stable); frontend receipt will display it.
        String existing = booking.getSpecialRequirements();
        String feeLine = "cancellationFee=" + cancellationFee;
        booking.setSpecialRequirements(existing == null || existing.isBlank() ? feeLine : existing + "\n" + feeLine);

        // If booking was previously confirmed/completed, decrement guide totalBookings best-effort.
        if (booking.getGuide() != null && (prev == Booking.BookingStatus.CONFIRMED || prev == Booking.BookingStatus.COMPLETED)) {
            Guide guide = booking.getGuide();
            int current = guide.getTotalBookings() == null ? 0 : guide.getTotalBookings();
            guide.setTotalBookings(Math.max(0, current - 1));
            guideRepository.save(guide);
        }
        return bookingRepository.save(booking);
    }

    @Override
    public Booking confirmBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);
        tripSessionService.provisionSessionAfterBookingConfirmed(saved.getId());
        return saved;
    }

    @Override
    public List<Booking> getUpcomingBookings() {
        return bookingRepository.findByStatus(Booking.BookingStatus.CONFIRMED);
    }

    @Override
    public List<Booking> getPastBookings() {
        return bookingRepository.findByStatus(Booking.BookingStatus.COMPLETED);
    }

    @Override
    public List<Booking> getUpcomingBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdAndStatus(userId, Booking.BookingStatus.CONFIRMED);
    }

    @Override
    public List<Booking> getUpcomingBookingsByGuide(Long guideId) {
        return bookingRepository.findByGuideIdAndStatus(guideId, Booking.BookingStatus.CONFIRMED);
    }

    @Override
    public List<Booking> getPastBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdAndStatus(userId, Booking.BookingStatus.COMPLETED);
    }

    @Override
    public List<Booking> getPastBookingsByGuide(Long guideId) {
        return bookingRepository.findByGuideIdAndStatus(guideId, Booking.BookingStatus.COMPLETED);
    }
}
