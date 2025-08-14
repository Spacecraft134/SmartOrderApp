package com.smartOrder.restaurant_managment_app.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.Stats;

/**
 * Repository interface for managing Stats entities.
 * Provides methods for statistical data retrieval.
 */
public interface StatsSummaryRepository extends JpaRepository<Stats, Long> {
  
  /**
   * Finds the first stats entry for a specific date.
   * @param date The date to search for
   * @return Optional containing the Stats entity if found
   */
  Optional<Stats> findFirstByDate(LocalDate date);
}