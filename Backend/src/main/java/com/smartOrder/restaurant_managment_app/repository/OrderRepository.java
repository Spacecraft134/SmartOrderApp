package com.smartOrder.restaurant_managment_app.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.smartOrder.restaurant_managment_app.Models.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
  
  List<Order> findByStatusOfOrderNotOrderByTimeAsc(String status);

  List<Order> findByTableNumberOrderByTimeDesc(String tableNumber);
  
  List<Order> findByStatusOfOrder(String statusOfOrder);

  List<Order> findByTimeBetween(LocalDateTime start, LocalDateTime end);
  
  


}
