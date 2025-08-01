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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions.NoRequestFoundException;
import com.smartOrder.restaurant_managment_app.Models.HelpRequest;
import com.smartOrder.restaurant_managment_app.repository.HelpRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin
@RequestMapping("/api/help-requests")
public class HelpRequestController {
  
    private HelpRequestRepository helpRequestRepo;
    private static final Logger log = LoggerFactory.getLogger(HelpRequestController.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private TableController tableController;

    public HelpRequestController(HelpRequestRepository helpRequestRepo) {
        this.helpRequestRepo = helpRequestRepo;
    }
    @GetMapping("/all-active-request")
    public List<HelpRequest> getAllActiveRequests() {
        return helpRequestRepo.findByResolvedFalseOrderByRequestTimeDesc();
    }
    
    @PostMapping()
    public HelpRequest createHelpRequest(@RequestBody HelpRequest helpRequest) {
        if(helpRequest.getReason() == null || helpRequest.getReason().isEmpty()) {
            helpRequest.setReason("Need assistance");
        }
        
        helpRequest.setRequestTime(LocalDateTime.now());
        helpRequest.setResolved(false);
        
        HelpRequest saved = helpRequestRepo.save(helpRequest);
        
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "CREATE");
        event.put("request", saved);
        messagingTemplate.convertAndSend("/topic/help-requests", event);
        
        return saved;
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        Optional<HelpRequest> requestOpt = helpRequestRepo.findById(id);
        if (requestOpt.isEmpty()) {
            throw new NoRequestFoundException("No Request found with id: " + id);
        }
        
        HelpRequest request = requestOpt.get();
        
        if ("Need bill".equalsIgnoreCase(request.getReason())) {
            tableController.endSession(request.getTableNumber());
            
            // Immediate notification to customer
            messagingTemplate.convertAndSend(
                "/topic/session-ended/" + request.getTableNumber(),
                Map.of(
                    "eventType", "SESSION_ENDED",
                    "tableNumber", request.getTableNumber(),
                    "timestamp", System.currentTimeMillis()
                )
            );
        }
        
        helpRequestRepo.deleteById(id);
        
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "DELETE");
        event.put("requestId", id);
        messagingTemplate.convertAndSend("/topic/help-requests", event);
        
        return ResponseEntity.noContent().build();
    }
}