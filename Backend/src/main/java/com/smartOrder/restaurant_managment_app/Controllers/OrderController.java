package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoOrderFoundException;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import com.smartOrder.restaurant_managment_app.WebSockets.OrderWebSocket;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;
import com.smartOrder.restaurant_managment_app.repository.StatsSummaryRepository;
import com.smartOrder.restaurant_managment_app.services.OrderService;  // NEW IMPORT
import com.smartOrder.restaurant_managment_app.services.SaleByCategoryService;
import com.smartOrder.restaurant_managment_app.services.StatsCalculationService;
import com.smartOrder.restaurant_managment_app.services.TopSellingItemsService;
import jakarta.servlet.http.HttpServletRequest;

/**
 * REST controller for managing orders and order-related operations.
 * Now uses OrderService for automatic stats updates.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepo;
    
    @Autowired
    private StatsSummaryRepository statsSummaryRepo;

    @Autowired
    private OrderWebSocket orderWebSocket;
   
    @Autowired
    private TopSellingItemsService topSellingItemsService;
   
    @Autowired
    private SaleByCategoryService saleByCategoryService;
   
    @Autowired
    private TableController tableController;
   
    @Autowired
    private StatsCalculationService statsCalculationService;
    
    // NEW: Add OrderService for automatic stats updates
    @Autowired
    private OrderService orderService;

    /**
     * Wrapper class for WebSocket order events.
     */
    public static class OrderEvent {
        private String eventType;
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

    /**
     * Creates a new order and starts table session.
     * NOW USES OrderService for automatic stats updates
     */
    @PostMapping()
    public Order createNewOrder(@RequestBody Order order) {
        tableController.startSession(order.getTableNumber());
        order.setTime(LocalDateTime.now());
        order.setStatusOfOrder("WAITING_FOR_CONFIRMATION");
        
        if (order.getTotalAmount() == null && order.getItems() != null) {
            double total = 0.0;
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
                if (item.getMenuItem() != null && item.getQuantity() > 0) {
                    double price = item.getMenuItem().getPrice();
                    total += price * item.getQuantity();
                }
            }
            order.setTotalAmount((long) Math.round(total * 100));
        } else if (order.getItems() != null) {
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
            }
        }

        // CHANGED: Use OrderService instead of direct repository save
        Order saved = orderService.saveOrder(order);
        
        // Note: Stats are now automatically updated by OrderService
        orderWebSocket.sendOrderUpdateToAll(saved, "UPDATE");
        
        return saved;
    }
    
    
    

    /**
     * Retrieves a specific order by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }
        return ResponseEntity.ok(orderWithMatchingId.get());
    }

    /**
     * Retrieves all orders(Active and Non-Active)
     */
    @GetMapping()
    public List<Order> getAllOrders() {
        return orderService.getAllOrders(); // Use service instead of direct repo
    }

    /**
     * Marks an order as completed.
     * NOW USES OrderService for automatic stats updates
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> markOrderAsCompleted(@PathVariable Long id) {
        // CHANGED: Use OrderService for status updates
        Order updatedOrder = orderService.updateOrderStatus(id, "COMPLETED");
        
        if (updatedOrder == null) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        orderWebSocket.notifyOrderStatusChange(updatedOrder, "READY"); // Assume previous status
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Marks an order as in progress.
     * NOW USES OrderService for automatic stats updates
     */
    @PutMapping("/{id}/progress")
    public ResponseEntity<?> markOrderInProgress(@PathVariable Long id) {
        // CHANGED: Use OrderService for status updates
        Order updatedOrder = orderService.updateOrderStatus(id, "IN_PROGRESS");
        
        if (updatedOrder == null) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }
        
        orderWebSocket.notifyOrderStatusChange(updatedOrder, "WAITING_FOR_CONFIRMATION");
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Marks an order as ready for pickup/delivery.
     * NOW USES OrderService for automatic stats updates
     */
    @PutMapping("/{id}/ready")
    public ResponseEntity<?> markOrderReady(@PathVariable Long id) {
        // CHANGED: Use OrderService for status updates
        Order updatedOrder = orderService.updateOrderStatus(id, "READY");
        
        if (updatedOrder == null) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }
       
        orderWebSocket.notifyOrderStatusChange(updatedOrder, "IN_PROGRESS");
        return ResponseEntity.ok(updatedOrder);
    }

    // REST OF YOUR EXISTING METHODS REMAIN UNCHANGED...
    
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

    @GetMapping("/in-progress")
    public List<Order> getInProgressOrders() {
        return orderRepo.findByStatusOfOrder("IN_PROGRESS");
    }

    @GetMapping("/kitchen-queue")
    public ResponseEntity<Map<String, Object>> getKitchenQueue() {
        try {
            List<Order> pending = orderRepo.findByStatusOfOrder("WAITING_FOR_CONFIRMATION");
            List<Order> inProgress = orderRepo.findByStatusOfOrder("IN_PROGRESS");
            
            long totalQueue = pending.size() + inProgress.size();
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", totalQueue);
            response.put("pending", pending);
            response.put("inProgress", inProgress);
            response.put("pendingCount", pending.size());
            response.put("inProgressCount", inProgress.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch kitchen queue"));
        }
    }

    @GetMapping("/ready")
    public List<Order> getReadyOrders() {
        return orderRepo.findByStatusOfOrder("READY");
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveOrders() {
        try {
            List<Order> waiting = orderRepo.findByStatusOfOrder("WAITING_FOR_CONFIRMATION");
            List<Order> inProgress = orderRepo.findByStatusOfOrder("IN_PROGRESS");
            List<Order> ready = orderRepo.findByStatusOfOrder("READY");
            
            Map<String, Object> response = new HashMap<>();
            response.put("waiting", waiting);
            response.put("inProgress", inProgress);
            response.put("ready", ready);
            response.put("total", waiting.size() + inProgress.size() + ready.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch active orders"));
        }
    }
    
    @GetMapping("/daily/{date}")
    public ResponseEntity<Stats> getStatsForDate(
        @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        HttpServletRequest request) {   
        try {
            Stats freshStats = statsCalculationService.calculateStatsFromData(date);
            
            return ResponseEntity.ok(freshStats);
            
        } catch (Exception e) {
           
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Manual refresh endpoint for immediate stats recalculation
     */
    @GetMapping("/refresh-stats/{date}")
    public ResponseEntity<Map<String, Object>> refreshStatsForDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            Stats freshStats = orderService.recalculateStatsForDate(date);
            List<Map<String, Object>> topItems = topSellingItemsService.calculateTopSellingItems(date);
            
            Map<String, Object> response = new HashMap<>();
            response.put("stats", freshStats);
            response.put("topItems", topItems);
            response.put("message", "Stats refreshed successfully for " + date);
            response.put("timestamp", LocalDateTime.now());
            
            System.out.println("🔄 Manual refresh completed for " + date);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error refreshing stats for " + date + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/top-items/{date}")
    public List<Map<String, Object>> getTopSellingItems(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return topSellingItemsService.calculateTopSellingItems(date);
    }

    @GetMapping("/category-sales/{date}")
    public Map<String, Double> getCategorySales(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return saleByCategoryService.calculateSalesByCategory(date);
    }

   
    @MessageMapping("/orders/{tableNumber}/subscribe")
    public void subscribeToOrderUpdates(@DestinationVariable String tableNumber) {
        // Subscription handled automatically by Spring
    }

    @MessageMapping("/orders/{tableNumber}/unsubscribe")
    public void unsubscribeFromOrderUpdates(@DestinationVariable String tableNumber) {
        // Unsubscription handled automatically by Spring
    }

    @GetMapping("/{tableNumber}/ws-status")
    public ResponseEntity<?> checkWebSocketStatus(@PathVariable String tableNumber) {
        return ResponseEntity.ok(Map.of("status", "active"));
    }
}