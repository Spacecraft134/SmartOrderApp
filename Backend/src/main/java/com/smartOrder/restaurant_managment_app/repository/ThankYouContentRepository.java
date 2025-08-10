package com.smartOrder.restaurant_managment_app.repository;

import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThankYouContentRepository extends JpaRepository<ThankYouContent, Long> {
    ThankYouContent findByRestaurantId(Long restaurantId);
}