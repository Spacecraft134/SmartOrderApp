package com.smartOrder.restaurant_managment_app.repository;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.Stats;

public interface StatsSummaryRepository extends JpaRepository<Stats, Long>{
  Optional<Stats> findByDate(LocalDate date);
}
