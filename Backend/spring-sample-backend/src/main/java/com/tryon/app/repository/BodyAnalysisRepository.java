package com.tryon.app.repository;
import com.tryon.app.model.BodyAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BodyAnalysisRepository extends JpaRepository<BodyAnalysis, Long> {

    Optional<BodyAnalysis> findByAnalysisId(String analysisId);

    List<BodyAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BodyAnalysis> findByStatus(String status);

    List<BodyAnalysis> findByUserIdAndStatus(Long userId, String status);

}
