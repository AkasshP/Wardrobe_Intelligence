package com.tryon.app.model;



import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing a dress brand
 */
@Entity
@Table(name = "dress_brands", schema = "wardrobe")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DressBrand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "brand_name", nullable = false, length = 100)
    private String brandName;

    @Column(name = "brand_description", columnDefinition = "TEXT")
    private String brandDescription;

    @Column(name = "price_range", length = 50)
    private String priceRange; // budget, mid-range, luxury

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "brand", fetch = FetchType.LAZY)
    private List<Dress> dresses;
}