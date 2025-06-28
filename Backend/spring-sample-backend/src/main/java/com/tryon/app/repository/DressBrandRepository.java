package com.tryon.app.repository;

import com.tryon.app.model.DressBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for DressBrand entity
 */
@Repository
public interface DressBrandRepository extends JpaRepository<DressBrand, Integer> {

    /**
     * Find brand by name
     */
    DressBrand findByBrandName(String brandName);

    /**
     * Find brands by price range
     */
    List<DressBrand> findByPriceRange(String priceRange);

    /**
     * Find all brands ordered by name
     */
    List<DressBrand> findAllByOrderByBrandNameAsc();
}