package com.smartOrder.restaurant_managment_app.Controllers;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    
    @GetMapping("/check-auth")
    public String checkAuth(Authentication authentication) {
        return "Current auth: " + authentication.getName() + 
               " | Roles: " + authentication.getAuthorities();
    }
}