package com.smartOrder.restaurant_managment_app.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class JWTService {
    private final SecretKey key;

    public JWTService() {
        // Generate a 256-bit (32-byte) secure key
        this.key = Jwts.SIG.HS256.key().build();
    }

    public String generateToken(UserDetails userDetails) {
      Map<String, Object> claims = new HashMap<>();
      claims.put("roles", userDetails.getAuthorities().stream()
              .map(GrantedAuthority::getAuthority)
              .collect(Collectors.toList()));
      
      return Jwts.builder()
              .claims(claims)
              .subject(userDetails.getUsername())
              .issuedAt(new Date())
              .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
              .signWith(key)
              .compact();
  }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}