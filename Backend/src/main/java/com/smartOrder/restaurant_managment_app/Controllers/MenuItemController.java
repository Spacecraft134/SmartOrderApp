package com.smartOrder.restaurant_managment_app.Controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.Models.Users.Role;
import com.smartOrder.restaurant_managment_app.repository.MenuItemRepository;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.logging.Level;
@RestController
@RequestMapping("/api/menu")
public class MenuItemController {
    
    private final MenuItemRepository menuItemRepo;
    private final UserRepo userRepo;
    private final Path uploadDir = Paths.get("uploads");

    @Autowired
    public MenuItemController(MenuItemRepository menuItemRepo, UserRepo userRepo) {
        this.menuItemRepo = menuItemRepo;
        this.userRepo = userRepo;
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload folder", e);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllMenuItems() {
        try {
            Users admin = getCurrentAdmin();
            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Admin not authenticated");
            }
            
            List<MenuItems> items = menuItemRepo.findByAdmin(admin);
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching menu items");
        }
    }
    
    @GetMapping("/public")
    public ResponseEntity<?> getPublicMenu() {
        try {
            List<MenuItems> allItems = menuItemRepo.findAll();
            List<MenuItems> availableItems = allItems.stream()
                    .filter(MenuItems::isAvailable)
                    .toList();
            return ResponseEntity.ok(availableItems);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching public menu");
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<MenuItems> getMenuItem(@PathVariable Long id) {
        Users admin = getCurrentAdmin();
        MenuItems item = menuItemRepo.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        return ResponseEntity.ok(item);
    }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItems> createMenuItem(
            @RequestPart("item") String menuItemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        
        // Convert JSON string to MenuItems object
        ObjectMapper objectMapper = new ObjectMapper();
        MenuItems menuItem = objectMapper.readValue(menuItemJson, MenuItems.class);
        
        Users admin = getCurrentAdmin();
        menuItem.setAdmin(admin);

        if (imageFile != null && !imageFile.isEmpty()) {
            String filename = saveImage(imageFile);
            menuItem.setImageUrl("/uploads/" + filename);
        }

        MenuItems savedItem = menuItemRepo.save(menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItems> updateMenuItem(
            @PathVariable Long id,
            @RequestPart("item") MenuItems menuItem,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        
        Users admin = getCurrentAdmin();
        MenuItems existingItem = menuItemRepo.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // Update fields
        existingItem.setName(menuItem.getName());
        existingItem.setDescription(menuItem.getDescription());
        existingItem.setPrice(menuItem.getPrice());
        existingItem.setCategory(menuItem.getCategory());
        existingItem.setAvailable(menuItem.isAvailable());

        // Handle image update
        if (imageFile != null && !imageFile.isEmpty()) {
            // Delete old image if exists
            if (existingItem.getImageUrl() != null) {
                deleteImage(existingItem.getImageUrl());
            }
            // Save new image
            String filename = saveImage(imageFile);
            existingItem.setImageUrl("/uploads/" + filename);
        }

        MenuItems updatedItem = menuItemRepo.save(existingItem);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        Users admin = getCurrentAdmin();
        MenuItems item = menuItemRepo.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // Delete associated image
        if (item.getImageUrl() != null) {
            deleteImage(item.getImageUrl());
        }

        menuItemRepo.delete(item);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<MenuItems>> getMenuItemsByCategory(@PathVariable String category) {
        Users admin = getCurrentAdmin();
        List<MenuItems> items = menuItemRepo.findByAdminAndCategory(admin, category);
        return ResponseEntity.ok(items);
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<MenuItems> toggleAvailability(@PathVariable Long id) {
        Users admin = getCurrentAdmin();
        MenuItems item = menuItemRepo.findByIdAndAdmin(id, admin)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        item.setAvailable(!item.isAvailable());
        MenuItems updatedItem = menuItemRepo.save(item);
        return ResponseEntity.ok(updatedItem);
    }

    private Users getCurrentAdmin() {
      try {
          Authentication auth = SecurityContextHolder.getContext().getAuthentication();
          if (auth == null || !auth.isAuthenticated()) {
              throw new RuntimeException("Not authenticated");
          }
          
          String username = auth.getName();
          Users user = userRepo.findByUsername(username);
          
          if (user == null) {
              throw new RuntimeException("User not found");
          }
          
          if (user.getRole() != Role.ADMIN){
              throw new RuntimeException("User is not an admin");
          }
          
          
          return user;
      } catch (Exception e) {
          throw new RuntimeException("Failed to get current admin: " + e.getMessage(), e);
      }
  }

    private String saveImage(MultipartFile imageFile) throws IOException {
        String originalFilename = imageFile.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID() + extension;
        Path filePath = uploadDir.resolve(filename);
        Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    private void deleteImage(String imageUrl) {
        try {
            Path filePath = uploadDir.resolve(imageUrl.replace("/uploads/", ""));
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image file", e);
        }
    }
}