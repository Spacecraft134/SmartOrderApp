package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class OrderedItems {
  @Id
  @GeneratedValue
  private long id;
  
  @ManyToOne
  private MenuItems menuItems;
  
  private int quantity;
  
  public OrderedItems() {
    
  }

  public long getId() {
    return id;
  }

  public MenuItems getMenuItems() {
    return menuItems;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setId(long id) {
    this.id = id;
  }

  public void setMenuItems(MenuItems menuItems) {
    this.menuItems = menuItems;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  @Override
  public String toString() {
    return "OrderedItems [id=" + id + ", menuItems=" + menuItems + ", quantity=" + quantity + "]";
  }
  
  
  
}
