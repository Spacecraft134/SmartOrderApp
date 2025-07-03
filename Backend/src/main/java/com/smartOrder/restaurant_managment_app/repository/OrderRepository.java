package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
  
  List<Order> findByStatusOfOrderNotOrderByTimeAsc(String status);

}
