package com.smartOrder.restaurant_managment_app.Controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
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

@RestController
@CrossOrigin
@RequestMapping("/api/help-requests")
public class HelpRequestController {
  
  private HelpRequestRepository helpRequestRepo;
  private HelpRequestWebSocketService webSocketService;
  
  public HelpRequestController(HelpRequestRepository helpRequestRepo,HelpRequestWebSocketService webSocketService ) {
     this.helpRequestRepo = helpRequestRepo;
     this.webSocketService = webSocketService;
  }
  
 
  
  @GetMapping("/all-active-request")
  public List<HelpRequest> getAllActiveHelpRequest() {
    return helpRequestRepo.findByResolvedFalse();
  }
  
  //get request
  @GetMapping("/{id}")
  public HelpRequest getSpecificRequest(@PathVariable Long id) {
    Optional<HelpRequest> request = helpRequestRepo.findById(id);
    
    if(request.isEmpty()) {
      throw new NoRequestFoundException("No Request found with id: " + id);
    }
    
    return request.get();
  }
  
  //update a request to resolve
  @PutMapping("/{id}/resolve")
  public ResponseEntity<HelpRequest> resolveRequest(@PathVariable Long id) {
    Optional<HelpRequest> request = helpRequestRepo.findById(id);
    if(request.isEmpty()) {
      throw new NoRequestFoundException("No Request found with id: " + id);
    }
    HelpRequest req = request.get();
    req.setResolved(true);
    HelpRequest save = helpRequestRepo.save(req);
    webSocketService.broadcastHelpRequestUpdate(save);
    
    return ResponseEntity.ok(save);
    
  }
  //create a request
  @PostMapping()
  public HelpRequest createHelpRequest(@RequestBody HelpRequest helpRequest) {
    helpRequest.setRequestTime(LocalDateTime.now());
    helpRequest.setResolved(false);
    HelpRequest save = helpRequestRepo.save(helpRequest);
    webSocketService.broadcastHelpRequestUpdate(save);
    return save;
  }
  //delete a request
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
    if(!helpRequestRepo.existsById(id)) {
      throw new NoRequestFoundException("No Request found with id: " + id);
    }
    helpRequestRepo.deleteById(id);
    return ResponseEntity.noContent().build();
  }

}