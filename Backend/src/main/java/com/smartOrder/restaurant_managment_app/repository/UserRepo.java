package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.Models.Users.Role;

/**
 * Repository interface for managing Users entities.
 * Provides methods for user management and authentication.
 */
@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {
  
  /**
   * Finds a user by username.
   * @param username The username to search for
   * @return The matching Users entity
   */
  Users findByUsername(String username);
  
  /**
   * Checks if a username exists.
   * @param username The username to check
   * @return true if the username exists, false otherwise
   */
  boolean existsByUsername(String username);
  
  /**
   * Finds all users by restaurant ID.
   * @param restaurantId The restaurant ID to filter by
   * @return List of Users entities
   */
  List<Users> findByRestaurantId(Integer restaurantId);
  
  /**
   * Finds all users by restaurant ID and role.
   * @param restaurantId The restaurant ID to filter by
   * @param role The role to filter by
   * @return List of Users entities
   */
  List<Users> findByRestaurantIdAndRole(Integer restaurantId, Users.Role role);
  
  /**
   * Checks if a user exists with the given restaurant ID and role.
   * @param restaurantId The restaurant ID to check
   * @param role The role to check
   * @return true if a matching user exists, false otherwise
   */
  boolean existsByRestaurantIdAndRole(Long restaurantId, Users.Role role);
  
  /**
   * Checks if a user exists with the given ID.
   * @param id The user ID to check
   * @return true if the user exists, false otherwise
   */
  boolean existsById(Integer id);
  
  /**
   * Deletes a user by ID.
   * @param id The ID of the user to delete
   */
  void deleteById(Integer id);
  
  /**
   * Finds a user by reset token.
   * @param resetToken The reset token to search for
   * @return The matching Users entity
   */
  Users findByResetToken(String resetToken);
  
  /**
   * Checks if any user exists with the given role.
   * @param role The role to check
   * @return true if at least one user has the role, false otherwise
   */
  boolean existsByRole(Role role);
}