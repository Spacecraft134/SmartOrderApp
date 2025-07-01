
package com.smartOrder.restaurant_managment_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.HelpRequest;


public interface HelpRequestRepository extends JpaRepository<HelpRequest, Long> {
  List<HelpRequest> findByResolvedFalse();
}
