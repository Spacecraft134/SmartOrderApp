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
            tableRepository.save(table);
            broadcastTableUpdate(tableNumber, "SESSION_STARTED");
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{tableNumber}/end-session")
    public ResponseEntity<?> endSession(@PathVariable String tableNumber) {
        Optional<TableSession> tableOpt = tableRepository.findByTableNumber(tableNumber);
        if (tableOpt.isPresent()) {
            TableSession table = tableOpt.get();
            if (table.isSessionActive()) {
                table.setSessionActive(false);
                tableRepository.save(table);
                broadcastTableUpdate(tableNumber, "SESSION_ENDED");
                
                // Notify customer to redirect to thank you page
                messagingTemplate.convertAndSend("/topic/session-ended/" + tableNumber, 
                    Map.of(
                        "eventType", "SESSION_ENDED", 
                        "tableNumber", tableNumber,
                        "timestamp", System.currentTimeMillis()
                    ));
            }
        }
        return ResponseEntity.ok().build();
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