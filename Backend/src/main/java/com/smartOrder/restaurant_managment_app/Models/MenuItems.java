package com.smartOrder.restaurant_managment_app.Models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MenuItems {
    
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;


    private String name;
    private String description;
    private double price;
    private String category;
    private String imageUrl;
    @Column(nullable = false)
    private boolean available = true;
  
  public MenuItems() {
    
  }
  
  public MenuItems(long id, String name, String description, double price, String category, String imageUrl, boolean available) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.imageUrl = imageUrl;
    this.available = available;
  }

  public long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public double getPrice() {
    return price;
  }

  public String getCategory() {
    return category;
  }

  public void setId(long id) {
    this.id = id;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public void setPrice(double price) {
    this.price = price;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public boolean isAvailable() {
    return available;
  }

  public void setAvailable(boolean available) {
    this.available = available;
  }

  @Override
  public String toString() {
    return "MenuItems [name=" + name + ", description=" + description + ", price=" + price
        + ", category=" + category + ", imageUrl=" + imageUrl + ", available=" + available + "]";
  }

 

  
  
}
