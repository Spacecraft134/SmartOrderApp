package com.smartOrder.restaurant_managment_app.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.smartOrder.restaurant_managment_app.services.JWTService;
import com.smartOrder.restaurant_managment_app.services.MyUserDetailsService;
import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JWTService jwtService;
    private final MyUserDetailsService userDetailsService;

    public JwtFilter(JWTService jwtService, MyUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        final String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            final String token = header.substring(7);
            final String username = jwtService.extractUserName(token);
            
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                // Add this debug log
                System.out.println("Validating token for: " + username + 
                    " | Roles: " + userDetails.getAuthorities());
                
                if (jwtService.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            // Add detailed error logging
            System.err.println("JWT Validation Error: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid token");
            return;
        }
        chain.doFilter(request, response);
    }
}