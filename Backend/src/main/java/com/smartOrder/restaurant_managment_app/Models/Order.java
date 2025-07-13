package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "orders")
public class Order {
  @Id
  @GeneratedValue
  private long id;
  
  private String tableNumber;
  private LocalDateTime time;
  private String statusOfOrder;
  private LocalDateTime readyTime; 
  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
  @JsonManagedReference
  private List<OrderedItems> items;

  public Order() {}

  // Getters and setters
  public long getId() { return id; }
  public String getTableNumber() { return tableNumber; }
  public LocalDateTime getTime() { return time; }
  public String getStatusOfOrder() { return statusOfOrder; }
  public List<OrderedItems> getItems() { return items; }
  public LocalDateTime getReadyTime() { return readyTime; }
  

  public void setId(long id) { this.id = id; }
  public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
  public void setTime(LocalDateTime time) { this.time = time; }
  public void setStatusOfOrder(String statusOfOrder) { this.statusOfOrder = statusOfOrder; }
  public void setItems(List<OrderedItems> items) { this.items = items; }
  public void setReadyTime(LocalDateTime readyTime) { this.readyTime = readyTime; }
 

  @Override
  public String toString() {
    return "Order [id=" + id + ", tableNumber=" + tableNumber + ", time=" + time
        + ", statusOfOrder=" + statusOfOrder + ", items=" + items + "]";
  }
}
