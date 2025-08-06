package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartOrder.restaurant_managment_app.Models.Users;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MenuItems {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double price;
    private String category;
    private String imageUrl;
    
    @Column(nullable = false)
    private boolean available = true;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private Users admin;
    
    public MenuItems() {}
    
    public MenuItems(String name, String description, double price, 
                   String category, String imageUrl, boolean available) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.imageUrl = imageUrl;
        this.available = available;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public Users getAdmin() {
        return admin;
    }

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