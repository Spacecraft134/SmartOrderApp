package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Represents a restaurant entity in the system.
 * Stores basic information about a restaurant including its unique identifier,
 * name, code, and creation timestamp.
 */
@Entity
@Table(name = "restaurants")
public class Restaurant {
    
    /**
     * Unique identifier for the restaurant.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Name of the restaurant. Cannot be null.
     */
    @Column(nullable = false)
    private String name;
    
    /**
     * Unique code identifier for the restaurant. Cannot be null and must be unique.
     */
    @Column(nullable = false, unique = true)
    private String code;
    
    /**
     * Timestamp when the restaurant record was created.
     * Automatically set by Hibernate when the entity is persisted.
     */
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    /**
     * Gets the restaurant's unique identifier.
     * @return the restaurant ID
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the restaurant's unique identifier.
     * @param id the ID to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the restaurant's name.
     * @return the restaurant name
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the restaurant's name.
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the restaurant's unique code.
     * @return the restaurant code
     */
    public String getCode() {
        return code;
    }

    /**
     * Sets the restaurant's unique code.
     * @param code the code to set
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * Gets the creation timestamp of the restaurant record.
     * @return the creation timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Sets the creation timestamp of the restaurant record.
     * @param createdAt the timestamp to set
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}