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

@RestController
@RequestMapping("/api/tables")
public class TableController {

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/active")
    public List<String> getActiveTables() {
        return tableRepository.findBySessionActiveTrue()
                .stream()
                .map(TableSession::getTableNumber)
                .collect(Collectors.toList());
    }
    
    @GetMapping("/{tableNumber}/session-status")
    public ResponseEntity<Boolean> getSessionStatus(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        return ResponseEntity.ok(tableOpt.map(TableSession::isSessionActive).orElse(false));
    }

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
            table.setBillProcessed(false); // Reset bill status when starting new session
            tableRepository.save(table);
            broadcastTableUpdate(tableNumber, "SESSION_STARTED");
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{tableNumber}/process-bill")
    public ResponseEntity<?> processBill(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        if (tableOpt.isPresent()) {
            TableSession table = tableOpt.get();
            if (!table.isBillProcessed()) {
                table.setBillProcessed(true);
                tableRepository.save(table);
                
                // Notify customer that bill has been processed
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
                    
                    // Notify customer to redirect to thank you page
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

    @PostMapping("/{tableNumber}/process-and-end")
    public ResponseEntity<?> processBillAndEndSession(@PathVariable String tableNumber) {
        ResponseEntity<?> processResponse = processBill(tableNumber);
        if (processResponse.getStatusCode().is2xxSuccessful()) {
            return endSession(tableNumber);
        }
        return processResponse;
    }

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