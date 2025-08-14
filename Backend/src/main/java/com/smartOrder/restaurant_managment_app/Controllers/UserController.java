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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.RefreshToken;
import com.smartOrder.restaurant_managment_app.Models.Restaurant;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.repository.RestaurantRepository;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.MyUserDetailsService;
import com.smartOrder.restaurant_managment_app.services.RefreshTokenService;
import com.smartOrder.restaurant_managment_app.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * REST controller for user management and authentication.
 * Handles admin registration, user login/logout, token refresh,
 * and CRUD operations for restaurant users.
 * 
 */
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
    @Autowired
    private RefreshTokenService refreshTokenService;

    /**
     * Registers a new admin user and creates/associates restaurant.
     * Creates a restaurant if it doesn't exist for the given code.
     *
     * @param restaurantCode the unique restaurant code
     * @param user the admin user details
     * @return ResponseEntity with registration result and JWT token
     */
    @PostMapping("/register-admin/{restaurantCode}")
    public ResponseEntity<?> registerAdmin(
        @PathVariable String restaurantCode,
        @RequestBody Users user) {

        try {
            Restaurant restaurant = restaurantRepository.findByCode(restaurantCode)
                .orElseGet(() -> {
                    Restaurant newRestaurant = new Restaurant();
                    newRestaurant.setName(user.getRestaurantName());
                    newRestaurant.setCode(restaurantCode);
                    return restaurantRepository.save(newRestaurant);
                });

            if (userRepo.existsByRestaurantIdAndRole(restaurant.getId(), Users.Role.ADMIN)) {
                return ResponseEntity.badRequest().body("Restaurant already has an admin");
            }

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

    /**
     * Authenticates an admin user and returns JWT tokens.
     *
     * @param user the login credentials
     * @return ResponseEntity with access token, refresh token, and user details
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Users user) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );

            Users authenticatedUser = userService.findByUsername(user.getUsername());
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String accessToken = jwtService.generateToken(userDetails);
            
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(authenticatedUser.getId());

            return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "tokenType", "Bearer",
                "expiresIn", 3600,
                "user", Map.of(
                    "username", authenticatedUser.getUsername(),
                    "role", authenticatedUser.getRole().name(),
                    "name", authenticatedUser.getName(),
                    "restaurantId", authenticatedUser.getRestaurantId()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("message", "Login failed: " + e.getMessage())
            );
        }
    }

    /**
     * Authenticates an employee (waiter or kitchen staff) and returns JWT tokens.
     *
     * @param user the login credentials
     * @return ResponseEntity with access token, refresh token, and user details
     */
    @PostMapping("/api/employee/login")
    public ResponseEntity<?> employeeLogin(@RequestBody Users user) {
        try {
            Users dbUser = userService.findByUsername(user.getUsername());
            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
            }

            if (!dbUser.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is inactive"));
            }

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );

            if (dbUser.getRole() != Users.Role.WAITER && dbUser.getRole() != Users.Role.KITCHEN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Unauthorized role"));
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String accessToken = jwtService.generateToken(userDetails);
            
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(dbUser.getId());

            return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "tokenType", "Bearer",
                "expiresIn", 3600, 
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
    
    /**
     * Refreshes an access token using a valid refresh token.
     *
     * @param request Map containing the refresh token
     * @return ResponseEntity with new access and refresh tokens
     */
    @PostMapping("/api/auth/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Refresh token is required")
            );
        }

        try {
            Users user = refreshTokenService.getUserFromRefreshToken(refreshToken);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid refresh token")
                );
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String newAccessToken = jwtService.generateToken(userDetails);
            
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

            return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "refreshToken", newRefreshToken.getToken(),
                "tokenType", "Bearer",
                "expiresIn", 3600
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("message", "Token refresh failed: " + e.getMessage())
            );
        }
    }

    /**
     * Logs out an admin user and invalidates their refresh token.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     * @param requestBody optional request body
     * @return ResponseEntity indicating logout success
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, 
                                   @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                String username = auth.getName();
                Users user = userService.findByUsername(username);
                if (user != null) {
                    refreshTokenService.deleteByUserId(user.getId());
                }
                new SecurityContextLogoutHandler().logout(request, response, auth);
            }
            return ResponseEntity.ok().body(Map.of("message", "Logout successful"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("message", "Logout failed: " + e.getMessage())
            );
        }
    }

    /**
     * Logs out an employee user and invalidates their refresh token.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     * @param requestBody optional request body
     * @return ResponseEntity indicating logout success
     */
    @PostMapping("/api/employee/logout")
    public ResponseEntity<?> employeeLogout(HttpServletRequest request, HttpServletResponse response,
                                           @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                String username = auth.getName();
                Users user = userService.findByUsername(username);
                if (user != null) {
                    refreshTokenService.deleteByUserId(user.getId());
                }
                new SecurityContextLogoutHandler().logout(request, response, auth);
            }
            return ResponseEntity.ok().body(Map.of("message", "Employee logout successful"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("message", "Employee logout failed: " + e.getMessage())
            );
        }
    }

    /**
     * Retrieves all users for a specific restaurant (admin only).
     *
     * @param restaurantId the restaurant ID
     * @return ResponseEntity with list of users or error message
     */
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

    /**
     * Retrieves the admin user for a specific restaurant.
     *
     * @param restaurantId the restaurant ID
     * @return ResponseEntity with admin user or error message
     */
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

    /**
     * Retrieves all waiter users for a specific restaurant.
     *
     * @param restaurantId the restaurant ID
     * @return ResponseEntity with list of waiters
     */
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

    /**
     * Retrieves all kitchen staff for a specific restaurant.
     *
     * @param restaurantId the restaurant ID
     * @return ResponseEntity with list of kitchen staff
     */
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

    /**
     * Creates a new employee user (admin only).
     *
     * @param user the employee details
     * @param auth the current authentication context
     * @return ResponseEntity with created employee and JWT token
     */
    @PostMapping("/register-employee")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> registerEmployee(
            @RequestBody Users user,
            Authentication auth) {
        try {
            String adminUsername = auth.getName();
            Users admin = userService.findByUsername(adminUsername);

            if (admin.getRole() != Users.Role.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only admins can create employees."));
            }

            user.setRestaurantId(admin.getRestaurantId());

            if (user.getRole() != Users.Role.WAITER && user.getRole() != Users.Role.KITCHEN) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Role must be WAITER or KITCHEN"));
            }

            user.setActive(true);
            Users savedEmployee = userService.createUser(user);

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

    /**
     * Toggles the active status of a user (admin only).
     *
     * @param userId the user ID
     * @param request Map containing the new active status
     * @return ResponseEntity with updated user
     */
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

    /**
     * Deletes a user account (admin only).
     * Prevents admins from deleting their own account.
     *
     * @param userId the user ID to delete
     * @return ResponseEntity indicating success or error
     */
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
    
    /**
     * Updates user information (admin only).
     *
     * @param userId the user ID to update
     * @param userUpdates the updated user data
     * @return ResponseEntity with updated user
     */
    @PutMapping("/api/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateUser(
        @PathVariable Integer userId,
        @RequestBody Users userUpdates) {
        try {
            Users updatedUser = userService.updateUser(userId, userUpdates);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Error updating user: " + e.getMessage());
        }
    }
}