package com.smartOrder.restaurant_managment_app.WebSockets;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class HelpRequestWebSocketService {
  private final SimpMessagingTemplate messagingTemplate;

 
  public HelpRequestWebSocketService(SimpMessagingTemplate messagingTemplate) {
      this.messagingTemplate = messagingTemplate;
  }

  public void broadcastHelpRequestUpdate(Object helpRequest) {
      messagingTemplate.convertAndSend("/topic/help-requests", helpRequest);
  }
}