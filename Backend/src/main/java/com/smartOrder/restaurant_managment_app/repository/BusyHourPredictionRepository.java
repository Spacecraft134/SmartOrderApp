package com.smartOrder.restaurant_managment_app.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.BusyHours;

public interface BusyHourPredictionRepository extends JpaRepository<BusyHours, Long> {
  
  List<BusyHours> findByDate(LocalDate date);

}
