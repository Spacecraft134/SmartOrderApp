package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDate;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Represents daily statistics summary for restaurant operations.
 * Contains metrics like revenue, order counts, and performance indicators.
 */
@Entity
@Table(name = "stats_summary")
public class Stats {
  
    @Id
    @GeneratedValue
    private Long id;
    private LocalDate date;
    private Double todaysRevenue;
    private Long totalOrders;
    private Double avgOrderValue;
    private Double avgPreparationTime;

    /**
     * Constructs a new Stats instance with all fields.
     */
    public Stats(Long id, LocalDate date, Double todaysRevenue, Long totalOrders,
        Double avgOrderValue, Double avgPreparationTime) {
        this.id = id;
        this.date = date;
        this.todaysRevenue = todaysRevenue;
        this.totalOrders = totalOrders;
        this.avgOrderValue = avgOrderValue;
        this.avgPreparationTime = avgPreparationTime;
    }

    /**
     * Default constructor required by JPA.
     */
    public Stats() {}

    // Getters and setters with Javadoc comments
    public Long getId() { return id; }
    public LocalDate getDate() { return date; }
    public Double getTodaysRevenue() { return todaysRevenue; }
    public Long getTotalOrders() { return totalOrders; }
    public Double getAvgOrderValue() { return avgOrderValue; }
    public Double getAvgPreparationTime() { return avgPreparationTime; }

    public void setId(Long id) { this.id = id; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setTodaysRevenue(Double todaysRevenue) { this.todaysRevenue = todaysRevenue; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
    public void setAvgOrderValue(Double avgOrderValue) { this.avgOrderValue = avgOrderValue; }
    public void setAvgPreparationTime(Double avgPreparationTime) { 
        this.avgPreparationTime = avgPreparationTime; 
    }
}