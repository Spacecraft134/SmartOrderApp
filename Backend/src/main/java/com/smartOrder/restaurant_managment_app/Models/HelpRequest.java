
package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDateTime;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class HelpRequest {
  
  @Id
  @GeneratedValue
  private Long id;
  private String tableNumber;
  private boolean resolved;
  private LocalDateTime requestTime;
  private String reason;
  
  public HelpRequest() {
    this.requestTime = LocalDateTime.now();
    this.resolved = false;
    this.reason = "Need assistance";
  }

  public Long getId() {
    return id;
  }

  public String getTableNumber() {
    return tableNumber;
  }

 
  public boolean isResolved() {
    return resolved;
  }

  public LocalDateTime getRequestTime() {
    return requestTime;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setTableNumber(String tableNumber) {
    this.tableNumber = tableNumber;
  }

 
  public void setResolved(boolean resolved) {
    this.resolved = resolved;
  }

  public void setRequestTime(LocalDateTime requestTime) {
    this.requestTime = requestTime;
  }

  public String getReason() {
    return reason;
  }

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