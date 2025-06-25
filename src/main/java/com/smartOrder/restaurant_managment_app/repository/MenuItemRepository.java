package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;

public interface MenuItemRepository extends JpaRepository<MenuItems, Long> {
  
  List<MenuItems> findByCategory(String category);
}
