package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.UserService;

@RestController
@RequestMapping("/api/employee")
public class EmployeeAuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JWTService jwtService;
    
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Users user) {
        try {
            // Authenticate credentials
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );
            
            // Get user details
            Users authenticatedUser = userService.findByUsername(user.getUsername());
            
            // Verify role is either WAITER or KITCHEN
            if (authenticatedUser.getRole() != Users.Role.WAITER && 
                authenticatedUser.getRole() != Users.Role.KITCHEN) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Only employee accounts can log in here");
            }
            
            // Create UserDetails object for token generation
            UserDetails userDetails = User.withUsername(authenticatedUser.getUsername())
                .password("") // Password not needed for token generation
                .roles(authenticatedUser.getRole().name())
                .build();
            
            // Generate token using the existing method
            String token = jwtService.generateToken(userDetails);
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", authenticatedUser.getUsername(),
                "role", authenticatedUser.getRole().name(),
                "name", authenticatedUser.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Login failed: Invalid credentials");
        }
    }
}