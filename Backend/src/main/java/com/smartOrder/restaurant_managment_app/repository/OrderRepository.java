package com.smartOrder.restaurant_managment_app.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.smartOrder.restaurant_managment_app.Models.Order;

/**
 * Repository interface for managing Order entities.
 * Provides custom query methods for orders by various criteria.
 */
public interface OrderRepository extends JpaRepository<Order, Long> {
  
  /**
   * Finds all orders not in the specified status, ordered by time ascending.
   * @param status The status to exclude
   * @return List of Order entities
   */
  List<Order> findByStatusOfOrderNotOrderByTimeAsc(String status);

  /**
   * Finds all orders by table number, ordered by time descending.
   * @param tableNumber The table number to filter by
   * @return List of Order entities
   */
  List<Order> findByTableNumberOrderByTimeDesc(String tableNumber);
  
  /**
   * Finds all orders by status.
   * @param statusOfOrder The status to filter by
   * @return List of Order entities
   */
  List<Order> findByStatusOfOrder(String statusOfOrder);

  /**
   * Finds all orders between two dates.
   * @param start The start date
   * @param end The end date
   * @return List of Order entities within the date range
   */
  List<Order> findByTimeBetween(LocalDateTime start, LocalDateTime end);
  
  /**
   * Counts orders by status.
   * @param status The status to count
   * @return Number of orders with the specified status
   */
  long countByStatusOfOrder(String status);
}