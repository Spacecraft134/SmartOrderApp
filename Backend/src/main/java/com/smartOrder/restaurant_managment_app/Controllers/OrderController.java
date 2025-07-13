package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDateTime;
import java.util.List;
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

    // Wrapper class for websocket events
    public static class OrderEvent {
        private String eventType; // "UPDATE" or "DELETE"
        private Order order;

        public OrderEvent() {}

        public OrderEvent(String eventType, Order order) {
            this.eventType = eventType;
            this.order = order;
        }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Order getOrder() { return order; }
        public void setOrder(Order order) { this.order = order; }
    }

    // Create order
    @PostMapping()
    public Order createNewOrder(@RequestBody Order order) {
        order.setTime(LocalDateTime.now());
        order.setStatusOfOrder("WAITING_FOR_CONFIRMATION");
        if (order.getItems() != null) {
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
            }
        }

        Order saved = orderRepo.save(order);
        orderWebSocket.sendOrderUpdateToAll(saved, "UPDATE");  // <-- Use generic topic

        return saved;
    }

    // Get order by id
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        return ResponseEntity.ok(orderWithMatchingId.get());
    }

    // Get all orders
    @GetMapping()
    public List<Order> getAllOrders() {
        return orderRepo.findAll();
    }

    // Delete order
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        Order orderToDelete = orderWithMatchingId.get();

        // Notify frontend about deletion before deleting
        orderWebSocket.sendOrderUpdateToAll(orderToDelete, "DELETE");  // <-- Use generic topic

        orderRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Get latest orders by table number
    @GetMapping("/by-table/{tableNumber}")
    public ResponseEntity<List<Order>> getLatestOrderByTable(@PathVariable String tableNumber) {
        List<Order> orders = orderRepo.findByTableNumberOrderByTimeDesc(tableNumber);
        if (orders.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/pending")
    public List<Order> getPendingOrders() {
        return orderRepo.findByStatusOfOrder("WAITING_FOR_CONFIRMATION");
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> markOrderInProgress(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        Order order = orderWithMatchingId.get();
        String previousStatus = order.getStatusOfOrder();
        order.setStatusOfOrder("IN_PROGRESS");
        Order saved = orderRepo.save(order);
        
        // Use the new notification method
        orderWebSocket.notifyOrderStatusChange(saved, previousStatus);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/ready")
    public ResponseEntity<?> markOrderReady(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        Order order = orderWithMatchingId.get();
        String previousStatus = order.getStatusOfOrder();
        order.setStatusOfOrder("READY");
        Order saved = orderRepo.save(order);
        
        // Use the new notification method
        orderWebSocket.notifyOrderStatusChange(saved, previousStatus);
        return ResponseEntity.ok(saved);
    }

}
