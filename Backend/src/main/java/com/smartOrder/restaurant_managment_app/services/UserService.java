package com.smartOrder.restaurant_managment_app.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;

@Service
public class UserService {
  @Autowired
  private UserRepo userRepo;
  
  @Autowired
  AuthenticationManager authManager;
  
  public Users register(Users user) {
    return userRepo.save(user);
  }

  public String verify(Users user) {
    Authentication authentication = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
    
    if(authentication.isAuthenticated()) {
      return generateToken();
    }
    return "fail";
  }

}
