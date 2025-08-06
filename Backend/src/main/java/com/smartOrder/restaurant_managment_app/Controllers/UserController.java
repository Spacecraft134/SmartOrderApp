package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.MyUserDetailsService;
import com.smartOrder.restaurant_managment_app.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class UserController {
  
    @Autowired
    private UserService userService;
    
    @Autowired
    private JWTService jwtService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private MyUserDetailsService userDetailsService;
    
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Users user) {
        try {
            user.setPassword(encoder.encode(user.getPassword()));
            if (user.getRole() == null) {
                user.setRole(Users.Role.GUEST); // Set default role
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
            user.setRole(Users.Role.ADMIN); // Explicitly set ADMIN role
            Users savedUser = userService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Admin registration failed: " + e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Users user) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );
            
            Users authenticatedUser = userService.findByUsername(user.getUsername());
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtService.generateToken(userDetails);
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", authenticatedUser.getUsername(),
                "role", authenticatedUser.getRole().name(),
                "name", authenticatedUser.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("message", "Login failed: " + e.getMessage())
            );
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                new SecurityContextLogoutHandler().logout(request, response, auth);
            }
            return ResponseEntity.ok().body(Map.of(
                "message", "Logout successful"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("message", "Logout failed: " + e.getMessage())
            );
        }
    }
}