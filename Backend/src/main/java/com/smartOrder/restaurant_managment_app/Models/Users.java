package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_password")
public class Users {
  @Id
  private int id;
  private String username;
  private String password;
  @Enumerated(EnumType.STRING)
  private Role role;
  
  public enum Role{
    GUEST, WAITER, KITCHEN, ADMIN
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
  public void setId(int id) {
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
  @Override
  public String toString() {
    return "Users [id=" + id + ", username=" + username + ", password=" + password + ", role="
        + role + "]";
  }
  
}
