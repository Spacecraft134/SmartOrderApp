package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    // =======================
    // Admin registration + restaurant creation
    // =======================
    @PostMapping("/register-admin/{restaurantCode}")
    public ResponseEntity<?> registerAdmin(
        @PathVariable String restaurantCode,
        @RequestBody Users user) {

        try {
            // Check if restaurant exists, or create it
            Restaurant restaurant = restaurantRepository.findByCode(restaurantCode)
                .orElseGet(() -> {
                    Restaurant newRestaurant = new Restaurant();
                    newRestaurant.setName(user.getRestaurantName());
                    newRestaurant.setCode(restaurantCode);
                    return restaurantRepository.save(newRestaurant);
                });

            // Check if admin exists for this restaurant
            if (userRepo.existsByRestaurantIdAndRole(restaurant.getId(), Users.Role.ADMIN)) {
                return ResponseEntity.badRequest().body("Restaurant already has an admin");
            }

            // Create admin user
            user.setRestaurantId(restaurant.getId());
            user.setRole(Users.Role.ADMIN);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setActive(true);

            Users savedUser = userRepo.save(user);

            String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(user.getUsername())
            );

            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", savedUser,
                "restaurantName", restaurant.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Registration failed: " + e.getMessage())
            );
        }
    }

    // =======================
    // Login
    // =======================
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
    
    @PostMapping("/api/employee/login")
    public ResponseEntity<?> employeeLogin(@RequestBody Users user) {
        try {
            // 1. First check if user exists
            Users dbUser = userService.findByUsername(user.getUsername());
            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
            }

            // 2. Check if user is active
            if (!dbUser.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is inactive"));
            }

            // 3. Authenticate
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    user.getUsername(), 
                    user.getPassword()
                )
            );

            // 4. Verify role
            if (dbUser.getRole() != Users.Role.WAITER && 
                dbUser.getRole() != Users.Role.KITCHEN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Unauthorized role"));
            }

            // 5. Generate token
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtService.generateToken(userDetails);

            // 6. Return success response
            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                    "username", dbUser.getUsername(),
                    "role", dbUser.getRole().name(),
                    "name", dbUser.getName(),
                    "restaurantId", dbUser.getRestaurantId()
                )
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }
    



    // =======================
    // Logout
    // =======================
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

    // =======================
    // Get users by restaurant (admin only)
    // =======================
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getUsersByRestaurant(@PathVariable Integer restaurantId) {
        try {
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

    // Get admin for restaurant
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

    // Get waiters for restaurant
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

    // Get kitchen staff for restaurant
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

    @PostMapping("/register-employee")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> registerEmployee(
            @RequestBody Users user,
            Authentication auth) {
        try {
            // Get authenticated admin user
            String adminUsername = auth.getName();
            Users admin = userService.findByUsername(adminUsername);

            if (admin.getRole() != Users.Role.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only admins can create employees."));
            }

            // Set employee's restaurant ID to match admin's restaurant
            user.setRestaurantId(admin.getRestaurantId());

            // Validate role
            if (user.getRole() != Users.Role.WAITER && user.getRole() != Users.Role.KITCHEN) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Role must be WAITER or KITCHEN"));
            }

            user.setActive(true);
            Users savedEmployee = userService.createUser(user);

            // Generate token for the new employee
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtService.generateToken(userDetails);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "user", savedEmployee,
                "restaurantId", savedEmployee.getRestaurantId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("message", "Employee registration failed: " + e.getMessage())
            );
        }
    }


    // =======================
    // Toggle user status (admin only)
    // =======================
    @PatchMapping("/api/users/{userId}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Integer userId,
            @RequestBody Map<String, Boolean> request) {
        Users userToUpdate = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

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

    // =======================
    // Delete user (admin only)
    // =======================
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable int userId) {
        try {
            if (!userRepo.existsById(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }

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
