package com.smartOrder.restaurant_managment_app.repository;


import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.Models.Users.Role;

@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {
  Users findByUsername(String username);
  boolean existsByUsername(String username);
  List<Users> findByRestaurantId(Integer restaurantId);
  List<Users> findByRestaurantIdAndRole(Integer restaurantId, Users.Role role);
  boolean existsByRestaurantIdAndRole(Long restaurantId, Users.Role role);
  boolean existsById(Integer id);
  void deleteById(Integer id);
  Users findByResetToken(String resetToken);
  boolean existsByRole(Role role);
  
}
