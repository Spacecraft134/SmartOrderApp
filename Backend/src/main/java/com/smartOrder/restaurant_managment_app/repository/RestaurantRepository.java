package com.smartOrder.restaurant_managment_app.repository;

import com.smartOrder.restaurant_managment_app.Models.Restaurant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for managing Restaurant entities.
 * Provides methods for restaurant code verification and lookup.
 */
@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Integer> {
    
    /**
     * Checks if a restaurant exists with the given code.
     * @param code The restaurant code to check
     * @return true if a restaurant with the code exists, false otherwise
     */
    boolean existsByCode(String code);
    
    /**
     * Finds a restaurant by its code.
     * @param code The restaurant code to search for
     * @return Optional containing the Restaurant if found
     */
    Optional<Restaurant> findByCode(String code);
}