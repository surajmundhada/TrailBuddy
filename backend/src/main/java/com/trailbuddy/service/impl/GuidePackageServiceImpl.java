package com.trailbuddy.service.impl;

import com.trailbuddy.dto.GuidePackagePayload;
import com.trailbuddy.entity.Guide;
import com.trailbuddy.entity.GuidePackage;
import com.trailbuddy.entity.User;
import com.trailbuddy.repository.GuidePackageRepository;
import com.trailbuddy.repository.GuideRepository;
import com.trailbuddy.service.GuidePackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class GuidePackageServiceImpl implements GuidePackageService {

    @Autowired
    private GuidePackageRepository guidePackageRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Override
    @Transactional
    public Map<String, Object> createPackage(GuidePackagePayload payload, User user) {
        Guide guide = guideRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Guide profile not found"));

        GuidePackage guidePackage = new GuidePackage();
        guidePackage.setGuide(guide);
        guidePackage.setTitle(payload.getTitle());
        guidePackage.setDescription(payload.getDescription());
        guidePackage.setCity(payload.getCity() != null && !payload.getCity().isBlank() ? payload.getCity() : guide.getCity());
        guidePackage.setDuration(payload.getDuration());
        guidePackage.setPrice(payload.getPrice());
        guidePackage.setFamousSpots(cleanList(payload.getFamousSpots()));
        guidePackage.setHiddenSpots(cleanList(payload.getHiddenSpots()));
        guidePackage.setFoodPlaces(cleanList(payload.getFoodPlaces()));
        if (payload.getMeetingPoint() != null && !payload.getMeetingPoint().isBlank()) {
            guidePackage.setMeetingPoint(payload.getMeetingPoint().trim());
        }
        guidePackage.setMaxGuests(payload.getMaxGuests());
        if (payload.getHostIntro() != null && !payload.getHostIntro().isBlank()) {
            guidePackage.setHostIntro(payload.getHostIntro().trim());
        }
        guidePackage.setLanguages(cleanList(payload.getLanguages()));
        guidePackage.setWhatsIncluded(cleanList(payload.getWhatsIncluded()));
        return mapPackage(guidePackageRepository.save(guidePackage));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPackages() {
        // Must run inside a transaction: mapPackage touches lazy Guide (and User via getFullName).
        return guidePackageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapPackage)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPackageById(Long packageId) {
        if (packageId == null) {
            throw new RuntimeException("packageId is required");
        }
        GuidePackage guidePackage = guidePackageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        return mapPackage(guidePackage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPackagesForGuide(Long guideId) {
        if (guideId == null) {
            throw new RuntimeException("guideId is required");
        }
        guideRepository.findById(guideId).orElseThrow(() -> new RuntimeException("Guide not found"));
        return guidePackageRepository.findByGuide_IdOrderByCreatedAtDesc(guideId).stream()
                .map(this::mapPackage)
                .toList();
    }

    private List<String> cleanList(List<String> values) {
        if (values == null) return List.of();
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .limit(8)
                .toList();
    }

    private Map<String, Object> mapPackage(GuidePackage guidePackage) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", guidePackage.getId());
        response.put("guideId", guidePackage.getGuide().getId());
        response.put("guideName", guidePackage.getGuide().getFullName());
        response.put("guideImageUrl", guidePackage.getGuide().getProfileImageUrl());
        response.put("city", guidePackage.getCity());
        response.put("title", guidePackage.getTitle());
        response.put("description", guidePackage.getDescription());
        response.put("duration", guidePackage.getDuration());
        response.put("price", guidePackage.getPrice());
        response.put("famousSpots", guidePackage.getFamousSpots());
        response.put("hiddenSpots", guidePackage.getHiddenSpots());
        response.put("foodPlaces", guidePackage.getFoodPlaces());
        response.put("meetingPoint", guidePackage.getMeetingPoint());
        response.put("maxGuests", guidePackage.getMaxGuests());
        response.put("hostIntro", guidePackage.getHostIntro());
        response.put("languages", guidePackage.getLanguages());
        response.put("whatsIncluded", guidePackage.getWhatsIncluded());
        return response;
    }
}
