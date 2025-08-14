package com.smartOrder.restaurant_managment_app.Models;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonManagedReference;

/**
 * Entity representing a customer order.
 * Contains order details, status tracking, timing information,
 * and the list of ordered items.
 */
@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue
    private long id;
    
    /** The table number where the order was placed */
    private String tableNumber;
    
    /** When the order was placed */
    private LocalDateTime time;
    
    /** Current status of the order (e.g., WAITING_FOR_CONFIRMATION, IN_PROGRESS, READY, COMPLETED) */
    private String statusOfOrder;
    
    /** When the order was marked as ready */
    private LocalDateTime readyTime;
    
    /** List of items in this order */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<OrderedItems> items;
    
    /** Total amount for the order in cents */
    private Long totalAmount;
    
    /** Time taken to prepare the order in minutes */
    private Double preparationTime;
    
    /**
     * Default constructor.
     */
    public Order() {}
    
    /**
     * Gets the unique identifier of the order.
     *
     * @return the order ID
     */
    public long getId() { 
        return id; 
    }
    
    /**
     * Gets the table number where the order was placed.
     *
     * @return the table number
     */
    public String getTableNumber() { 
        return tableNumber; 
    }
    
    /**
     * Gets the timestamp when the order was placed.
     *
     * @return the order timestamp
     */
    public LocalDateTime getTime() { 
        return time; 
    }
    
    /**
     * Gets the current status of the order.
     *
     * @return the order status
     */
    public String getStatusOfOrder() { 
        return statusOfOrder; 
    }
    
    /**
     * Gets the list of items in this order.
     *
     * @return the ordered items
     */
    public List<OrderedItems> getItems() { 
        return items; 
    }
    
    /**
     * Gets the timestamp when the order was marked as ready.
     *
     * @return the ready timestamp
     */
    public LocalDateTime getReadyTime() { 
        return readyTime; 
    }
    
    /**
     * Gets the total amount for the order.
     *
     * @return the total amount in cents
     */
    public Long getTotalAmount() {
        return totalAmount;
    }
    
    /**
     * Gets the preparation time for the order.
     *
     * @return the preparation time in minutes
     */
    public Double getPreparationTime() {
        return preparationTime;
    }
    
    /**
     * Sets the unique identifier of the order.
     *
     * @param id the order ID
     */
    public void setId(long id) { 
        this.id = id; 
    }
    
    /**
     * Sets the table number where the order was placed.
     *
     * @param tableNumber the table number
     */
    public void setTableNumber(String tableNumber) { 
        this.tableNumber = tableNumber; 
    }
    
    /**
     * Sets the timestamp when the order was placed.
     *
     * @param time the order timestamp
     */
    public void setTime(LocalDateTime time) { 
        this.time = time; 
    }
    
    /**
     * Sets the current status of the order.
     *
     * @param statusOfOrder the order status
     */
    public void setStatusOfOrder(String statusOfOrder) { 
        this.statusOfOrder = statusOfOrder; 
    }
    
    /**
     * Sets the list of items in this order.
     *
     * @param items the ordered items
     */
    public void setItems(List<OrderedItems> items) { 
        this.items = items; 
    }
    
    /**
     * Sets the timestamp when the order was marked as ready.
     *
     * @param readyTime the ready timestamp
     */
    public void setReadyTime(LocalDateTime readyTime) { 
        this.readyTime = readyTime; 
    }
    
    /**
     * Sets the total amount for the order.
     *
     * @param totalAmount the total amount in cents
     */
    public void setTotalAmount(Long totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    /**
     * Sets the preparation time for the order.
     *
     * @param preparationTime the preparation time in minutes
     */
    public void setPreparationTime(Double preparationTime) {
        this.preparationTime = preparationTime;
    }
    
    @Override
    public String toString() {
        return "Order [id=" + id + ", tableNumber=" + tableNumber + ", time=" + time
            + ", statusOfOrder=" + statusOfOrder + ", items=" + items + "]";
    }
}