package com.smartOrder.restaurant_managment_app.services;

import com.smartOrder.restaurant_managment_app.Models.UserPrinciple;
import com.smartOrder.restaurant_managment_app.Models.Users;
import com.smartOrder.restaurant_managment_app.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) {
        Users user = userRepo.findByUsername(username);
        if (user == null) throw new UsernameNotFoundException("User not found");
        return new UserPrinciple(user);
    }
}
