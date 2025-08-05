package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.services.UserService;
@RestController
public class UserController {
  
    @Autowired
    private UserService userService;
    
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Users user) {
        try {
            user.setPassword(encoder.encode(user.getPassword()));
            if(user.getRole() == null) {
                user.setRole(Users.Role.GUEST);
            }
            Users savedUser = userService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }
    
    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody Users user) {
        try {
            user.setPassword(encoder.encode(user.getPassword()));
            user.setRole(Users.Role.ADMIN);
            Users savedUser = userService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Admin registration failed: " + e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Users user) {
        try {
            Map<String, String> response = userService.verify(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("message", "Login failed: " + e.getMessage())
            );
        }
    }
}