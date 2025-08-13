package com.smartOrder.restaurant_managment_app.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

/**
 * Service for calculating daily statistics
 */
@Service
public class StatsCalculationService {
    
    @Autowired
    private OrderRepository orderRepo;
    
    @Autowired
    private StatsSummaryRepository statsSummaryRepo;
    
    /**
     * Calculates and saves daily statistics for given date
     * Now calculates per-item metrics instead of per-order
     */
    public Stats calculateStatsFromData(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepo.findByTimeBetween(startOfDay, endOfDay);
        
        long totalOrders = orders.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        double totalPreparationTime = 0.0;
        int totalItems = 0; // Count individual items, not orders
        int itemsWithPreparationTime = 0;
        
        for (Order order : orders) {
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                
                // Calculate revenue and count items
                for (OrderedItems item : order.getItems()) {
                    if (item.getMenuItem() != null && item.getQuantity() > 0) {
                        BigDecimal price = BigDecimal.valueOf(item.getMenuItem().getPrice());
                        BigDecimal quantity = BigDecimal.valueOf(item.getQuantity());
                        totalRevenue = totalRevenue.add(price.multiply(quantity));
                        totalItems += item.getQuantity();
                    }
                }
                
                // Calculate preparation time per item in this order
                double orderPrepTime = 0.0;
                if (order.getPreparationTime() != null) {
                    orderPrepTime = order.getPreparationTime();
                } else if (order.getTime() != null && order.getReadyTime() != null) {
                    Duration duration = Duration.between(order.getTime(), order.getReadyTime());
                    orderPrepTime = duration.toMinutes();
                }
                
                // Add prep time for each item in this order
                if (orderPrepTime > 0) {
                    for (OrderedItems item : order.getItems()) {
                        if (item.getMenuItem() != null && item.getQuantity() > 0) {
                            // Multiply prep time by quantity of items
                            totalPreparationTime += orderPrepTime * item.getQuantity();
                            itemsWithPreparationTime += item.getQuantity();
                        }
                    }
                }
            }
        }
        
        // Calculate per-item metrics
        double revenuePerItem = totalItems == 0 ? 0.0 : 
                totalRevenue.divide(BigDecimal.valueOf(totalItems), 2, RoundingMode.HALF_UP).doubleValue();
        
        double avgPreparationTimePerItem = itemsWithPreparationTime == 0 ? 0.0 :
                totalPreparationTime / itemsWithPreparationTime;
        
        Stats summary = statsSummaryRepo.findByDate(date).orElse(new Stats());
        summary.setDate(date);
        
        // Set total revenue (this should match sum of all items in TopSellingItems)
        summary.setTodaysRevenue(totalRevenue.setScale(2, RoundingMode.HALF_UP).doubleValue());
        summary.setTotalOrders(totalOrders);
        
        // avgOrderValue now represents revenue per item instead of per order
        summary.setAvgOrderValue(Math.round(revenuePerItem * 100.0) / 100.0);
        
        // avgPreparationTime now represents time per item instead of per order
        summary.setAvgPreparationTime(Math.round(avgPreparationTimePerItem * 100.0) / 100.0);
        
        return statsSummaryRepo.save(summary);
    }
}