package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "user_password")
public class Users {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY) 
  private Integer  id;
  private String username;
  private String password;
  @Enumerated(EnumType.STRING)
  private Role role = Role.GUEST;
  
  public enum Role{
    GUEST, WAITER, KITCHEN, ADMIN
  }
  
  private String name;
  
  @Column(nullable = false)
  private boolean active = false;

  @CreationTimestamp
  private LocalDateTime createdAt;

  @UpdateTimestamp
  private LocalDateTime updatedAt;
  

  @Transient // This field won't be persisted in the database
  private String restaurantName;
  
  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }
  public int getId() {
    return id;
  }
  public String getUsername() {
    return username;
  }
  public String getPassword() {
    return password;
  }
  public void setId(Integer  id) {
    this.id = id;
  }
  public void setUsername(String username) {
    this.username = username;
  }
  public void setPassword(String password) {
    this.password = password;
  }
  
  public Role getRole() {
    return role;
  }
  public void setRole(Role role) {
    this.role = role;
  }
  public boolean isActive() {
    return active;
  }
  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }
  public void setActive(boolean active) {
    this.active = active;
  }
  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
  
  @Column(name = "restaurant_id", nullable = false)
  private Integer restaurantId; 
  
  
  public Integer getRestaurantId() {
    return restaurantId;
  }
  public void setRestaurantId(Integer restaurantId) {
    this.restaurantId = restaurantId;
  }
  
  public String getRestaurantName() {
    return restaurantName;
}

public void setRestaurantName(String restaurantName) {
    this.restaurantName = restaurantName;
}
  
  @Override
  public String toString() {
    return "Users [id=" + id + ", username=" + username + ", password=" + password + ", role="
        + role + ", name=" + name + ", active=" + active + ", createdAt=" + createdAt
        + ", updatedAt=" + updatedAt + "]";
  }
}
