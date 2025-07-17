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
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;
import com.smartOrder.restaurant_managment_app.repository.OrderRepository;

@Service
public class SalesPerformanceService {
  
  @Autowired
  private OrderRepository orderRepo;
  
  public Map<String, Object> calculateHourlySalesPerformance(LocalDate date) {
    LocalDateTime startOfDay = date.atStartOfDay();
    LocalDateTime endOfDay = startOfDay.plusDays(1);

    List<Order> todayOrders = orderRepo.findByTimeBetween(startOfDay, endOfDay);

    LocalDateTime startOfYesterday = startOfDay.minusDays(1);
    LocalDateTime endOfYesterday = startOfDay;

    List<Order> yesterdayOrders = orderRepo.findByTimeBetween(startOfYesterday, endOfYesterday);
    
    Map<Integer, Double> todaySales = calculateHourlyRevenue(todayOrders);
    Map<Integer, Double> yesterdaySales = calculateHourlyRevenue(yesterdayOrders);

    Map<String, Object> response = new HashMap<>();
    response.put("labels", generateHourlyLabels());
    response.put("today", mapToList(todaySales));
    response.put("yesterday", mapToList(yesterdaySales));

    return response;
  }
  
  private Map<Integer, Double> calculateHourlyRevenue(List<Order> orders) {
    Map<Integer, Double> hourlyRevenue = new HashMap<>();
    for (Order order : orders) {
      int hour = order.getTime().getHour();
      double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
      hourlyRevenue.put(hour, hourlyRevenue.getOrDefault(hour, 0.0) + amount);
    }
    return hourlyRevenue;
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
  
  public Map<String, Object> calculateWeeklySalesPerformance() {
    LocalDate today = LocalDate.now();
    LocalDate startOfThisWeek = today.with(DayOfWeek.MONDAY);
    LocalDate startOfLastWeek = startOfThisWeek.minusWeeks(1);

    Map<String, Double> thisWeekData = calculateDailyRevenue(startOfThisWeek, startOfThisWeek.plusDays(7));
    Map<String, Double> lastWeekData = calculateDailyRevenue(startOfLastWeek, startOfLastWeek.plusDays(7));

    Map<String, Object> response = new HashMap<>();
    response.put("labels", List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"));
    response.put("thisWeek", mapToListFromMap(thisWeekData));
    response.put("lastWeek", mapToListFromMap(lastWeekData));
    return response;
}

  private Map<String, Double> calculateDailyRevenue(LocalDate start, LocalDate end) {
      List<Order> orders = orderRepo.findByTimeBetween(start.atStartOfDay(), end.atStartOfDay());
  
      Map<String, Double> revenueByDay = new HashMap<>();
      for (Order order : orders) {
          String dayLabel = order.getTime().getDayOfWeek().name().substring(0, 3); // "MON", "TUE", etc.
          revenueByDay.put(dayLabel, revenueByDay.getOrDefault(dayLabel, 0.0) + (order.getTotalAmount() != null ? order.getTotalAmount() : 0));
      }
      return revenueByDay;
  }
  
  private List<Double> mapToListFromMap(Map<String, Double> revenueMap) {
      List<String> days = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
      List<Double> list = new ArrayList<>();
      for (String day : days) {
          list.add(revenueMap.getOrDefault(day, 0.0));
      }
      return list;
  }
  public Map<String, Object> calculateMonthlySalesPerformanceByWeeks(int year, int month) {
    LocalDate startOfMonth = LocalDate.of(year, month, 1);
    LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

    LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
    LocalDate endOfLastMonth = startOfLastMonth.withDayOfMonth(startOfLastMonth.lengthOfMonth());

    // Fetch orders for current month
    List<Order> currentMonthOrders = orderRepo.findByTimeBetween(
        startOfMonth.atStartOfDay(),
        endOfMonth.atTime(23, 59, 59)
    );

    // Fetch orders for last month
    List<Order> lastMonthOrders = orderRepo.findByTimeBetween(
        startOfLastMonth.atStartOfDay(),
        endOfLastMonth.atTime(23, 59, 59)
    );

    // Aggregate weekly revenue (4 weeks)
    Map<Integer, Double> currentMonthWeeklySales = aggregateWeeklyRevenue(currentMonthOrders, endOfMonth.getDayOfMonth());
    Map<Integer, Double> lastMonthWeeklySales = aggregateWeeklyRevenue(lastMonthOrders, endOfLastMonth.getDayOfMonth());

    // Fixed labels for 4 weeks
    List<String> labels = List.of("Week 1", "Week 2", "Week 3", "Week 4");

    Map<String, Object> response = new HashMap<>();
    response.put("labels", labels);
    response.put("currentMonth", mapToListWeeks(currentMonthWeeklySales, 4));
    response.put("lastMonth", mapToListWeeks(lastMonthWeeklySales, 4));

    return response;
  }
  
  /**
   * Aggregate revenue by 4 fixed weeks.
   * Week 1 = days 1-7
   * Week 2 = days 8-14
   * Week 3 = days 15-21
   * Week 4 = days 22-end of month
   */
  private Map<Integer, Double> aggregateWeeklyRevenue(List<Order> orders, int daysInMonth) {
      Map<Integer, Double> weeklyRevenue = new HashMap<>();
      // Initialize all 4 weeks with 0.0
      for (int week = 1; week <= 4; week++) {
          weeklyRevenue.put(week, 0.0);
      }
  
      for (Order order : orders) {
          int day = order.getTime().getDayOfMonth();
          double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
  
          int weekNumber;
          if (day <= 7) {
              weekNumber = 1;
          } else if (day <= 14) {
              weekNumber = 2;
          } else if (day <= 21) {
              weekNumber = 3;
          } else {
              weekNumber = 4;
          }
  
          weeklyRevenue.put(weekNumber, weeklyRevenue.get(weekNumber) + amount);
      }
  
      return weeklyRevenue;
  }
  
  private List<Double> mapToListWeeks(Map<Integer, Double> weeklyRevenue, int weeksCount) {
      List<Double> list = new ArrayList<>();
      for (int week = 1; week <= weeksCount; week++) {
          list.add(weeklyRevenue.getOrDefault(week, 0.0));
      }
      return list;
  }
  
}
