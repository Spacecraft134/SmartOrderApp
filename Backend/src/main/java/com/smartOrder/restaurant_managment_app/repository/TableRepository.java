package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.TableSession;

public interface TableRepository extends JpaRepository<TableSession, Long>  {

  Optional<TableSession> findByTableNumber(String tableNumber);
  List< TableSession> findBySessionActiveTrue();
}
