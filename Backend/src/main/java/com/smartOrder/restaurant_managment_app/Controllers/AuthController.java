package com.smartOrder.restaurant_managment_app.Controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken() {
        return ResponseEntity.ok().build();
    }
}