package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoOrderFoundException;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

@RestController
@CrossOrigin
@RequestMapping("/api/orders")
public class OrderController {
  
  @Autowired
  private OrderRepository orderRepo;
  
  //create order
  @PostMapping()
  public Order createNewOrder(@RequestBody Order order) {
      order.setTime(LocalDateTime.now());
      order.setStatusOfOrder("In Progress");
      if (order.getItems() != null) {
          for (OrderedItems item : order.getItems()) {
              item.setOrder(order);
          }
      }

      return orderRepo.save(order);
  }

  //get orders
  @GetMapping("/{id}")
  public ResponseEntity<Order> getOrder(@PathVariable Long id) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
   
   return ResponseEntity.ok( orderWithMatchingId.get());
  }
  //get all orders
  @GetMapping()
  public List<Order> getAllOrders() {
    return orderRepo.findAll();
  }
  //update order status
  @PutMapping("/{id}/status")
  public ResponseEntity<Order> updateStatusForOrder(@PathVariable Long id, @RequestParam String status) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
    Order order = orderWithMatchingId.get();
    order.setStatusOfOrder(status);
    orderRepo.save(order);
    
    return ResponseEntity.ok(order);
  } 
  
  @DeleteMapping("/{id}")
  public void eleteOrder(@PathVariable Long id) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
    
    orderRepo.deleteById(id);
  }
}
