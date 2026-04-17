package com.trailbuddy.service;

import com.trailbuddy.dto.GuidePackagePayload;
import com.trailbuddy.entity.User;

import java.util.List;
import java.util.Map;

public interface GuidePackageService {
    Map<String, Object> createPackage(GuidePackagePayload payload, User user);
    List<Map<String, Object>> getPackages();

    /** Public catalog for a single guide (booking / quote flow). */
    List<Map<String, Object>> getPackagesForGuide(Long guideId);

    /** Single listing for booking deep-link (Hidden Gems → checkout). */
    Map<String, Object> getPackageById(Long packageId);
}
