package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.Models.Users;

/**
 * Repository interface for managing MenuItems entities.
 * Provides custom query methods for menu items by various criteria.
 */
public interface MenuItemRepository extends JpaRepository<MenuItems, Long> {
  
  /**
   * Finds all menu items by category.
   * @param category The category to search for
   * @return List of MenuItems in the specified category
   */
  List<MenuItems> findByCategory(String category);
  
  /**
   * Finds all menu items by admin.
   * @param admin The admin user to filter by
   * @return List of MenuItems belonging to the admin
   */
  List<MenuItems> findByAdmin(Users admin);
  
  /**
   * Finds all menu items by admin and category.
   * @param admin The admin user to filter by
   * @param category The category to search for
   * @return List of MenuItems matching both criteria
   */
  List<MenuItems> findByAdminAndCategory(Users admin, String category);
  
  /**
   * Finds a menu item by ID and admin.
   * @param id The ID of the menu item
   * @param admin The admin user to filter by
   * @return Optional containing the MenuItem if found
   */
  Optional<MenuItems> findByIdAndAdmin(Long id, Users admin);
}