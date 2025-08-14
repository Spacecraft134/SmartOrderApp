package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDateTime;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

/**
 * Entity representing a customer help request.
 * Tracks requests for assistance from customers at specific tables
 * with timestamp and resolution status.
 * 
 */
@Entity
public class HelpRequest {
  
    @Id
    @GeneratedValue
    private Long id;
    
    /** The table number where assistance is requested */
    private String tableNumber;
    
    /** Whether the request has been resolved */
    private boolean resolved;
    
    /** When the request was made */
    private LocalDateTime requestTime;
    
    /** The reason for the help request */
    private String reason;
    
    /**
     * Default constructor.
     * Initializes request with current time, unresolved status,
     * and default assistance reason.
     */
    public HelpRequest() {
        this.requestTime = LocalDateTime.now();
        this.resolved = false;
        this.reason = "Need assistance";
    }
    
    /**
     * Gets the unique identifier of the help request.
     *
     * @return the help request ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Gets the table number where assistance is requested.
     *
     * @return the table number
     */
    public String getTableNumber() {
        return tableNumber;
    }
    
    /**
     * Checks if the help request has been resolved.
     *
     * @return true if resolved, false otherwise
     */
    public boolean isResolved() {
        return resolved;
    }
    
    /**
     * Gets the timestamp when the request was made.
     *
     * @return the request timestamp
     */
    public LocalDateTime getRequestTime() {
        return requestTime;
    }
    
    /**
     * Gets the reason for the help request.
     *
     * @return the help request reason
     */
    public String getReason() {
        return reason;
    }
    
    /**
     * Sets the unique identifier of the help request.
     *
     * @param id the help request ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Sets the table number where assistance is requested.
     *
     * @param tableNumber the table number
     */
    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
    }
    
    /**
     * Sets the resolution status of the help request.
     *
     * @param resolved true if resolved, false otherwise
     */
    public void setResolved(boolean resolved) {
        this.resolved = resolved;
    }
    
    /**
     * Sets the timestamp when the request was made.
     *
     * @param requestTime the request timestamp
     */
    public void setRequestTime(LocalDateTime requestTime) {
        this.requestTime = requestTime;
    }
    
    /**
     * Sets the reason for the help request.
     *
     * @param reason the help request reason
     */
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    @Override
    public String toString() {
        return "HelpRequest [id=" + id + ", tableNumber=" + tableNumber 
            + ", resolved=" + resolved + ", requestTime=" + requestTime 
            + ", reason=" + reason + "]"; 
    }
}