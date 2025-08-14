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
 * Service for order management with automatic stats updates.
 */
@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private StatsCalculationService statsCalculationService;
    
    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;
    
    @Transactional
    public Order saveOrder(Order order) {
        Order savedOrder = orderRepository.save(order);
        updateStatsForDate(savedOrder.getTime().toLocalDate());
        return savedOrder;
    }
    
    @Transactional
    public Order updateOrder(Order order) {
        Order updatedOrder = orderRepository.save(order);
        updateStatsForDate(updatedOrder.getTime().toLocalDate());
        return updatedOrder;
    }
    
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatusOfOrder(status);
            if ("COMPLETED".equals(status) || "READY".equals(status)) {
                order.setReadyTime(java.time.LocalDateTime.now());
            }
            Order updatedOrder = orderRepository.save(order);
            updateStatsForDate(updatedOrder.getTime().toLocalDate());
            return updatedOrder;
        }
        return null;
    }
    
    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            LocalDate orderDate = order.getTime().toLocalDate();
            orderRepository.deleteById(orderId);
            updateStatsForDate(orderDate);
        }
    }
    
    private void updateStatsForDate(LocalDate date) {
        try {
            Stats updatedStats = statsCalculationService.calculateStatsFromData(date);
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/stats-updates", updatedStats);
            }
        } catch (Exception e) {
            // Log error would go here
        }
    }
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    public Order findById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
    
    public Stats recalculateStatsForDate(LocalDate date) {
        return statsCalculationService.calculateStatsFromData(date);
    }
    
    public Stats recalculateStatsForToday() {
        return recalculateStatsForDate(LocalDate.now());
    }
}