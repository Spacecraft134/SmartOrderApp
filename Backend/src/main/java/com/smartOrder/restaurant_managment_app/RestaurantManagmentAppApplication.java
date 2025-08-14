package com.smartOrder.restaurant_managment_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Main application class for the Restaurant Management System.
 * Configures CORS settings, static resource handling, and enables scheduling.
 * 
 * @version 1.0
 */
@SpringBootApplication
@EnableScheduling
public class RestaurantManagmentAppApplication {

    /**
     * Main method to start the Spring Boot application.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(RestaurantManagmentAppApplication.class, args);
    }
    
    /**
     * Configures CORS (Cross-Origin Resource Sharing) settings.
     * Allows frontend application to communicate with the backend API.
     *
     * @return WebMvcConfigurer with CORS configuration
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173")
                        .allowedMethods("*")
                        .allowCredentials(true);
            }
        };
    }
    
    /**
     * Configuration class for web-related settings.
     * Handles static resource mapping for uploaded files.
     */
    @Configuration
    class WebConfig implements WebMvcConfigurer {
        
        /**
         * Configures resource handlers for serving uploaded files.
         * Maps /uploads/** URLs to the local uploads directory.
         *
         * @param registry the resource handler registry
         */
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations("file:uploads/");
        }
    }
}