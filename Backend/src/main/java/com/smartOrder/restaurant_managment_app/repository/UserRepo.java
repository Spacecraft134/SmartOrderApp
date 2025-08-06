package com.smartOrder.restaurant_managment_app.repository;


import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.Models.Users;

@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {
  Users findByUsername(String username);
  
}
