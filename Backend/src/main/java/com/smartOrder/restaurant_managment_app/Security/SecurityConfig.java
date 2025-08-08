package com.smartOrder.restaurant_managment_app.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(
                    "/login",
                    "/register",
                    "/register-admin/**",
                    "/api/auth/**",
                    "/uploads/**",
                    "/error",
                    "/api/employee/login",
                    "/api/menu/public",
                    "/ws/**",
                    "/api/tables/*/session-status",  
                    "/api/orders/by-table/*",       
                    "/customerOrder/**",            
                    "/thank-you/**"                
                ).permitAll()
                
                // Table endpoints
                .requestMatchers(HttpMethod.POST, "/api/tables/*/start-session").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tables/*/process-bill").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/tables/*/end-session").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/tables/active").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                
                // Help request endpoints
                .requestMatchers(HttpMethod.POST, "/api/help-requests").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/help-requests/all-active-request").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/help-requests/**").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                
                // Order endpoints
                .requestMatchers(HttpMethod.GET, "/api/orders/pending").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/**/progress").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/orders").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                
                // Kitchen endpoints
                .requestMatchers(HttpMethod.GET, "/api/orders").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN", "ROLE_WAITER")
                
                // Employee endpoints
                .requestMatchers("/api/employee/**").hasAnyAuthority("ROLE_WAITER", "ROLE_KITCHEN")
                
                // Fallback - any other request needs authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
                })
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://[::1]:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}