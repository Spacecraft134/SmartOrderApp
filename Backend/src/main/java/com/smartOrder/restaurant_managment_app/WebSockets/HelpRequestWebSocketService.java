package com.smartOrder.restaurant_managment_app.WebSockets;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for handling WebSocket communications related to help requests.
 */
@Service
public class HelpRequestWebSocketService {
  
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Constructs a new HelpRequestWebSocketService with the given messaging template.
     * 
     * @param messagingTemplate The messaging template used for WebSocket communication
     */
    public HelpRequestWebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcasts a help request update to all subscribed clients.
     * 
     * @param helpRequest The help request object to broadcast
     */
    public void broadcastHelpRequestUpdate(Object helpRequest) {
        messagingTemplate.convertAndSend("/topic/help-requests", helpRequest);
    }
}