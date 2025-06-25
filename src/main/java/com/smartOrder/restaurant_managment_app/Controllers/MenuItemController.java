package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.MenuItems;
import com.smartOrder.restaurant_managment_app.repository.MenuItemRepository;

@RestController
@CrossOrigin
@RequestMapping("api/menu")
public class MenuItemController {
  
  private MenuItemRepository menuItemRepo;
  
  public MenuItemController(MenuItemRepository menuItemRepo) {
    this.menuItemRepo = menuItemRepo;
  }
  
  @GetMapping("{id}")
  public MenuItems getItem(@PathVariable Long id) {
    Optional<MenuItems> item = menuItemRepo.findById(id);
    if(item.isEmpty()) {
      throw new itemNotFoundException("Could not find item with id: " + id);
    }
    return item.get();
  }
  
  @GetMapping
  public List<MenuItems> getAllItems() {
    return menuItemRepo.findAll();
  }
  
  @PostMapping 
  public MenuItems addItem(@RequestBody MenuItems item) {
    return menuItemRepo.save(item);
  }
  
  @GetMapping("/category/{category}")
  public List<MenuItems> getItemsByCategory(@PathVariable String category) {
    return menuItemRepo.findByCategory(category);
  }
  
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
    if(!menuItemRepo.existsById(id)) {
      throw new itemNotFoundException("Could not delete item because no item in menu with id: " + id);
    }
    menuItemRepo.deleteById(id);
    return ResponseEntity.noContent().build();
  }
    
}
