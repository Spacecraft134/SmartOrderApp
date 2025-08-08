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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoOrderFoundException;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import com.smartOrder.restaurant_managment_app.WebSockets.OrderWebSocket;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;
import com.smartOrder.restaurant_managment_app.repository.StatsSummaryRepository;
import com.smartOrder.restaurant_managment_app.services.BusyHourService;
import com.smartOrder.restaurant_managment_app.services.SaleByCategoryService;
import com.smartOrder.restaurant_managment_app.services.SalesPerformanceService;
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
    private BusyHourService busyHourService;
    
   @Autowired
   private TopSellingItemsService topSellingItemsService;
   
   @Autowired
   private SalesPerformanceService salesPerformanceService;
   
   @Autowired
   private SaleByCategoryService saleByCategoryService;
   
   @Autowired
   private TableController tableController;
   

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

    // Create order
    @PostMapping()
    public Order createNewOrder(@RequestBody Order order) {
      tableController.startSession(order.getTableNumber());
        order.setTime(LocalDateTime.now());
        order.setStatusOfOrder("WAITING_FOR_CONFIRMATION");
        if (order.getItems() != null) {
            for (OrderedItems item : order.getItems()) {
                item.setOrder(order);
            }
        }

        Order saved = orderRepo.save(order);
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
        order.setReadyTime(LocalDateTime.now());    
        Order saved = orderRepo.save(order);
       
        orderWebSocket.notifyOrderStatusChange(saved, previousStatus);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping("/daily/{date}")
    public Stats getStatsForDate(@PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
      return statsSummaryRepo.findByDate(date).orElse(new Stats()); 
    }
    
    @GetMapping("/busy-hours/{date}")
    public Map<String, Object> getBusyHourStats(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
      Map<Integer, Long> actual = busyHourService.calculateActualOrdersByHour(date);
      Map<Integer, Double> predicted = busyHourService.calculatePredictedOrdersByHour();

     
      Set<Integer> allHours = new TreeSet<>();
      allHours.addAll(actual.keySet());
      allHours.addAll(predicted.keySet());

      List<String> labels = allHours.stream()
              .sorted()
              .map(hour -> String.format("%02d:00", hour))
              .toList();

      List<Long> actualValues = allHours.stream()
              .map(hour -> actual.getOrDefault(hour, 0L))
              .toList();

      List<Double> predictedValues = allHours.stream()
              .map(hour -> predicted.getOrDefault(hour, 0.0))
              .toList();

      Map<String, Object> response = new HashMap<>();
      response.put("labels", labels);
      response.put("actual", actualValues);
      response.put("predicted", predictedValues);

      return response;
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
    
 // Add this new endpoint to your existing OrderController
    @GetMapping("/kitchen-queue")
    public ResponseEntity<Map<String, Long>> getKitchenQueueSize() {
            // Count orders in progress or waiting for confirmation
            long inProgressCount = orderRepo.countByStatusOfOrder("IN_PROGRESS");
            long waitingCount = orderRepo.countByStatusOfOrder("WAITING_FOR_CONFIRMATION");
            long totalQueue = inProgressCount + waitingCount;
            
            return ResponseEntity.ok(Map.of("count", totalQueue));
    }
}