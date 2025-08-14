package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.smartOrder.restaurant_managment_app.Models.TableSession;
import com.smartOrder.restaurant_managment_app.repository.TableRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing table sessions.
 * Handles table session lifecycle including starting, ending sessions,
 * and bill processing with real-time WebSocket notifications.
 * 
 */
@RestController
@RequestMapping("/api/tables")
public class TableController {

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Retrieves all currently active table numbers.
     *
     * @return List of active table numbers
     */
    @GetMapping("/active")
    public List<String> getActiveTables() {
        return tableRepository.findBySessionActiveTrue()
                .stream()
                .map(TableSession::getTableNumber)
                .collect(Collectors.toList());
    }
    
    /**
     * Checks the session status for a specific table.
     *
     * @param tableNumber the table number to check
     * @return ResponseEntity containing the session active status
     */
    @GetMapping("/{tableNumber}/session-status")
    public ResponseEntity<Boolean> getSessionStatus(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        return ResponseEntity.ok(tableOpt.map(TableSession::isSessionActive).orElse(false));
    }

    /**
     * Starts a dining session for the specified table.
     * Creates a new table session if one doesn't exist.
     *
     * @param tableNumber the table number to start session for
     * @return ResponseEntity indicating success
     */
    @PostMapping("/{tableNumber}/start-session")
    public ResponseEntity<?> startSession(@PathVariable String tableNumber) {
        TableSession table = tableRepository.findByTableNumber(tableNumber)
            .orElseGet(() -> {
                TableSession newTable = new TableSession();
                newTable.setTableNumber(tableNumber);
                return tableRepository.save(newTable);
            });

        if (!table.isSessionActive()) {
            table.setSessionActive(true);
            table.setBillProcessed(false);
            tableRepository.save(table);
            broadcastTableUpdate(tableNumber, "SESSION_STARTED");
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Processes the bill for a table session.
     * Marks the bill as processed and notifies the customer.
     *
     * @param tableNumber the table number to process bill for
     * @return ResponseEntity indicating success or not found
     */
    @PostMapping("/{tableNumber}/process-bill")
    public ResponseEntity<?> processBill(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        if (tableOpt.isPresent()) {
            TableSession table = tableOpt.get();
            if (!table.isBillProcessed()) {
                table.setBillProcessed(true);
                tableRepository.save(table);
                
                messagingTemplate.convertAndSend("/topic/bill-processed/" + tableNumber,
                    Map.of(
                        "eventType", "BILL_PROCESSED",
                        "tableNumber", tableNumber,
                        "timestamp", System.currentTimeMillis()
                    ));
            }
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Ends a dining session for the specified table.
     * Only allows ending if the bill has been processed.
     *
     * @param tableNumber the table number to end session for
     * @return ResponseEntity indicating success, failure, or not found
     */
    @PostMapping("/{tableNumber}/end-session")
    public ResponseEntity<?> endSession(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        if (tableOpt.isPresent()) {
            TableSession table = tableOpt.get();
            if (table.isSessionActive()) {
                if (table.isBillProcessed()) {
                    table.setSessionActive(false);
                    tableRepository.save(table);
                    broadcastTableUpdate(tableNumber, "SESSION_ENDED");
                    
                    messagingTemplate.convertAndSend("/topic/session-ended/" + tableNumber, 
                        Map.of(
                            "eventType", "SESSION_PROPERLY_ENDED", 
                            "tableNumber", tableNumber,
                            "timestamp", System.currentTimeMillis()
                        ));
                    return ResponseEntity.ok().build();
                } else {
                    return ResponseEntity.badRequest().body("Bill must be processed before ending session");
                }
            }
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Processes the bill and immediately ends the session.
     * Convenience method that combines bill processing and session ending.
     *
     * @param tableNumber the table number to process and end
     * @return ResponseEntity indicating the result of the operation
     */
    @PostMapping("/{tableNumber}/process-and-end")
    public ResponseEntity<?> processBillAndEndSession(@PathVariable String tableNumber) {
        ResponseEntity<?> processResponse = processBill(tableNumber);
        if (processResponse.getStatusCode().is2xxSuccessful()) {
            return endSession(tableNumber);
        }
        return processResponse;
    }

    /**
     * Broadcasts table updates to WebSocket subscribers.
     * Sends notifications to both general active tables topic and specific table topic.
     *
     * @param tableNumber the table number that was updated
     * @param eventType the type of event that occurred
     */
    private void broadcastTableUpdate(String tableNumber, String eventType) {      
        messagingTemplate.convertAndSend("/topic/active-tables",
                Map.of(
                    "eventType", eventType, 
                    "tableNumber", tableNumber,
                    "timestamp", System.currentTimeMillis()
                ));

        messagingTemplate.convertAndSend("/topic/table-session/" + tableNumber,
                Map.of(
                    "eventType", eventType,
                    "timestamp", System.currentTimeMillis()
                ));
    }
}