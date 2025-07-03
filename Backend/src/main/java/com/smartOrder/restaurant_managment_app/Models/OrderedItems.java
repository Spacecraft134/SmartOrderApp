package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class OrderedItems {
  @Id
  @GeneratedValue
  private long id;

  @ManyToOne
  @JoinColumn(name = "menu_item_id")
  private MenuItems menuItem;

  private int quantity;

  private String instructions;

  @ManyToOne
  @JoinColumn(name = "order_id")
  @JsonBackReference
  private Order order;

  // Getters and setters

  public long getId() {
    return id;
  }

  public MenuItems getMenuItem() {
    return menuItem;
  }

  public int getQuantity() {
    return quantity;
  }

  public String getInstructions() {
    return instructions;
  }

  public Order getOrder() {
    return order;
  }

  public void setId(long id) {
    this.id = id;
  }

  public void setMenuItem(MenuItems menuItems) {
    this.menuItem = menuItems;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  public void setInstructions(String instructions) {
    this.instructions = instructions;
  }

  public void setOrder(Order order) {
    this.order = order;
  }

  @Override
  public String toString() {
    return "OrderedItems [id=" + id + ", menuItem=" + menuItem + ", quantity=" + quantity +
           ", instructions=" + instructions + "]";
  }
}
