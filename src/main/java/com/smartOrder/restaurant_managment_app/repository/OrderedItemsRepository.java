package com.smartOrder.restaurant_managment_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartOrder.restaurant_managment_app.Models.OrderedItems;

public interface OrderedItemsRepository extends JpaRepository<OrderedItems, Long> {

}
