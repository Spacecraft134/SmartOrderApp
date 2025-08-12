package com.smartOrder.restaurant_managment_app.WebSockets;

import com.smartOrder.restaurant_managment_app.Controllers.OrderController;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderWebSocket {
    private final SimpMessagingTemplate messagingTemplate;

    public OrderWebSocket(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendOrderUpdateToAll(Order order, String eventType) {
        messagingTemplate.convertAndSend("/topic/orders/" + order.getTableNumber(), 
            new OrderController.OrderEvent(eventType, order));
    }

    public void notifyOrderStatusChange(Order order, String previousStatus) {
        // Notify specific table
        messagingTemplate.convertAndSend("/topic/orders/" + order.getTableNumber(),
            new OrderController.OrderEvent("STATUS_CHANGE", order));
        
        // Notify kitchen dashboard if status changed to READY
        if ("READY".equals(order.getStatusOfOrder())) {
            messagingTemplate.convertAndSend("/topic/kitchen-orders",
                new OrderController.OrderEvent("READY", order));
        }
        
        // Notify waiters if status changed to READY
        if ("READY".equals(order.getStatusOfOrder())) {
            messagingTemplate.convertAndSend("/topic/waiter-orders",
                new OrderController.OrderEvent("READY", order));
        }
    }

    public void notifySessionEnded(String tableNumber) {
        messagingTemplate.convertAndSend("/topic/session-ended/" + tableNumber,
            Map.of("eventType", "SESSION_ENDED", "tableNumber", tableNumber));
    }
    
    public void sendStatsUpdate(Stats stats) {
      // Make sure all fields are being sent
      messagingTemplate.convertAndSend("/topic/stats-updates", Map.of(
          "todaysRevenue", stats.getTodaysRevenue(),
          "totalOrders", stats.getTotalOrders(),
          "avgOrderValue", stats.getAvgOrderValue(),
          "avgPreparationTime", stats.getAvgPreparationTime()
      ));
  }
}