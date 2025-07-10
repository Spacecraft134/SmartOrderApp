package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoOrderFoundException;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.WebSockets.OrderWebSocket;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

@RestController
@CrossOrigin
@RequestMapping("/api/orders")
public class OrderController {
  
  @Autowired
  private OrderRepository orderRepo;
  
  @Autowired
  private OrderWebSocket orderWebSocket;
  
  // Create order
  @PostMapping()
  public Order createNewOrder(@RequestBody Order order) {
      order.setTime(LocalDateTime.now());
      order.setStatusOfOrder("In Progress");
      if (order.getItems() != null) {
          for (OrderedItems item : order.getItems()) {
              item.setOrder(order);
          }
      }
      
      Order saved = orderRepo.save(order);
      orderWebSocket.sendOrderUpdate(saved);  // renamed method call

      return saved;
  }

  // Get order by id
  @GetMapping("/{id}")
  public ResponseEntity<Order> getOrder(@PathVariable Long id) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
   
   return ResponseEntity.ok(orderWithMatchingId.get());
  }

  // Get all orders
  @GetMapping()
  public List<Order> getAllOrders() {
    return orderRepo.findAll();
  }

  // Update order status (status in request body)
  @PutMapping("/{id}/status")
  public ResponseEntity<Order> updateStatusForOrder(@PathVariable Long id, @RequestBody Map<String, String> body) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
    String status = body.get("status");
    Order order = orderWithMatchingId.get();
    order.setStatusOfOrder(status);
    Order saved = orderRepo.save(order);
    orderWebSocket.sendOrderUpdate(saved);  // renamed method call
    
    return ResponseEntity.ok(saved);
  } 
  
  // Delete order
  @DeleteMapping("/{id}")
  public void deleteOrder(@PathVariable Long id) {
    Optional<Order> orderWithMatchingId = orderRepo.findById(id);
    if(orderWithMatchingId.isEmpty()) {
      throw new NoOrderFoundException("No matching Order with: " + id);
    }
    
    orderRepo.deleteById(id);
  }
  
  // Get latest order by table number
  @GetMapping("/by-table/{tableNumber}")
  public ResponseEntity<Order> getLatestOrderByTable(@PathVariable String tableNumber) {
      Optional<Order> latestOrder = orderRepo.findTopByTableNumberOrderByTimeDesc(tableNumber);
      if (latestOrder.isEmpty()) {
          return ResponseEntity.notFound().build();
      }
      return ResponseEntity.ok(latestOrder.get());
  }
}
