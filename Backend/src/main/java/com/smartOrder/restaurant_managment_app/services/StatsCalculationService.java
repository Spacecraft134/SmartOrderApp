package com.smartOrder.restaurant_managment_app.services;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
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
        
        // Calculate total revenue - always calculate from ordered items
        double totalRevenue = 0.0;
        double totalPreparationTime = 0.0;
        int ordersWithPreparationTime = 0;
        
        for (Order order : orders) {
            // Calculate revenue from ordered items
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                double orderTotal = 0.0;
                for (OrderedItems item : order.getItems()) {
                    // Get price from the menu item
                    if (item.getMenuItem() != null && item.getQuantity() > 0) {
                        double price = item.getMenuItem().getPrice();
                        orderTotal += price * item.getQuantity();
                    }
                }
                totalRevenue += orderTotal;
            }
            
            // Calculate preparation time
            if (order.getPreparationTime() != null) {
                totalPreparationTime += order.getPreparationTime();
                ordersWithPreparationTime++;
            } else {
                // If preparationTime field is null, try to calculate from timestamps
                if (order.getTime() != null && order.getReadyTime() != null) {
                    Duration duration = Duration.between(order.getTime(), order.getReadyTime());
                    long minutes = duration.toMinutes();
                    totalPreparationTime += minutes;
                    ordersWithPreparationTime++;
                }
            }
        }
        
        // Calculate averages
        double avgOrderValue = totalOrders == 0 ? 0.0 : totalRevenue / totalOrders;
        double avgPreparationTime = ordersWithPreparationTime == 0 ? 0.0 : 
            totalPreparationTime / ordersWithPreparationTime;
        
        // Find existing stats or create new one
        Stats summary = statsSummaryRepo.findByDate(date).orElse(new Stats());
        summary.setDate(date);
        summary.setTodaysRevenue(Math.round(totalRevenue * 100.0) / 100.0); // Round to 2 decimal places
        summary.setTotalOrders(totalOrders);
        summary.setAvgOrderValue(Math.round(avgOrderValue * 100.0) / 100.0); // Round to 2 decimal places
        summary.setAvgPreparationTime(Math.round(avgPreparationTime * 100.0) / 100.0); // Round to 2 decimal places
        
        System.out.println("Calculated Stats for " + date + ":");
        System.out.println("Total Orders: " + totalOrders);
        System.out.println("Total Revenue: " + totalRevenue);
        System.out.println("Avg Order Value: " + avgOrderValue);
        System.out.println("Avg Preparation Time: " + avgPreparationTime);
        
        return statsSummaryRepo.save(summary);
    }
}