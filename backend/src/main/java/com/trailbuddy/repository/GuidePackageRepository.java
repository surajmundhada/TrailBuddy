package com.trailbuddy.repository;

import com.trailbuddy.entity.GuidePackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuidePackageRepository extends JpaRepository<GuidePackage, Long> {
    List<GuidePackage> findAllByOrderByCreatedAtDesc();
    List<GuidePackage> findByGuide_IdOrderByCreatedAtDesc(Long guideId);

    Optional<GuidePackage> findFirstByGuide_IdAndTitle(Long guideId, String title);

    Optional<GuidePackage> findByIdAndGuide_Id(Long id, Long guideId);
}
