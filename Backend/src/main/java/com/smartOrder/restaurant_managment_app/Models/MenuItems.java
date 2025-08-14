package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Entity representing a menu item in the restaurant system.
 * Contains item details, pricing, availability status,
 * and relationship to the admin who created it.
 * 
 */
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "admin"})
public class MenuItems {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** The name of the menu item */
    private String name;
    
    /** A description of the menu item */
    private String description;
    
    /** The price of the menu item */
    private double price;
    
    /** The category this item belongs to (e.g., appetizer, main course) */
    private String category;
    
    /** URL path to the item's image */
    private String imageUrl;
    
    /** Whether the item is currently available for ordering */
    @Column(nullable = false)
    private boolean available = true;
    
    /** The admin user who created this menu item */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @JsonIgnore
    private Users admin;
    
    /**
     * Default constructor.
     */
    public MenuItems() {}
    
    /**
     * Constructs a MenuItems with all properties except admin.
     *
     * @param name the item name
     * @param description the item description
     * @param price the item price
     * @param category the item category
     * @param imageUrl the image URL
     * @param available the availability status
     */
    public MenuItems(String name, String description, double price, 
                   String category, String imageUrl, boolean available) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.imageUrl = imageUrl;
        this.available = available;
    }
    
    /**
     * Gets the unique identifier of the menu item.
     *
     * @return the menu item ID
     */
    public Long getId() {
        return id;
    }
    
    /**
     * Sets the unique identifier of the menu item.
     *
     * @param id the menu item ID
     */
    public void setId(Long id) {
        this.id = id;
    }
    
    /**
     * Gets the name of the menu item.
     *
     * @return the item name
     */
    public String getName() {
        return name;
    }
    
    /**
     * Sets the name of the menu item.
     *
     * @param name the item name
     */
    public void setName(String name) {
        this.name = name;
    }
    
    /**
     * Gets the description of the menu item.
     *
     * @return the item description
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the description of the menu item.
     *
     * @param description the item description
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Gets the price of the menu item.
     *
     * @return the item price
     */
    public double getPrice() {
        return price;
    }
    
    /**
     * Sets the price of the menu item.
     *
     * @param price the item price
     */
    public void setPrice(double price) {
        this.price = price;
    }
    
    /**
     * Gets the category of the menu item.
     *
     * @return the item category
     */
    public String getCategory() {
        return category;
    }
    
    /**
     * Sets the category of the menu item.
     *
     * @param category the item category
     */
    public void setCategory(String category) {
        this.category = category;
    }
    
    /**
     * Gets the image URL of the menu item.
     *
     * @return the image URL
     */
    public String getImageUrl() {
        return imageUrl;
    }
    
    /**
     * Sets the image URL of the menu item.
     *
     * @param imageUrl the image URL
     */
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    /**
     * Checks if the menu item is available for ordering.
     *
     * @return true if available, false otherwise
     */
    public boolean isAvailable() {
        return available;
    }
    
    /**
     * Sets the availability status of the menu item.
     *
     * @param available true if available, false otherwise
     */
    public void setAvailable(boolean available) {
        this.available = available;
    }
    
    /**
     * Gets the admin user who created this menu item.
     *
     * @return the admin user
     */
    public Users getAdmin() {
        return admin;
    }
    
    /**
     * Sets the admin user who created this menu item.
     *
     * @param admin the admin user
     */
    public void setAdmin(Users admin) {
        this.admin = admin;
    }
    
    @Override
    public String toString() {
        return "MenuItems{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", price=" + price +
                ", category='" + category + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                ", available=" + available +
                '}';
    }
}