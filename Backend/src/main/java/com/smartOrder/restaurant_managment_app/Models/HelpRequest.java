
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
  private String requestNote;
  private boolean active;
  private LocalDateTime requestTime;
  
  public HelpRequest() {
    this.requestTime = LocalDateTime.now();
    this.active = false;
  }

  public Long getId() {
    return id;
  }

  public String getTableNumber() {
    return tableNumber;
  }

  public String getRequestNote() {
    return requestNote;
  }

  public boolean isResolved() {
    return active;
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

  public void setRequestNote(String requestNote) {
    this.requestNote = requestNote;
  }

  public void setResolved(boolean resolved) {
    this.active = resolved;
  }

  public void setRequestTime(LocalDateTime requestTime) {
    this.requestTime = requestTime;
  }

  @Override
  public String toString() {
    return "HelpRequest [id=" + id + ", tableNumber=" + tableNumber + ", requestNote=" + requestNote
        + ", resolved=" + active + ", requestTime=" + requestTime + "]";
  }
  
  
}