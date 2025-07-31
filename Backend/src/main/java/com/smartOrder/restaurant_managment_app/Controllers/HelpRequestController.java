package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoRequestFoundException;
import com.smartOrder.restaurant_managment_app.Models.HelpRequest;
import com.smartOrder.restaurant_managment_app.WebSockets.HelpRequestWebSocketService;
import com.smartOrder.restaurant_managment_app.repository.HelpRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@RestController
@CrossOrigin
@RequestMapping("/api/help-requests")
public class HelpRequestController {
  
  private HelpRequestRepository helpRequestRepo;
  private HelpRequestWebSocketService webSocketService;
  private static final Logger log = LoggerFactory.getLogger(HelpRequestController.class);
  
  @Autowired
  private SimpMessagingTemplate messagingTemplate;

  
  public HelpRequestController(HelpRequestRepository helpRequestRepo, HelpRequestWebSocketService webSocketService) {
     this.helpRequestRepo = helpRequestRepo;
     this.webSocketService = webSocketService;
  }
  
  @GetMapping("/all-active-request")
  public List<HelpRequest> getAllActiveHelpRequest() {
    return helpRequestRepo.findByResolvedFalse();
  }
  
  @GetMapping("/{id}")
  public HelpRequest getSpecificRequest(@PathVariable Long id) {
    return helpRequestRepo.findById(id)
      .orElseThrow(() -> new NoRequestFoundException("No Request found with id: " + id));
  }
  
  @PutMapping("/{id}/resolve")
  public ResponseEntity<HelpRequest> resolveRequest(@PathVariable Long id) {
    HelpRequest req = helpRequestRepo.findById(id)
      .orElseThrow(() -> new NoRequestFoundException("No Request found with id: " + id));
    
    req.setResolved(true);
    HelpRequest save = helpRequestRepo.save(req);
    webSocketService.broadcastHelpRequestUpdate(save);
    
    return ResponseEntity.ok(save);
  }
  
  @PostMapping()
  public HelpRequest createHelpRequest(@RequestBody HelpRequest helpRequest) {
    if(helpRequest.getReason() == null || helpRequest.getReason().isEmpty()) {
      helpRequest.setReason("Need assistance");
    }
    
    helpRequest.setRequestTime(LocalDateTime.now());
    helpRequest.setResolved(false);
    
    HelpRequest save = helpRequestRepo.save(helpRequest);
    webSocketService.broadcastHelpRequestUpdate(save);
    return save;
  }
  
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
      if (!helpRequestRepo.existsById(id)) {
          throw new NoRequestFoundException("No Request found with id: " + id);
      }
      
      // Delete from repository
      helpRequestRepo.deleteById(id);
      
      // Broadcast deletion event
      Map<String, Object> event = new HashMap<>();
      event.put("eventType", "DELETE");
      event.put("requestId", id);
      messagingTemplate.convertAndSend("/topic/help-requests", event);
      
      return ResponseEntity.noContent().build();
  }
}