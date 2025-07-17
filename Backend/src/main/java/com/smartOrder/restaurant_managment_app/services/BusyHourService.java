package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.repository.BusyHourPredictionRepository;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

@Service
public class BusyHourService {
  @Autowired
  private OrderRepository orderRepository;
  @Autowired
  private BusyHourPredictionRepository busyHourPredictionRepo;
  
  public Map<Integer, Long> calculateActualOrdersByHour(LocalDate date) {
    List<Order> orders = orderRepository.findByTimeBetween(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
    Map<Integer, Long> hourlyCounts = orders.stream()
        .collect(Collectors.groupingBy(o -> o.getTime().getHour(), Collectors.counting()));
    return hourlyCounts;
}
  
  public Map<Integer, Double> calculatePredictedOrdersByHour() {
    Map<Integer, List<Integer>> hourlyHistory = new HashMap<>();
    for (int i = 1; i <= 7; i++) {
        LocalDate date = LocalDate.now().minusDays(i);
        List<Order> orders = orderRepository.findByTimeBetween(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        for (Order order : orders) {
            int hour = order.getTime().getHour();
            hourlyHistory.computeIfAbsent(hour, k -> new ArrayList<>()).add(1);
        }
    }
    Map<Integer, Double> hourlyAverages = new HashMap<>();
    for (var entry : hourlyHistory.entrySet()) {
        hourlyAverages.put(entry.getKey(), entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0));
    }
    return hourlyAverages;
  }
}
