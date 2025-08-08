package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.Restaurant;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.repository.RestaurantRepository;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
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
    
    @Autowired
    private RestaurantRepository restaurantRepository;
    
    @Autowired 
    private UserRepo userRepo;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
   
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

    @PostMapping("/register-admin/{restaurantCode}")
    public ResponseEntity<?> registerAdmin(
        @PathVariable String restaurantCode,
        @RequestBody Users user) {
        
        try {
            // 1. Check if restaurant exists, if not create it with the provided name
            Restaurant restaurant = restaurantRepository.findByCode(restaurantCode)
                .orElseGet(() -> {
                    Restaurant newRestaurant = new Restaurant();
                    // Use the restaurantName from the request instead of generating one
                    newRestaurant.setName(user.getRestaurantName()); 
                    newRestaurant.setCode(restaurantCode);
                    return restaurantRepository.save(newRestaurant);
                });

            // 2. Check if admin already exists
            if (userRepo.existsByRestaurantIdAndRole(restaurant.getId(), Users.Role.ADMIN)) {
                return ResponseEntity.badRequest().body("Restaurant already has an admin");
            }

            // 3. Create admin user
            user.setRestaurantId(restaurant.getId());
            user.setRole(Users.Role.ADMIN);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setActive(true);
            
            Users savedUser = userRepo.save(user);
            
            // Return token and user data
            String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(user.getUsername())
            );
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", savedUser,
                "restaurantName", restaurant.getName() // Include the actual restaurant name
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Registration failed: " + e.getMessage())
            );
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
                "name", authenticatedUser.getName(),
                "restaurantId", authenticatedUser.getRestaurantId()
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
 // Get all users for a specific restaurant (admin only)
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getUsersByRestaurant(@PathVariable Integer restaurantId) {
        try {
            // Verify restaurant exists
            if (!restaurantRepository.existsById(restaurantId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Restaurant not found");
            }
            
            List<Users> users = userService.getUsersByRestaurantId(restaurantId);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching users: " + e.getMessage());
        }
    }

    // Get admin for a specific restaurant
    @GetMapping("/restaurant/{restaurantId}/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAdminForRestaurant(@PathVariable Integer restaurantId) {
        try {
            Users admin = userService.getAdminByRestaurantId(restaurantId);
            if (admin == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No admin found for this restaurant");
            }
            return ResponseEntity.ok(admin);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching admin: " + e.getMessage());
        }
    }

    // Get all waiters for a specific restaurant
    @GetMapping("/restaurant/{restaurantId}/waiters")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'WAITER')")
    public ResponseEntity<?> getWaitersByRestaurant(@PathVariable Integer restaurantId) {
        try {
            List<Users> waiters = userService.getWaitersByRestaurantId(restaurantId);
            return ResponseEntity.ok(waiters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching waiters: " + e.getMessage());
        }
    }

    // Get all kitchen staff for a specific restaurant
    @GetMapping("/restaurant/{restaurantId}/kitchen")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'KITCHEN')")
    public ResponseEntity<?> getKitchenStaffByRestaurant(@PathVariable Integer restaurantId) {
        try {
            List<Users> kitchenStaff = userService.getKitchenStaffByRestaurantId(restaurantId);
            return ResponseEntity.ok(kitchenStaff);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching kitchen staff: " + e.getMessage());
        }
    }

    @PostMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createUserForRestaurant(
            @PathVariable Integer restaurantId,
            @RequestBody Users user) {
        try {
            // Verify restaurant exists
            if (!restaurantRepository.existsById(restaurantId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Restaurant not found");
            }
            
            // Set required fields
            user.setRestaurantId(restaurantId);
            user.setActive(true);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            
            // Only allow creating WAITER or KITCHEN roles
            if (user.getRole() == Users.Role.ADMIN) {
                return ResponseEntity.badRequest()
                    .body("Cannot create admin accounts through this endpoint");
            }
            
            Users createdUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Error creating user: " + e.getMessage());
        }
    }
    
    @PatchMapping("/api/users/{userId}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Integer userId,
            @RequestBody Map<String, Boolean> request) {
      Users userToUpdate = userRepo.findById(userId)
          .orElseThrow(() -> new RuntimeException("User not found"));
      
      // Prevent deactivating admin accounts
      if (userToUpdate.getRole() == Users.Role.ADMIN) {
          return ResponseEntity.badRequest()
              .body("Admin accounts cannot be deactivated");
      }
        try {
            boolean active = request.get("active");
            Users updatedUser = userService.toggleUserStatus(userId, active);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Error updating user status: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable int userId) {
        try {
            // Check if user exists
            if (!userRepo.existsById(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            // Prevent deleting yourself
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();
            Users currentUser = userService.findByUsername(currentUsername);
            
            if (currentUser != null && currentUser.getId() == userId) {
                return ResponseEntity.badRequest()
                    .body("You cannot delete your own account");
            }
            
            userService.deleteUser(userId);
            return ResponseEntity.ok("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting user: " + e.getMessage());
        }
    }
    
 
}