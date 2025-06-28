package com.tryon.app.repository;

import com.tryon.app.model.DressCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for DressCategory entity
 */
@Repository
public interface DressCategoryRepository extends JpaRepository<DressCategory, Integer> {

    /**
     * Find category by name
     */
    DressCategory findByCategoryName(String categoryName);

    /**
     * Find categories by style tag
     */
    @Query("SELECT dc FROM DressCategory dc JOIN dc.styleTags st WHERE st = :tag")
    List<DressCategory> findByStyleTag(@Param("tag") String tag);

    /**
     * Find all categories ordered by name
     */
    List<DressCategory> findAllByOrderByCategoryNameAsc();
}