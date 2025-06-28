package com.tryon.app.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a dress recommendation for a user based on body analysis
 */
@Entity
@Table(name = "dress_recommendations", schema = "wardrobe")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DressRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recommendation_id")
    private Long recommendationId;

    @Column(name = "analysis_id", nullable = false, length = 255)
    private String analysisId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "dress_id", nullable = false)
    private Integer dressId;

    // Recommendation scoring
    @Column(name = "compatibility_score", precision = 5, scale = 2)
    private BigDecimal compatibilityScore;

    @Column(name = "sexiness_match_score", precision = 5, scale = 2)
    private BigDecimal sexinessMatchScore;

    @Column(name = "fit_score", precision = 5, scale = 2)
    private BigDecimal fitScore;

    @Column(name = "style_score", precision = 5, scale = 2)
    private BigDecimal styleScore;

    // AI reasoning
    @Column(name = "recommendation_reason", columnDefinition = "TEXT")
    private String recommendationReason;

    @Column(name = "fit_analysis", columnDefinition = "TEXT")
    private String fitAnalysis;

    @Column(name = "style_tips", columnDefinition = "TEXT")
    private String styleTips;

    // User interaction
    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "is_viewed")
    private Boolean isViewed = false;

    @Column(name = "is_purchased")
    private Boolean isPurchased = false;

    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "user_feedback", columnDefinition = "TEXT")
    private String userFeedback;

    // Recommendation metadata
    @Column(name = "recommended_by", length = 50)
    private String recommendedBy = "ai-transformer";

    @Column(name = "recommendation_confidence", precision = 5, scale = 2)
    private BigDecimal recommendationConfidence;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Transient fields for dress details (populated from joins)
    @Transient
    private Dress dress;

    // Helper methods
    public boolean isHighlyRecommended() {
        return compatibilityScore != null && compatibilityScore.compareTo(new BigDecimal("80")) >= 0;
    }

    public boolean isPerfectFit() {
        return fitScore != null && fitScore.compareTo(new BigDecimal("90")) >= 0;
    }

    public boolean isSexyMatch() {
        return sexinessMatchScore != null && sexinessMatchScore.compareTo(new BigDecimal("85")) >= 0;
    }
}