package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
public class OrderedItems {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;
    private String instructions;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id")
    private MenuItems menuItem;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;


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
