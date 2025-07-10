package com.smartOrder.restaurant_managment_app.WebSockets;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
  
  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    // Where clients listen for messages
    config.enableSimpleBroker("/topic");
    // Where messages sent from client to server
    config.setApplicationDestinationPrefixes("/app");
  }
  
  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
      // WebSocket endpoint for clients to connect to
      registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
  }
}
