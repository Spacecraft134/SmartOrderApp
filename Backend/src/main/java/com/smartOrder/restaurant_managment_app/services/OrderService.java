package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

/**
 * Enhanced OrderService that automatically updates stats when orders change
 */
@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private StatsCalculationService statsCalculationService;
    
    @Autowired(required = false) // Make optional in case WebSocket isn't configured
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Save order and automatically update stats
     */
    @Transactional
    public Order saveOrder(Order order) {
        Order savedOrder = orderRepository.save(order);
        
        // Automatically recalculate stats for the order date
        LocalDate orderDate = savedOrder.getTime().toLocalDate();
        updateStatsForDate(orderDate);
        
        return savedOrder;
    }
    
    /**
     * Update order and recalculate stats
     */
    @Transactional
    public Order updateOrder(Order order) {
        Order updatedOrder = orderRepository.save(order);
        
        // Recalculate stats for the order's date
        LocalDate orderDate = updatedOrder.getTime().toLocalDate();
        updateStatsForDate(orderDate);
        
        return updatedOrder;
    }
    
    /**
     * Update order status and recalculate stats if needed
     */
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            String previousStatus = order.getStatusOfOrder();
            order.setStatusOfOrder(status);
            
            // If order is completed or ready, update ready time and recalculate
            if ("COMPLETED".equals(status) || "READY".equals(status)) {
                order.setReadyTime(java.time.LocalDateTime.now());
            }
            
            Order updatedOrder = orderRepository.save(order);
            LocalDate orderDate = updatedOrder.getTime().toLocalDate();
            updateStatsForDate(orderDate);
            
            System.out.println("📊 Order " + orderId + " status changed: " + previousStatus + " → " + status);
            
            return updatedOrder;
        }
        return null;
    }
    
    /**
     * Delete order and recalculate stats
     */
    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            LocalDate orderDate = order.getTime().toLocalDate();
            orderRepository.deleteById(orderId);
            updateStatsForDate(orderDate);
            
            System.out.println("📊 Order " + orderId + " deleted - stats recalculated");
        }
    }
    
    /**
     * Helper method to update stats and notify frontend
     */
    private void updateStatsForDate(LocalDate date) {
        try {
            // Recalculate stats
            Stats updatedStats = statsCalculationService.calculateStatsFromData(date);
            
            // Send WebSocket update to frontend if available
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/stats-updates", updatedStats);
            }
            
            System.out.println("📊 Stats auto-updated for " + date + 
                " - Revenue: $" + updatedStats.getTodaysRevenue() + 
                " - Orders: " + updatedStats.getTotalOrders());
                
        } catch (Exception e) {
            System.err.println("❌ Failed to auto-update stats for date: " + date);
            e.printStackTrace();
        }
    }
    
    /**
     * Get all orders (unchanged)
     */
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    /**
     * Find order by ID (unchanged)
     */
    public Order findById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
    
    /**
     * Manual stats recalculation for a specific date
     */
    public Stats recalculateStatsForDate(LocalDate date) {
        Stats freshStats = statsCalculationService.calculateStatsFromData(date);
        
        // Send WebSocket update if available
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/stats-updates", freshStats);
        }
        
        System.out.println("🔄 Manual stats recalculation for " + date + 
            " - Revenue: $" + freshStats.getTodaysRevenue());
        
        return freshStats;
    }
    
    /**
     * Manual stats recalculation for today
     */
    public Stats recalculateStatsForToday() {
        return recalculateStatsForDate(LocalDate.now());
    }
}