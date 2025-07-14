package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.Stats;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;
import com.smartOrder.restaurant_managment_app.repository.StatsSummaryRepository;

@Service
public class StatsCalculationService {
  @Autowired
  private OrderRepository orderRepo;
  @Autowired
  private StatsSummaryRepository statsSummaryRepo;
  
  public Stats calculateStatsFromData(LocalDate date) {
    LocalDateTime startOfDay = date.atStartOfDay();
    LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
    
    List<Order> orders = orderRepo.findByTimeBetween(startOfDay, endOfDay);
    
    long totalOrders = orders.size();
    
    double totalRevenue = orders.stream()
        .mapToDouble(o -> o.getTotalAmount() != null ?  o.getTotalAmount() : 0)
        .sum();
    double avgOrderValue  = totalOrders == 0 ? 0 : totalRevenue/totalOrders;
    
    double avgPreparationTime = orders.stream()
        .filter(o -> o.getPreparationTime() != null)
        .mapToDouble(Order::getPreparationTime)
        .average()
        .orElse(0);
    
    Stats summary = statsSummaryRepo.findByDate(date).orElse(new Stats());
    summary.setDate(date);
    summary.setTodaysRevenue(totalRevenue);
    summary.setTotalOrders(totalOrders);
    summary.setAvgOrderValue(avgOrderValue);
    summary.setAvgPreparationTime(avgPreparationTime);
    
    return statsSummaryRepo.save(summary);
        
  } 
}
