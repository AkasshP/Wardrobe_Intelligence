package com.tryon.app.repository;

import com.tryon.app.model.Dress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repository for Dress entity
 */
@Repository
public interface DressRepository extends JpaRepository<Dress, Integer> {

    /**
     * Find all available dresses with high sexiness score
     */
    @Query("SELECT d FROM Dress d WHERE d.sexinessScore >= :minScore " +
            "AND d.availabilityStatus = 'available' " +
            "ORDER BY d.sexinessScore DESC, d.avgRating DESC")
    List<Dress> findHotAndSexyDresses(@Param("minScore") Integer minScore);

    /**
     * Find dresses by body type recommendation
     */
    @Query("SELECT d FROM Dress d JOIN d.bodyTypeRecommendations btr " +
            "WHERE btr = :bodyType AND d.availabilityStatus = 'available' " +
            "ORDER BY d.sexinessScore DESC")
    List<Dress> findByBodyTypeRecommendation(@Param("bodyType") String bodyType);

    /**
     * Find dresses by skin tone compatibility
     */
    @Query("SELECT d FROM Dress d JOIN d.skinToneCompatibility stc " +
            "WHERE stc = :skinTone AND d.availabilityStatus = 'available'")
    List<Dress> findBySkinToneCompatibility(@Param("skinTone") String skinTone);

    /**
     * Find dresses that fit specific measurements
     */
    @Query("SELECT d FROM Dress d WHERE " +
            "d.bustMin <= :bust AND d.bustMax >= :bust AND " +
            "d.waistMin <= :waist AND d.waistMax >= :waist AND " +
            "d.hipMin <= :hips AND d.hipMax >= :hips AND " +
            "d.availabilityStatus = 'available'")
    List<Dress> findDressesByMeasurements(
            @Param("bust") BigDecimal bust,
            @Param("waist") BigDecimal waist,
            @Param("hips") BigDecimal hips);

    /**
     * Find dresses by style and body type
     */
    @Query("SELECT d FROM Dress d JOIN d.bodyTypeRecommendations btr " +
            "WHERE d.dressStyle = :style AND btr = :bodyType " +
            "AND d.availabilityStatus = 'available' " +
            "ORDER BY d.sexinessScore DESC")
    List<Dress> findByStyleAndBodyType(
            @Param("style") String style,
            @Param("bodyType") String bodyType);

    /**
     * Find dresses by price range
     */
    List<Dress> findByPriceBetweenAndAvailabilityStatus(
            BigDecimal minPrice, BigDecimal maxPrice, String status);

    /**
     * Find dresses by brand
     */
    List<Dress> findByBrandIdAndAvailabilityStatus(Integer brandId, String status);

    /**
     * Find dresses by category
     */
    List<Dress> findByCategoryIdAndAvailabilityStatus(Integer categoryId, String status);

    /**
     * Find dresses by occasion
     */
    @Query("SELECT d FROM Dress d JOIN d.occasions o " +
            "WHERE o = :occasion AND d.availabilityStatus = 'available'")
    List<Dress> findByOccasion(@Param("occasion") String occasion);

    /**
     * Find dresses with specific hotness tags
     */
    @Query("SELECT d FROM Dress d JOIN d.hotnessTags ht " +
            "WHERE ht IN :tags AND d.availabilityStatus = 'available' " +
            "GROUP BY d HAVING COUNT(DISTINCT ht) = :tagCount")
    List<Dress> findByHotnessTags(
            @Param("tags") List<String> tags,
            @Param("tagCount") long tagCount);

    /**
     * Update view count
     */
    @Query("UPDATE Dress d SET d.viewCount = d.viewCount + 1 WHERE d.dressId = :dressId")
    void incrementViewCount(@Param("dressId") Integer dressId);

    /**
     * Update recommendation count
     */
    @Query("UPDATE Dress d SET d.recommendationCount = d.recommendationCount + 1 WHERE d.dressId = :dressId")
    void incrementRecommendationCount(@Param("dressId") Integer dressId);

    /**
     * Find top rated dresses
     */
    List<Dress> findTop10ByAvailabilityStatusOrderByAvgRatingDesc(String status);
}