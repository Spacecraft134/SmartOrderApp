package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDate;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class BusyHours {
  @Id
  @GeneratedValue
  private Long id;
  private LocalDate date;
  private int hour;
  private int predictedHour;
  public BusyHours(Long id, LocalDate date, int hour, int predictedHour) {
    super();
    this.id = id;
    this.date = date;
    this.hour = hour;
    this.predictedHour = predictedHour;
  }
  public Long getId() {
    return id;
  }
  public LocalDate getDate() {
    return date;
  }
  public int getHour() {
    return hour;
  }
  public int getPredictedHour() {
    return predictedHour;
  }
  public void setId(Long id) {
    this.id = id;
  }
  public void setDate(LocalDate date) {
    this.date = date;
  }
  public void setHour(int hour) {
    this.hour = hour;
  }
  public void setPredictedHour(int predictedHour) {
    this.predictedHour = predictedHour;
  }
  
  

}
