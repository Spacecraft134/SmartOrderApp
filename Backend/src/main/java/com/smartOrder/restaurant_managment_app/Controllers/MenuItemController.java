package com.smartOrder.restaurant_managment_app.Controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.itemNotFoundException;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.repository.MenuItemRepository;

@RestController
@CrossOrigin
@RequestMapping("api/menu")
public class MenuItemController {

    private final MenuItemRepository menuItemRepo;
    private final Path uploadDir = Paths.get("uploads");
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MenuItemController(MenuItemRepository menuItemRepo) {
        this.menuItemRepo = menuItemRepo;
        createUploadDirectory();
    }

    private void createUploadDirectory() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload folder", e);
        }
    }

    @GetMapping("{id}")
    public MenuItems getItem(@PathVariable Long id) {
        return menuItemRepo.findById(id)
                .orElseThrow(() -> new itemNotFoundException("Could not find item with id: " + id));
    }

    @GetMapping
    public List<MenuItems> getAllItems() {
        return menuItemRepo.findAll();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItems> updateItemWithImage(
            @PathVariable Long id,
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {
        
        MenuItems existingItem = menuItemRepo.findById(id)
                .orElseThrow(() -> new itemNotFoundException("No item found with id: " + id));
        
        MenuItems updateData = objectMapper.readValue(itemJson, MenuItems.class);
        
        // Update fields
        existingItem.setName(updateData.getName());
        existingItem.setPrice(updateData.getPrice());
        existingItem.setCategory(updateData.getCategory());
        existingItem.setDescription(updateData.getDescription());
        
        // Handle image update
        if (imageFile != null && !imageFile.isEmpty()) {
            // Delete old image if exists
            if (existingItem.getImageUrl() != null) {
                Path oldFilePath = uploadDir.resolve(existingItem.getImageUrl().replace("/uploads/", ""));
                Files.deleteIfExists(oldFilePath);
            }
            
            // Save new image
            String filename = saveImage(imageFile);
            existingItem.setImageUrl("/uploads/" + filename);
        } else if (updateData.getImageUrl() == null) {
            // Remove image if cleared
            if (existingItem.getImageUrl() != null) {
                Path oldFilePath = uploadDir.resolve(existingItem.getImageUrl().replace("/uploads/", ""));
                Files.deleteIfExists(oldFilePath);
            }
            existingItem.setImageUrl(null);
        }
        
        MenuItems updatedItem = menuItemRepo.save(existingItem);
        return ResponseEntity.ok(updatedItem);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItems> addMenuItemWithImage(
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) throws IOException {

        MenuItems menuItem = objectMapper.readValue(itemJson, MenuItems.class);

        if (imageFile != null && !imageFile.isEmpty()) {
            String filename = saveImage(imageFile);
            menuItem.setImageUrl("/uploads/" + filename);
        }

        MenuItems savedItem = menuItemRepo.save(menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
    }

    private String saveImage(MultipartFile imageFile) throws IOException {
        String originalFilename = imageFile.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID() + extension;
        Path filePath = uploadDir.resolve(filename);
        
        Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    @GetMapping("/category/{category}")
    public List<MenuItems> getItemsByCategory(@PathVariable String category) {
        return menuItemRepo.findByCategory(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        MenuItems item = menuItemRepo.findById(id)
                .orElseThrow(() -> new itemNotFoundException("Could not delete item - not found: " + id));
        
        // Delete associated image
        if (item.getImageUrl() != null) {
            try {
                Path filePath = uploadDir.resolve(item.getImageUrl().replace("/uploads/", ""));
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.err.println("Failed to delete image: " + e.getMessage());
            }
        }
        
        menuItemRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}