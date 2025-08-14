package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.TableSession;

/**
 * Repository interface for managing TableSession entities.
 * Provides methods for table session management and lookup.
 */
public interface TableRepository extends JpaRepository<TableSession, Long> {

  /**
   * Finds a table session by table number.
   * @param tableNumber The table number to search for
   * @return Optional containing the TableSession if found
   */
  Optional<TableSession> findByTableNumber(String tableNumber);
  
  /**
   * Finds all active table sessions.
   * @return List of active TableSession entities
   */
  List<TableSession> findBySessionActiveTrue();
}