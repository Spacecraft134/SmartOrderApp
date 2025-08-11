package com.smartOrder.restaurant_managment_app.repository;

import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ThankYouContentRepository extends JpaRepository<ThankYouContent, Long> {
   
  Optional<ThankYouContent> findFirstByRestaurantIdOrderByIdDesc(Long restaurantId);
}