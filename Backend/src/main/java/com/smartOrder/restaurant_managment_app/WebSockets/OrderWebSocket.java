package com.smartOrder.restaurant_managment_app.WebSockets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;

@Service
public class OrderWebSocket {
  
  @Autowired
  private SimpMessagingTemplate messagingTemplate;

  // Renamed to sendOrderUpdate to match controller calls
  public void sendOrderUpdate(Order order) {
      messagingTemplate.convertAndSend("/topic/orders", order);
  }
}
