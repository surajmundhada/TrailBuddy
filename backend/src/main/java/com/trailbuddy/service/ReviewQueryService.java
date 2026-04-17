package com.trailbuddy.service;

import com.trailbuddy.entity.User;

import java.util.List;
import java.util.Map;

public interface ReviewQueryService {

    List<Map<String, Object>> getReviewsForCurrentUser(User user);

    List<Map<String, Object>> getPublicReviewsForGuide(Long guideId);
}
