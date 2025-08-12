package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoOrderFoundException;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import com.smartOrder.restaurant_managment_app.WebSockets.OrderWebSocket;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;
import com.smartOrder.restaurant_managment_app.repository.StatsSummaryRepository;
import com.smartOrder.restaurant_managment_app.services.SaleByCategoryService;
import com.smartOrder.restaurant_managment_app.services.SalesPerformanceService;
import com.smartOrder.restaurant_managment_app.services.StatsCalculationService;
import com.smartOrder.restaurant_managment_app.services.TopSellingItemsService;

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
   private SalesPerformanceService salesPerformanceService;
   
   @Autowired
   private SaleByCategoryService saleByCategoryService;
   
   @Autowired
   private TableController tableController;
   
   @Autowired
   private StatsCalculationService statsCalculationService;
   

    // Wrapper class for websocket events
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
    @PostMapping()
    public Order createNewOrder(@RequestBody Order order) {
        tableController.startSession(order.getTableNumber());
        order.setTime(LocalDateTime.now());
        order.setStatusOfOrder("WAITING_FOR_CONFIRMATION");
        
        // Calculate total amount if not provided
        if (order.getTotalAmount() == null && order.getItems() != null) {
            double total = 0.0;
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
                // Get price from menu item, not from ordered item
                if (item.getMenuItem() != null && item.getQuantity() > 0) {
                    double price = item.getMenuItem().getPrice();
                    total += price * item.getQuantity();
                }
            }
            // Convert double to Long (assuming the amount is stored as cents or as a long)
            order.setTotalAmount((long) Math.round(total * 100)); // Convert to cents
        } else if (order.getItems() != null) {
            // Still need to set the order reference for each item
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
            }
        }

        Order saved = orderRepo.save(order);
        
        // Calculate and send updated stats
        Stats updatedStats = statsCalculationService.calculateStatsFromData(LocalDate.now());
        orderWebSocket.sendStatsUpdate(updatedStats);
        
        orderWebSocket.sendOrderUpdateToAll(saved, "UPDATE");
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

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> markOrderAsCompleted(@PathVariable Long id) {
        Optional<Order> orderWithMatchingId = orderRepo.findById(id);
        if (orderWithMatchingId.isEmpty()) {
            throw new NoOrderFoundException("No matching Order with: " + id);
        }

        Order order = orderWithMatchingId.get();
        String previousStatus = order.getStatusOfOrder();
        order.setStatusOfOrder("COMPLETED");
        Order saved = orderRepo.save(order);

        orderWebSocket.notifyOrderStatusChange(saved, previousStatus);
        return ResponseEntity.ok(saved);
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

    // KITCHEN DASHBOARD ENDPOINTS - Fixed for Admin Access
    @GetMapping("/pending")
    public List<Order> getPendingOrders() {
        return orderRepo.findByStatusOfOrder("WAITING_FOR_CONFIRMATION");
    }

    @GetMapping("/in-progress")
    public List<Order> getInProgressOrders() {
        return orderRepo.findByStatusOfOrder("IN_PROGRESS");
    }

    // NEW: Get all orders that need kitchen attention (for Kitchen Dashboard)
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
                .body(Map.of("error", "Failed to fetch kitchen queue: " + e.getMessage()));
        }
    }

    // NEW: Get ready orders (completed by kitchen, waiting for delivery)
    @GetMapping("/ready")
    public List<Order> getReadyOrders() {
        return orderRepo.findByStatusOfOrder("READY");
    }

    // NEW: Get all active orders (for kitchen dashboard overview)
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
                .body(Map.of("error", "Failed to fetch active orders: " + e.getMessage()));
        }
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
        order.setReadyTime(LocalDateTime.now());    
        Order saved = orderRepo.save(order);
       
        orderWebSocket.notifyOrderStatusChange(saved, previousStatus);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping("/daily/{date}")
    public Stats getStatsForDate(@PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
      return statsSummaryRepo.findByDate(date).orElse(new Stats()); 
    }
    
   
    
    @GetMapping("/top-items/{date}")
    public List<Map<String, Object>> getTopSellingItems(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
      return topSellingItemsService.calculateTopSellingItems(date);
    }
    
    @GetMapping("/sales-performance/{date}")
    public Map<String, Object> getHourlySalesPerformance(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        return salesPerformanceService.calculateHourlySalesPerformance(date);
    }
    
    @GetMapping("/weekly-sales-performance")
    public ResponseEntity<?> getWeeklySalesPerformance() {
        Map<String, Object> data = salesPerformanceService.calculateWeeklySalesPerformance();
        return ResponseEntity.ok(data);
    }
    
    @GetMapping("/monthly-sales-performance/{year}/{month}")
    public ResponseEntity<?> getMonthlyWeeklySalesPerformance(
            @PathVariable int year,
            @PathVariable int month) {
        Map<String, Object> data = salesPerformanceService.calculateMonthlySalesPerformanceByWeeks(year, month);
        return ResponseEntity.ok(data);
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