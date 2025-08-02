package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class TableSession {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @Column(unique = true)
  private String tableNumber;
  
  private boolean sessionActive = true;
  private boolean billProcessed= false;


  public String getTableNumber() {
    return tableNumber;
  }

  public boolean isSessionActive() {
    return sessionActive;
  }

  public void setTableNumber(String tableNumber) {
    this.tableNumber = tableNumber;
  }

  public void setSessionActive(boolean sessionActive) {
    this.sessionActive = sessionActive;
  }

  public boolean isBillProcessed() {
    return billProcessed;
  }

  public void setBillProcessed(boolean billProcessed) {
    this.billProcessed = billProcessed;
  }

  @Override
  public String toString() {
    return "TableSession [id=" + id + ", tableNumber=" + tableNumber + ", sessionActive="
        + sessionActive + ", billProcessed=" + billProcessed + "]";
  }
}
