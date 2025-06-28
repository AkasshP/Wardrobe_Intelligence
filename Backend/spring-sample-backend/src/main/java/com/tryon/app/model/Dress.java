package com.tryon.app.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing a dress in the wardrobe catalog
 */
@Entity
@Table(name = "dresses", schema = "wardrobe")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dress_id")
    private Integer dressId;

    @Column(name = "dress_name", nullable = false, length = 255)
    private String dressName;

    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "category_id")
    private Integer categoryId;

    // Physical measurements (in inches)
    @Column(name = "bust_min", precision = 5, scale = 2)
    private BigDecimal bustMin;

    @Column(name = "bust_max", precision = 5, scale = 2)
    private BigDecimal bustMax;

    @Column(name = "waist_min", precision = 5, scale = 2)
    private BigDecimal waistMin;

    @Column(name = "waist_max", precision = 5, scale = 2)
    private BigDecimal waistMax;

    @Column(name = "hip_min", precision = 5, scale = 2)
    private BigDecimal hipMin;

    @Column(name = "hip_max", precision = 5, scale = 2)
    private BigDecimal hipMax;

    @Column(name = "length", precision = 5, scale = 2)
    private BigDecimal length;

    // Size information
    @ElementCollection
    @CollectionTable(name = "dress_sizes", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "size")
    private List<String> availableSizes;

    @Column(name = "size_chart", columnDefinition = "jsonb")
    @Convert(converter = com.tryon.app.model.JsonbConverter.class)
    private String sizeChart;

    // Style attributes
    @Column(name = "dress_style", length = 100)
    private String dressStyle;

    @Column(name = "neckline", length = 100)
    private String neckline;

    @Column(name = "sleeve_type", length = 100)
    private String sleeveType;

    @Column(name = "dress_length", length = 50)
    private String dressLength;

    @ElementCollection
    @CollectionTable(name = "dress_occasions", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "occasion")
    private List<String> occasions;

    // Colors and patterns
    @Column(name = "primary_color", length = 50)
    private String primaryColor;

    @ElementCollection
    @CollectionTable(name = "dress_secondary_colors", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "color")
    private List<String> secondaryColors;

    @Column(name = "pattern_type", length = 50)
    private String patternType;

    // Hotness/Sexiness factors
    @Column(name = "sexiness_score")
    private Integer sexinessScore;

    @ElementCollection
    @CollectionTable(name = "dress_hotness_tags", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "tag")
    private List<String> hotnessTags;

    @ElementCollection
    @CollectionTable(name = "dress_body_type_recommendations", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "body_type")
    private List<String> bodyTypeRecommendations;

    // Skin tone compatibility
    @ElementCollection
    @CollectionTable(name = "dress_skin_tone_compatibility", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "skin_tone")
    private List<String> skinToneCompatibility;

    // Commercial information
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "currency", length = 3)
    private String currency = "USD";

    @Column(name = "availability_status", length = 50)
    private String availabilityStatus = "available";

    // Images and media
    @Column(name = "primary_image_url", nullable = false, length = 500)
    private String primaryImageUrl;

    @ElementCollection
    @CollectionTable(name = "dress_additional_images", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "image_url")
    private List<String> additionalImages;

    @ElementCollection
    @CollectionTable(name = "dress_model_images", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "model_image_url")
    private List<String> modelImages;

    // GCP Storage paths
    @Column(name = "gcp_bucket_path", length = 500)
    private String gcpBucketPath;

    @Column(name = "image_folder_path", length = 500)
    private String imageFolderPath;

    // SEO and discovery
    @ElementCollection
    @CollectionTable(name = "dress_keywords", joinColumns = @JoinColumn(name = "dress_id"))
    @Column(name = "keyword")
    private List<String> keywords;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "fabric_type", length = 100)
    private String fabricType;

    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;

    // Analytics
    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "recommendation_count")
    private Integer recommendationCount = 0;

    @Column(name = "purchase_count")
    private Integer purchaseCount = 0;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating;

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", insertable = false, updatable = false)
    private DressBrand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private DressCategory category;

    // Helper methods
    public boolean isHotAndSexy() {
        return sexinessScore != null && sexinessScore >= 7;
    }

    public boolean isInStock() {
        return "available".equalsIgnoreCase(availabilityStatus);
    }

    public boolean fitsSize(BigDecimal bust, BigDecimal waist, BigDecimal hips) {
        return bust.compareTo(bustMin) >= 0 && bust.compareTo(bustMax) <= 0 &&
                waist.compareTo(waistMin) >= 0 && waist.compareTo(waistMax) <= 0 &&
                hips.compareTo(hipMin) >= 0 && hips.compareTo(hipMax) <= 0;
    }
}