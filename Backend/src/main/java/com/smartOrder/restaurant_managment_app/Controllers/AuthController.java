package com.smartOrder.restaurant_managment_app.Controllers;

import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.MyUserDetailsService;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final JWTService jwtService;
    private final MyUserDetailsService userDetailsService;

    public AuthController(JWTService jwtService, MyUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("message", "Missing or invalid Authorization header")
            );
        }

        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUserName(token);

            if (username == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid token: username not found")
                );
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.validateToken(token, userDetails)) {
                return ResponseEntity.ok().body(
                    Map.of("message", "Token is valid", "username", username)
                );
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid token")
                );
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("message", "Error validating token: " + e.getMessage())
            );
        }
    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from header
            String token = authHeader.substring(7);
            String username = jwtService.extractUserName(token);
            
            // Load user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            // Return user information
            return ResponseEntity.ok().body(Map.of(
                "username", username,
                "roles", userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList())
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of("message", "Failed to fetch user details: " + e.getMessage())
            );
        }
    }
}