package com.trailbuddy.service.impl;

import com.trailbuddy.entity.Review;
import com.trailbuddy.repository.ReviewRepository;
import com.trailbuddy.entity.User;
import com.trailbuddy.service.ReviewQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewQueryServiceImpl implements ReviewQueryService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReviewsForCurrentUser(User user) {
        return reviewRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPublicReviewsForGuide(Long guideId) {
        return reviewRepository.findByGuide_IdOrderByCreatedAtDesc(guideId).stream()
                .map(this::toSummary)
                .toList();
    }

    private Map<String, Object> toSummary(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("rating", r.getRating());
        m.put("reviewText", r.getReviewText());
        m.put("isPublic", r.getIsPublic());
        m.put("helpfulCount", r.getHelpfulCount());
        m.put("createdAt", r.getCreatedAt());
        m.put("updatedAt", r.getUpdatedAt());
        if (r.getGuide() != null) {
            m.put("guideId", r.getGuide().getId());
            m.put("guideName", r.getGuide().getFullName());
        }
        if (r.getBooking() != null) {
            m.put("bookingId", r.getBooking().getId());
        }
        return m;
    }
}
