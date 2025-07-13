package com.smartOrder.restaurant_managment_app.WebSockets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Controllers.OrderController.OrderEvent;

@Component
public class OrderWebSocket {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendOrderUpdateToTable(Order order) {
        // Send to specific table's topic (for customer view)
        messagingTemplate.convertAndSend(
            "/topic/orders/" + order.getTableNumber(), 
            new OrderEvent("UPDATE", order)
        );
    }

    public void sendOrderUpdateToAll(Order order, String eventType) {
        // Send to generic orders topic (for waiter/kitchen dashboards)
        messagingTemplate.convertAndSend(
            "/topic/orders", 
            new OrderEvent(eventType, order)
        );
        
        // If order is being deleted or completed, also notify the specific table
        if ("DELETE".equals(eventType)) {
            messagingTemplate.convertAndSend(
                "/topic/orders/" + order.getTableNumber(),
                new OrderEvent("DELETE", order)
            );
        }
    }
    public void notifyOrderStatusChange(Order order, String previousStatus) {
      // Always send an UPDATE event with the current order status
      sendOrderUpdateToAll(order, "UPDATE");

      // Also update the specific table for customers
      sendOrderUpdateToTable(order);
  }
}