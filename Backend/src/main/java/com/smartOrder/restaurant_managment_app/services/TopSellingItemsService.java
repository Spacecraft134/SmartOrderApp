package com.smartOrder.restaurant_managment_app.services;

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

@Service
public class TopSellingItemsService {
  
  @Autowired
  private OrderRepository orderRepo;
  
  
  public List<Map<String, Object>> calculateTopSellingItems(LocalDate date) {
    LocalDateTime start = date.atStartOfDay();
    LocalDateTime end = date.plusDays(1).atStartOfDay();

    List<Order> orders = orderRepo.findByTimeBetween(start, end);

    Map<String, Map<String, Object>> itemStats = new HashMap<>();

    for (Order order : orders) {
        if (order.getItems() == null) continue;
        for (OrderedItems item : order.getItems()) {
            String name = item.getMenuItem().getName();
            double revenue = item.getMenuItem().getPrice() * item.getQuantity();

            itemStats.putIfAbsent(name, new HashMap<>(Map.of(
                    "name", name,
                    "orders", 0,
                    "revenue", 0.0
            )));

            Map<String, Object> stat = itemStats.get(name);
            stat.put("orders", (int) stat.get("orders") + item.getQuantity());
            stat.put("revenue", (double) stat.get("revenue") + revenue);
        }
    }

    return new ArrayList<>(itemStats.values())
            .stream()
            .sorted((a, b) -> Integer.compare((int) b.get("orders"), (int) a.get("orders")))
            .limit(6)
            .toList();
  }


}
