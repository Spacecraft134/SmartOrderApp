package com.smartOrder.restaurant_managment_app.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.Models.Users.Role;
import com.smartOrder.restaurant_managment_app.repository.RestaurantRepository;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;

/**
 * Service for user management and authentication.
 */
@Service
public class UserService {
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    AuthenticationManager authManager;
    
    @Autowired 
    private JWTService jwtService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private RestaurantRepository restaurantRepository;
    
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
            String role = userDetails.getAuthorities().iterator().next().getAuthority()
                         .replace("ROLE_", "");
            
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("role", role);
            response.put("username", userDetails.getUsername());
            
            return response;
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid username or password");
        }
    }
    
    public Users findByUsername(String username) {
        return userRepo.findByUsername(username);
    }
    
    public List<Users> getUsersByRestaurantId(Integer restaurantId) {
        return userRepo.findByRestaurantId(restaurantId);
    }

    public Users getAdminByRestaurantId(Integer restaurantId) {
        return userRepo.findByRestaurantIdAndRole(restaurantId, Users.Role.ADMIN)
            .stream()
            .findFirst()
            .orElse(null);
    }

    public List<Users> getWaitersByRestaurantId(Integer restaurantId) {
        return userRepo.findByRestaurantIdAndRole(restaurantId, Users.Role.WAITER);
    }

    public List<Users> getKitchenStaffByRestaurantId(Integer restaurantId) {
        return userRepo.findByRestaurantIdAndRole(restaurantId, Users.Role.KITCHEN);
    }

    public Users createUser(Users user) {
        if (!restaurantRepository.existsById(user.getRestaurantId().intValue())) {
            throw new RuntimeException("Restaurant not found");
        }
        
        if (userRepo.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        if (user.getRole() == Users.Role.ADMIN && 
            userRepo.existsByRestaurantIdAndRole(user.getRestaurantId(), Users.Role.ADMIN)) {
            throw new RuntimeException("Restaurant already has an admin");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    public Users toggleUserStatus(Integer userId, boolean active) {
        Users user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(active);
        return userRepo.save(user);
    }
    
    public void deleteUser(int userId) {
        userRepo.deleteById(userId);
    }
    
    public Users updateUser(Integer userId, Users userUpdates) {
        Users existingUser = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
     
        if (userUpdates.getName() != null && !userUpdates.getName().isEmpty()) {
            existingUser.setName(userUpdates.getName());
        }
        
        if (userUpdates.getRole() != null) {
            if (userUpdates.getRole() == Role.WAITER || userUpdates.getRole() == Role.KITCHEN) {
                existingUser.setRole(userUpdates.getRole());
            } else {
                throw new RuntimeException("Invalid role assignment");
            }
        }
        
        return userRepo.save(existingUser);
    }
}