package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.WebSockets.OrderWebSocket;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

/**
 * Service for cleaning up and updating order statuses.
 */
@Service
public class OrderCleanupService {
    @Autowired
    private OrderRepository orderRepo;
    
    @Autowired
    private OrderWebSocket orderWebSocket;
    
    /**
     * Scheduled task to mark old ready orders as completed.
     * Runs every minute.
     */
    @Scheduled(fixedRate = 60000)
    public void cleanUpOrders() {
        List<Order> readyOrders = orderRepo.findByStatusOfOrder("READY");
        LocalDateTime now = LocalDateTime.now();
        
        for (Order order : readyOrders) {
            if (order.getReadyTime() != null && order.getReadyTime().plusMinutes(3).isBefore(now)) {
                order.setStatusOfOrder("COMPLETED");
                orderRepo.save(order);
                orderWebSocket.sendOrderUpdateToAll(order, "UPDATE");
            }
        }
    }
}