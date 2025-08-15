package com.smartOrder.restaurant_managment_app.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
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

/**
 * Main security configuration class that defines authentication and authorization rules.
 * Configures JWT authentication, CORS, CSRF protection, and endpoint security.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    /**
     * Constructs a new SecurityConfig with required dependencies.
     * @param jwtFilter JWT authentication filter
     */
    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    /**
     * Configures the security filter chain.
     * @param http HttpSecurity builder
     * @return Configured SecurityFilterChain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // ADMIN DASHBOARD SPECIFIC ENDPOINTS
                .requestMatchers(HttpMethod.GET, "/api/orders/daily/*").hasAnyAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/top-items/*").hasAnyAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/category-sales/*").hasAnyAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/refresh-stats/**").hasAnyAuthority("ROLE_ADMIN")

                // Public endpoints
                .requestMatchers("/api/employee/login").permitAll()
                .requestMatchers("/api/employee/verify-credentials").permitAll()

                // Other public endpoints
                .requestMatchers(
                    "/login",
                    "/register-admin/**",
                    "/api/auth/**",
                    "/uploads/**",
                    "/error",
                    "/api/menu/public",
                    "/ws/**",
                    "/api/tables/*/session-status",
                    "/api/orders/",
                    "/customerOrder/**",
                    "/thank-you/**",
                    "/topic/**",
                    "/app/**",
                    "/user/**",
                    "/api/orders/by-table/*",
                    "/api/thank-you",
                    "/api/thank-you/restaurant/**"
                ).permitAll()

                // KITCHEN DASHBOARD SPECIFIC ENDPOINTS
                .requestMatchers(HttpMethod.GET, "/api/orders/kitchen-queue").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/active").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/ready").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN", "ROLE_WAITER")
                .requestMatchers(HttpMethod.GET, "/api/orders/in-progress").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN")

                // ORDER ENDPOINTS
                .requestMatchers(HttpMethod.GET, "/api/orders/pending").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN", "ROLE_KITCHEN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/progress").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN", "ROLE_KITCHEN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/ready").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                
                // GENERAL ORDER ENDPOINTS
                .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN", "ROLE_WAITER")
                .requestMatchers(HttpMethod.GET, "/api/orders").hasAnyAuthority("ROLE_KITCHEN", "ROLE_ADMIN", "ROLE_WAITER")

                // Table endpoints
                .requestMatchers(HttpMethod.POST, "/api/tables/*/start-session").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tables/*/process-bill").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/tables/*/end-session").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/tables/active").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")

                // Help request endpoints
                .requestMatchers(HttpMethod.POST, "/api/help-requests").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/help-requests/all-active-request").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/help-requests/**").hasAnyAuthority("ROLE_WAITER", "ROLE_ADMIN")

                // Employee endpoints
                .requestMatchers("/api/employee/**").hasAnyAuthority("ROLE_WAITER", "ROLE_KITCHEN", "ROLE_ADMIN")

                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                // All other requests require authentication
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

    /**
     * Configures CORS settings for the application.
     * @return CorsConfigurationSource with allowed origins, methods, and headers
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://[::1]:*",
            "http://13.58.52.22:3000",
            "http://dine-flow.s3-website.us-east-2.amazonaws.com"
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

    /**
     * Provides the password encoder implementation.
     * @return BCryptPasswordEncoder with strength 12
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Provides the authentication manager.
     * @param config AuthenticationConfiguration
     * @return Configured AuthenticationManager
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    /**
     * Configures WebSecurity to ignore WebSocket endpoints.
     * @param web WebSecurity instance
     */
    public void configure(WebSecurity web) throws Exception {
        web.ignoring().requestMatchers("/ws/**", "/topic/**", "/app/**");
    }
}