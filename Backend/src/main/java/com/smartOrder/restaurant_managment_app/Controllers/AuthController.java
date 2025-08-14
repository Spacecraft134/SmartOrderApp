package com.smartOrder.restaurant_managment_app.Controllers;

import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.Models.Users.Role;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
import com.smartOrder.restaurant_managment_app.services.EmailService;
import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.MyUserDetailsService;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication-related operations.
 * Handles JWT token validation, user information retrieval, 
 * and password reset functionality.
 * 
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final JWTService jwtService;
    private final MyUserDetailsService userDetailsService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private EmailService emailService;

    /**
     * Constructs AuthController with required dependencies.
     *
     * @param jwtService the JWT service for token operations
     * @param userDetailsService the user details service for authentication
     */
    public AuthController(JWTService jwtService, MyUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Validates a JWT token from the Authorization header.
     *
     * @param authHeader the Authorization header containing the Bearer token
     * @return ResponseEntity with validation result and user information
     */
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
    
    /**
     * Retrieves information about the currently authenticated user.
     *
     * @param authHeader the Authorization header containing the Bearer token
     * @return ResponseEntity with current user's username and roles
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUserName(token);
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
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
    
    /**
     * Checks if an admin user exists in the system.
     *
     * @return ResponseEntity indicating whether an admin exists
     */
    @GetMapping("/check-admin-exists")
    public ResponseEntity<?> checkAdminExists() {
        try {
            boolean adminExists = userRepo.existsByRole(Role.ADMIN);
            
            return ResponseEntity.ok().body(
                Map.of("exists", adminExists)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("message", "Error checking admin existence")
            );
        }
    }

    /**
     * Initiates a password reset request for a user.
     * Sends a reset email if the user exists, but always returns success
     * to prevent email enumeration attacks.
     *
     * @param request Map containing the email address
     * @return ResponseEntity with success message regardless of email existence
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        try {
            Users user = userRepo.findByUsername(email);
            if (user == null) {
                return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "message", "If the email exists, a reset link has been sent"
                ));
            }

            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepo.save(user);

            String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
            emailService.sendSimpleMessage(
                email,
                "DineFlow: Password Reset Request",
                "Click this link to reset your password: " + resetUrl + 
                "\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email."
            );

            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "If the email exists, a reset link has been sent"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "If the email exists, a reset link has been sent"
            ));
        }
    }

    /**
     * Resets a user's password using a valid reset token.
     *
     * @param request Map containing the reset token and new password
     * @return ResponseEntity indicating success or failure of password reset
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        try {
            Users user = userRepo.findByResetToken(token);
            
            if (user == null || user.getResetTokenExpiry() == null || 
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired token"
                ));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepo.save(user);

            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Password updated successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "An error occurred while resetting password"
            ));
        }
    }
    
    /**
     * Validates a password reset token to check if it's still valid.
     *
     * @param token the reset token to validate
     * @return ResponseEntity indicating whether the token is valid
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        try {
            Users user = userRepo.findByResetToken(token);
            
            if (user == null || user.getResetTokenExpiry() == null || 
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    Map.of("valid", false, "message", "Invalid or expired token")
                );
            }
            
            return ResponseEntity.ok().body(
                Map.of("valid", true, "message", "Token is valid")
            );
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("valid", false, "message", "Error validating token")
            );
        }
    }
}