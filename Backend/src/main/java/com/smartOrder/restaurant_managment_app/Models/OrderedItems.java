package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.jackson.annotation.JsonBackReference;

/**
 * Entity representing an individual item within an order.
 * Links a menu item to an order with quantity and special instructions.
 * 
 */
@Entity
public class OrderedItems {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** The quantity of this menu item ordered */
    private int quantity;
    
    /** Special instructions for preparing this item */
    private String instructions;
    
    /** The menu item that was ordered */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id")
    private MenuItems menuItem;
    
    /** The order this item belongs to */
    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    /**
     * Gets the unique identifier of the ordered item.
     *
     * @return the ordered item ID
     */
    public long getId() {
        return id;
    }
    
    /**
     * Gets the menu item that was ordered.
     *
     * @return the menu item
     */
    public MenuItems getMenuItem() {
        return menuItem;
    }
    
    /**
     * Gets the quantity of this item ordered.
     *
     * @return the quantity
     */
    public int getQuantity() {
        return quantity;
    }
    
    /**
     * Gets the special instructions for this item.
     *
     * @return the instructions
     */
    public String getInstructions() {
        return instructions;
    }
    
    /**
     * Gets the order this item belongs to.
     *
     * @return the order
     */
    public Order getOrder() {
        return order;
    }
    
    /**
     * Sets the unique identifier of the ordered item.
     *
     * @param id the ordered item ID
     */
    public void setId(long id) {
        this.id = id;
    }
    
    /**
     * Sets the menu item that was ordered.
     *
     * @param menuItems the menu item
     */
    public void setMenuItem(MenuItems menuItems) {
        this.menuItem = menuItems;
    }
    
    /**
     * Sets the quantity of this item ordered.
     *
     * @param quantity the quantity
     */
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
    
    /**
     * Sets the special instructions for this item.
     *
     * @param instructions the instructions
     */
    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
    
    /**
     * Sets the order this item belongs to.
     *
     * @param order the order
     */
    public void setOrder(Order order) {
        this.order = order;
    }
    
    @Override
    public String toString() {
        return "OrderedItems [id=" + id + ", menuItem=" + menuItem + ", quantity=" + quantity +
               ", instructions=" + instructions + "]";
    }
}