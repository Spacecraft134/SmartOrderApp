package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.Models.Users;

public interface MenuItemRepository extends JpaRepository<MenuItems, Long> {
  
  List<MenuItems> findByCategory(String category);
  List<MenuItems> findByAdmin(Users admin);
  List<MenuItems> findByAdminAndCategory(Users admin, String category);
  Optional<MenuItems> findByIdAndAdmin(Long id, Users admin);
}
