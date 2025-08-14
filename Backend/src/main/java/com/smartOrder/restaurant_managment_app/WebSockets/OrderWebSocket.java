package com.smartOrder.restaurant_managment_app.WebSockets;

import com.smartOrder.restaurant_managment_app.Controllers.OrderController;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Component for handling WebSocket communications related to orders.
 */
@Component
public class OrderWebSocket {
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Constructs a new OrderWebSocket with the given messaging template.
     * 
     * @param messagingTemplate The messaging template used for WebSocket communication
     */
    public OrderWebSocket(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends an order update to all clients subscribed to the specific table's order topic.
     * 
     * @param order The order to send updates about
     * @param eventType The type of event (e.g., "NEW_ORDER", "STATUS_CHANGE")
     */
    public void sendOrderUpdateToAll(Order order, String eventType) {
        messagingTemplate.convertAndSend("/topic/orders/" + order.getTableNumber(), 
            new OrderController.OrderEvent(eventType, order));
    }

    /**
     * Notifies clients about an order status change.
     * 
     * @param order The updated order
     * @param previousStatus The previous status of the order
     */
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

    /**
     * Notifies clients that a session has ended for a specific table.
     * 
     * @param tableNumber The table number whose session has ended
     */
    public void notifySessionEnded(String tableNumber) {
        messagingTemplate.convertAndSend("/topic/session-ended/" + tableNumber,
            Map.of("eventType", "SESSION_ENDED", "tableNumber", tableNumber));
    }

    /**
     * Notifies the kitchen about a new order.
     * 
     * @param order The new order to be processed by the kitchen
     */
    public void notifyNewKitchenOrder(Order order) {
        messagingTemplate.convertAndSend("/topic/kitchen-orders", 
            new OrderController.OrderEvent("NEW_ORDER", order));
        
        // Also send to simpler channel (optional)
        messagingTemplate.convertAndSend("/topic/new-orders", order);
    }
    
    /**
     * Sends statistics updates to subscribed clients.
     * 
     * @param stats The statistics object containing updated metrics
     */
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