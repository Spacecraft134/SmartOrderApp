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
import org.springframework.transaction.annotation.Transactional;
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
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private EmailService emailService;

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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        try {
            Users user = userRepo.findByUsername(email);
            if (user == null) {
                // Return success even if email doesn't exist (security best practice)
                return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "message", "If the email exists, a reset link has been sent"
                ));
            }

            // Generate reset token (valid for 1 hour)
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepo.save(user);

            // Send email with reset link
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
            // Log the actual error for debugging but don't expose it to client
            System.err.println("Password reset error: " + e.getMessage());
            e.printStackTrace();
            
            // Return a generic success message to prevent email enumeration
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "If the email exists, a reset link has been sent"
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        try {
            Users user = userRepo.findByResetToken(token);
            
            // Check if token exists and is not expired
            if (user == null || user.getResetTokenExpiry() == null || 
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired token"
                ));
            }

            // Update password and clear token
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepo.save(user);

            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Password updated successfully"
            ));
            
        } catch (Exception e) {
            System.err.println("Reset password error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "An error occurred while resetting password"
            ));
        }
    }
    
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
            System.err.println("Token validation error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("valid", false, "message", "Error validating token")
            );
        }
    }
    
 
    
}