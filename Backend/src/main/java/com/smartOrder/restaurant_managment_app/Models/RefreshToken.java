package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a refresh token for JWT authentication.
 * Used to generate new access tokens without requiring re-authentication.
 * 
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The unique refresh token string */
    @Column(nullable = false, unique = true)
    private String token;

    /** The ID of the user this token belongs to */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** When this token expires */
    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    /** When this token was created */
    @Column(name = "created_date")
    private Instant createdDate = Instant.now();

    /**
     * Default constructor.
     */
    public RefreshToken() {}

    /**
     * Constructs a RefreshToken with specified values.
     *
     * @param token the refresh token string
     * @param userId the user ID this token belongs to
     * @param expiryDate when the token expires
     */
    public RefreshToken(String token, Integer userId, Instant expiryDate) {
        this.token = token;
        this.userId = userId;
        this.expiryDate = expiryDate;
    }

    /**
     * Gets the unique identifier of the refresh token.
     *
     * @return the token ID
     */
    public Long getId() { 
        return id; 
    }
    
    /**
     * Sets the unique identifier of the refresh token.
     *
     * @param id the token ID
     */
    public void setId(Long id) { 
        this.id = id; 
    }

    /**
     * Gets the refresh token string.
     *
     * @return the token string
     */
    public String getToken() { 
        return token; 
    }
    
    /**
     * Sets the refresh token string.
     *
     * @param token the token string
     */
    public void setToken(String token) { 
        this.token = token; 
    }

    /**
     * Gets the user ID this token belongs to.
     *
     * @return the user ID
     */
    public Integer getUserId() { 
        return userId; 
    }
    
    /**
     * Sets the user ID this token belongs to.
     *
     * @param userId the user ID
     */
    public void setUserId(Integer userId) { 
        this.userId = userId; 
    }

    /**
     * Gets when this token expires.
     *
     * @return the expiry date
     */
    public Instant getExpiryDate() { 
        return expiryDate; 
    }
    
    /**
     * Sets when this token expires.
     *
     * @param expiryDate the expiry date
     */
    public void setExpiryDate(Instant expiryDate) { 
        this.expiryDate = expiryDate; 
    }

    /**
     * Gets when this token was created.
     *
     * @return the creation date
     */
    public Instant getCreatedDate() { 
        return createdDate; 
    }
    
    /**
     * Sets when this token was created.
     *
     * @param createdDate the creation date
     */
    public void setCreatedDate(Instant createdDate) { 
        this.createdDate = createdDate; 
    }

    /**
     * Checks if this refresh token has expired.
     *
     * @return true if expired, false otherwise
     */
    public boolean isExpired() {
        return Instant.now().isAfter(this.expiryDate);
    }
}