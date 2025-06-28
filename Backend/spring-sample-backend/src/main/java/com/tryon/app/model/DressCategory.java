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
 * Entity representing a dress category
 */
@Entity
@Table(name = "dress_categories", schema = "wardrobe")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DressCategory {  // Note: Changed to public
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "category_description", columnDefinition = "TEXT")
    private String categoryDescription;

    @ElementCollection
    @CollectionTable(name = "category_style_tags", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "tag")
    private List<String> styleTags;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Dress> dresses;
}