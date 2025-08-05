package com.smartOrder.restaurant_managment_app.services;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
@Service
public class UserService {
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    AuthenticationManager authManager;
    
    @Autowired 
    private JWTService jwtService;
    
    public Users register(Users user) {
        if (userRepo.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("Username already exists");
        }
        if(user.getRole() == null) {
            user.setRole(Users.Role.GUEST);
        }
        return userRepo.save(user);
    }
    
    public Map<String, String> verify(Users user) {
      try {
          Authentication authentication = authManager.authenticate(
              new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
          
          UserDetails userDetails = (UserDetails) authentication.getPrincipal();
          String token = jwtService.generateToken(userDetails);
          String role = userDetails.getAuthorities().iterator().next().getAuthority();
          
          Map<String, String> response = new HashMap<>();
          response.put("token", token);
          response.put("role", role.replace("ROLE_", ""));
          response.put("username", userDetails.getUsername());
          
          return response;
      } catch (BadCredentialsException e) {
          throw new RuntimeException("Invalid username or password");
      }
  }
}