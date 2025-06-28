package com.tryon.app.repository;

import com.tryon.app.model.DressRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for DressRecommendation entity
 */
@Repository
public interface DressRecommendationRepository extends JpaRepository<DressRecommendation, Long> {

    /**
     * Find all recommendations for a specific analysis
     */
    List<DressRecommendation> findByAnalysisIdOrderByCompatibilityScoreDesc(String analysisId);

    /**
     * Find all recommendations for a specific user
     */
    List<DressRecommendation> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find user's favorite recommendations
     */
    List<DressRecommendation> findByUserIdAndIsFavoriteTrue(Long userId);

    /**
     * Find user's purchased recommendations
     */
    List<DressRecommendation> findByUserIdAndIsPurchasedTrue(Long userId);

    /**
     * Find recommendations by user and minimum compatibility score
     */
    List<DressRecommendation> findByUserIdAndCompatibilityScoreGreaterThanEqualOrderByCompatibilityScoreDesc(
            Long userId, BigDecimal minScore);

    /**
     * Find top recommendations for a user by compatibility score
     */
    @Query("SELECT dr FROM DressRecommendation dr WHERE dr.userId = :userId " +
            "ORDER BY dr.compatibilityScore DESC")
    List<DressRecommendation> findTopRecommendationsForUser(@Param("userId") Long userId);

    /**
     * Find recommendations by analysis ID and minimum scores
     */
    @Query("SELECT dr FROM DressRecommendation dr WHERE dr.analysisId = :analysisId " +
            "AND dr.compatibilityScore >= :minCompatibility " +
            "AND dr.sexinessMatchScore >= :minSexiness " +
            "ORDER BY dr.compatibilityScore DESC")
    List<DressRecommendation> findByAnalysisIdAndMinScores(
            @Param("analysisId") String analysisId,
            @Param("minCompatibility") BigDecimal minCompatibility,
            @Param("minSexiness") BigDecimal minSexiness);

    /**
     * Count user's total recommendations
     */
    Long countByUserId(Long userId);

    /**
     * Count user's favorites
     */
    Long countByUserIdAndIsFavoriteTrue(Long userId);

    /**
     * Count user's purchases
     */
    Long countByUserIdAndIsPurchasedTrue(Long userId);

    /**
     * Find recommendation by analysis ID and dress ID (to avoid duplicates)
     */
    Optional<DressRecommendation> findByAnalysisIdAndDressId(String analysisId, Integer dressId);

    /**
     * Get average compatibility score for a user
     */
    @Query("SELECT AVG(dr.compatibilityScore) FROM DressRecommendation dr WHERE dr.userId = :userId")
    BigDecimal getAverageCompatibilityScoreForUser(@Param("userId") Long userId);

    /**
     * Find recommendations with user ratings
     */
    List<DressRecommendation> findByUserIdAndUserRatingIsNotNull(Long userId);

    /**
     * Delete all recommendations for an analysis
     */
    void deleteByAnalysisId(String analysisId);
}