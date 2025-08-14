package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.HelpRequest;

/**
 * Repository interface for managing HelpRequest entities.
 * Provides custom query methods for unresolved help requests.
 */
public interface HelpRequestRepository extends JpaRepository<HelpRequest, Long> {
  
  /**
   * Finds all unresolved help requests ordered by request time in descending order.
   * @return List of unresolved HelpRequest entities
   */
  List<HelpRequest> findByResolvedFalseOrderByRequestTimeDesc();
}