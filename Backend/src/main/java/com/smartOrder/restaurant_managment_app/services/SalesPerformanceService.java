package com.smartOrder.restaurant_managment_app.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartOrder.restaurant_managment_app.Models.Order;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

/**
 * Service for generating sales performance reports across different time periods.
 */
@Service
public class SalesPerformanceService {
  
    @Autowired
    private OrderRepository orderRepo;
    
    /**
     * Calculates hourly sales performance for today compared to yesterday.
     */
    public Map<String, Object> calculateHourlySalesPerformance(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        LocalDateTime startOfYesterday = startOfDay.minusDays(1);

        List<Order> todayOrders = orderRepo.findByTimeBetween(startOfDay, endOfDay);
        List<Order> yesterdayOrders = orderRepo.findByTimeBetween(startOfYesterday, startOfDay);
        
        Map<String, Object> response = new HashMap<>();
        response.put("labels", generateHourlyLabels());
        response.put("today", mapToList(calculateHourlyRevenue(todayOrders)));
        response.put("yesterday", mapToList(calculateHourlyRevenue(yesterdayOrders)));
        
        return response;
    }
    
    /**
     * Calculates weekly sales performance comparing this week to last week.
     */
    public Map<String, Object> calculateWeeklySalesPerformance() {
        LocalDate today = LocalDate.now();
        LocalDate startOfThisWeek = today.with(DayOfWeek.MONDAY);
        LocalDate startOfLastWeek = startOfThisWeek.minusWeeks(1);

        Map<String, Object> response = new HashMap<>();
        response.put("labels", List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"));
        response.put("thisWeek", mapToListFromMap(calculateDailyRevenue(
            startOfThisWeek, startOfThisWeek.plusDays(7))));
        response.put("lastWeek", mapToListFromMap(calculateDailyRevenue(
            startOfLastWeek, startOfLastWeek.plusDays(7))));
        
        return response;
    }
    
    /**
     * Calculates monthly sales performance by weeks.
     */
    public Map<String, Object> calculateMonthlySalesPerformanceByWeeks(int year, int month) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        LocalDate endOfLastMonth = startOfLastMonth.withDayOfMonth(startOfLastMonth.lengthOfMonth());

        List<Order> currentMonthOrders = orderRepo.findByTimeBetween(
            startOfMonth.atStartOfDay(), endOfMonth.atTime(23, 59, 59));
        List<Order> lastMonthOrders = orderRepo.findByTimeBetween(
            startOfLastMonth.atStartOfDay(), endOfLastMonth.atTime(23, 59, 59));

        Map<String, Object> response = new HashMap<>();
        response.put("labels", List.of("Week 1", "Week 2", "Week 3", "Week 4"));
        response.put("currentMonth", mapToListWeeks(
            aggregateWeeklyRevenue(currentMonthOrders, endOfMonth.getDayOfMonth()), 4));
        response.put("lastMonth", mapToListWeeks(
            aggregateWeeklyRevenue(lastMonthOrders, endOfLastMonth.getDayOfMonth()), 4));
        
        return response;
    }
    
    private Map<Integer, Double> calculateHourlyRevenue(List<Order> orders) {
        Map<Integer, Double> hourlyRevenue = new HashMap<>();
        for (Order order : orders) {
            int hour = order.getTime().getHour();
            double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
            hourlyRevenue.merge(hour, amount, Double::sum);
        }
        return hourlyRevenue;
    }

    private Map<String, Double> calculateDailyRevenue(LocalDate start, LocalDate end) {
        List<Order> orders = orderRepo.findByTimeBetween(start.atStartOfDay(), end.atStartOfDay());
        Map<String, Double> revenueByDay = new HashMap<>();
        
        for (Order order : orders) {
            String dayLabel = order.getTime().getDayOfWeek().name().substring(0, 3);
            revenueByDay.merge(dayLabel, order.getTotalAmount() != null ? order.getTotalAmount() : 0.0, Double::sum);
        }
        return revenueByDay;
    }
    
    private Map<Integer, Double> aggregateWeeklyRevenue(List<Order> orders, int daysInMonth) {
        Map<Integer, Double> weeklyRevenue = new HashMap<>();
        for (int week = 1; week <= 4; week++) {
            weeklyRevenue.put(week, 0.0);
        }
        
        for (Order order : orders) {
            int day = order.getTime().getDayOfMonth();
            double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
            int weekNumber = (day <= 7) ? 1 : (day <= 14) ? 2 : (day <= 21) ? 3 : 4;
            weeklyRevenue.merge(weekNumber, amount, Double::sum);
        }
        return weeklyRevenue;
    }
    
    private List<String> generateHourlyLabels() {
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            labels.add(String.format("%02d:00", i));
        }
        return labels;
    }
    
    private List<Double> mapToList(Map<Integer, Double> hourlyRevenue) {
        List<Double> list = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            list.add(hourlyRevenue.getOrDefault(i, 0.0));
        }
        return list;
    }
    
    private List<Double> mapToListFromMap(Map<String, Double> revenueMap) {
        List<String> days = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
        List<Double> list = new ArrayList<>();
        for (String day : days) {
            list.add(revenueMap.getOrDefault(day, 0.0));
        }
        return list;
    }
    
    private List<Double> mapToListWeeks(Map<Integer, Double> weeklyRevenue, int weeksCount) {
        List<Double> list = new ArrayList<>();
        for (int week = 1; week <= weeksCount; week++) {
            list.add(weeklyRevenue.getOrDefault(week, 0.0));
        }
        return list;
    }
}