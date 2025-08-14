package com.smartOrder.restaurant_managment_app.Models;

import java.util.Collection;
import java.util.Collections;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Custom UserDetails implementation for Spring Security authentication.
 * Wraps the Users entity and provides security-related information.
 */
public class UserPrinciple implements UserDetails {
    private Users user;
    
    /**
     * Constructs a new UserPrinciple with the given Users entity.
     */
    public UserPrinciple(Users user) {
        this.user = user;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "GUEST");
        return Collections.singletonList(new SimpleGrantedAuthority(role));
    }
    
    @Override
    public String getPassword() { return user.getPassword(); }
    
    @Override
    public String getUsername() { return user.getUsername(); }
    
    @Override
    public boolean isAccountNonExpired() { return true; }
    
    @Override
    public boolean isAccountNonLocked() { return true; }
    
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    
    @Override
    public boolean isEnabled() { return user.isActive(); }
}