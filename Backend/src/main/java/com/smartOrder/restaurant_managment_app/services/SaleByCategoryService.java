package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

/**
 * Service for calculating sales revenue by menu item categories.
 */
@Service
public class SaleByCategoryService {
  
    @Autowired
    private OrderRepository orderRepo;
    
    /**
     * Calculates total sales revenue grouped by menu item categories for a given date.
     * 
     * @param date The date for which to calculate sales
     * @return Map where keys are category names and values are total revenue
     */
    public Map<String, Double> calculateSalesByCategory(LocalDate date) {
        List<Order> orders = orderRepo.findByTimeBetween(
            date.atStartOfDay(), 
            date.plusDays(1).atStartOfDay()
        );

        Map<String, Double> categorySales = new HashMap<>();

        for (Order order : orders) {
            for (OrderedItems item : order.getItems()) {
                String category = item.getMenuItem().getCategory();
                double itemRevenue = item.getQuantity() * item.getMenuItem().getPrice();
                categorySales.merge(category, itemRevenue, Double::sum);
            }
        }

        return categorySales;
    }
}