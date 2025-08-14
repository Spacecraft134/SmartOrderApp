package com.smartOrder.restaurant_managment_app.repository;

import com.smartOrder.restaurant_managment_app.Models.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository interface for managing RefreshToken entities.
 * Provides methods for token management and cleanup.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    /**
     * Finds a refresh token by token string.
     * @param token The token string to search for
     * @return Optional containing the RefreshToken if found
     */
    Optional<RefreshToken> findByToken(String token);
    
    /**
     * Finds a refresh token by user ID.
     * @param userId The user ID to search for
     * @return Optional containing the RefreshToken if found
     */
    Optional<RefreshToken> findByUserId(Integer userId);
    
    /**
     * Deletes all refresh tokens for a specific user.
     * @param userId The user ID whose tokens should be deleted
     */
    @Modifying
    @Transactional
    void deleteByUserId(Integer userId);
    
    /**
     * Deletes all expired refresh tokens.
     * @param now The current instant to compare expiry dates against
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiryDate < :now")
    void deleteAllExpiredTokens(Instant now);
}