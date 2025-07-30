package com.smartOrder.restaurant_managment_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EnableScheduling
public class RestaurantManagmentAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaurantManagmentAppApplication.class, args);
	}
	

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
	 
	 @Configuration
	 class WebConfig implements WebMvcConfigurer {
	     @Override
	     public void addResourceHandlers(ResourceHandlerRegistry registry) {
	         registry.addResourceHandler("/uploads/**")
	                 .addResourceLocations("file:uploads/");
	     }


}
}
