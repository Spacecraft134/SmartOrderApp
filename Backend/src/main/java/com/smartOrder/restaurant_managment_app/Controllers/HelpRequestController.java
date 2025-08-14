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

/**
 * REST controller for managing customer help requests.
 * Handles creation, retrieval, and resolution of help requests
 * with real-time WebSocket notifications to staff.
 * 
 */
@RestController
@CrossOrigin
@RequestMapping("/api/help-requests")
public class HelpRequestController {
  
    private HelpRequestRepository helpRequestRepo;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private TableController tableController;

    /**
     * Constructs HelpRequestController with required repository.
     *
     * @param helpRequestRepo the help request repository
     */
    public HelpRequestController(HelpRequestRepository helpRequestRepo) {
        this.helpRequestRepo = helpRequestRepo;
    }

    /**
     * Retrieves all active (unresolved) help requests ordered by request time.
     *
     * @return List of active help requests
     */
    @GetMapping("/all-active-request")
    public List<HelpRequest> getAllActiveRequests() {
        return helpRequestRepo.findByResolvedFalseOrderByRequestTimeDesc();
    }
    
    /**
     * Creates a new help request from a customer.
     * Sets default reason if none provided and broadcasts to staff.
     *
     * @param helpRequest the help request details
     * @return the saved help request
     */
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
    
    /**
     * Deletes a help request and handles special processing for bill requests.
     * If the request is for a bill, it triggers session ending process.
     *
     * @param id the help request ID to delete
     * @return ResponseEntity with no content
     * @throws NoRequestFoundException if request not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        Optional<HelpRequest> requestOpt = helpRequestRepo.findById(id);
        if (requestOpt.isEmpty()) {
            throw new NoRequestFoundException("No Request found with id: " + id);
        }
        
        HelpRequest request = requestOpt.get();
        
        if ("Need bill".equalsIgnoreCase(request.getReason())) {
            tableController.endSession(request.getTableNumber());
            
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