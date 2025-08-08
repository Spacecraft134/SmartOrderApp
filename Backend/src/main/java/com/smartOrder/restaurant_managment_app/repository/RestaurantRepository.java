package com.smartOrder.restaurant_managment_app.repository;

import com.smartOrder.restaurant_managment_app.Models.Restaurant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Integer> {
    boolean existsByCode(String code);
    Optional<Restaurant> findByCode(String code);
}