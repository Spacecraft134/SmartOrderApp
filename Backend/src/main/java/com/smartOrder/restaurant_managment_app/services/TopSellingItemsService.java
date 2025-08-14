package com.smartOrder.restaurant_managment_app.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

/**
 * Service for calculating top selling menu items
 */
@Service
public class TopSellingItemsService {
    
    @Autowired
    private OrderRepository orderRepo;
    
    /**
     * Calculates top 6 selling items for given date
     */
    public List<Map<String, Object>> calculateTopSellingItems(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepo.findByTimeBetween(start, end);
        
        Map<String, Map<String, Object>> itemStats = new HashMap<>();
        
        for (Order order : orders) {
            if (order.getItems() == null) continue;
            
            for (OrderedItems item : order.getItems()) {
                String name = item.getMenuItem().getName();
                
                BigDecimal itemPrice = BigDecimal.valueOf(item.getMenuItem().getPrice());
                BigDecimal quantity = BigDecimal.valueOf(item.getQuantity());
                BigDecimal revenue = itemPrice.multiply(quantity);
                
                itemStats.putIfAbsent(name, new HashMap<>(Map.of(
                        "name", name,
                        "totalQuantity", 0,
                        "revenue", BigDecimal.ZERO,
                        "pricePerItem", itemPrice.setScale(2, RoundingMode.HALF_UP).doubleValue()
                )));
                
                Map<String, Object> stat = itemStats.get(name);
                stat.put("totalQuantity", (int) stat.get("totalQuantity") + item.getQuantity());
                stat.put("revenue", ((BigDecimal) stat.get("revenue")).add(revenue));
            }
        }
        
     
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> stat : itemStats.values()) {
            Map<String, Object> resultStat = new HashMap<>();
            resultStat.put("name", stat.get("name"));
            resultStat.put("orders", stat.get("totalQuantity")); 
            resultStat.put("pricePerItem", stat.get("pricePerItem"));
            
            BigDecimal revenue = (BigDecimal) stat.get("revenue");
            resultStat.put("revenue", revenue.setScale(2, RoundingMode.HALF_UP).doubleValue());
            
            result.add(resultStat);
        }
        
        return result.stream()
                .sorted((a, b) -> Integer.compare((int) b.get("orders"), (int) a.get("orders")))
                .limit(6)
                .toList();
    }
}