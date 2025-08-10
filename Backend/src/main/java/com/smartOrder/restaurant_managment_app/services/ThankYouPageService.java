package com.smartOrder.restaurant_managment_app.services;

import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import com.smartOrder.restaurant_managment_app.repository.ThankYouContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThankYouPageService {

    private final ThankYouContentRepository thankYouPageRepository;

    @Autowired
    public ThankYouPageService(ThankYouContentRepository thankYouPageRepository) {
        this.thankYouPageRepository = thankYouPageRepository;
    }

    public ThankYouContent findByRestaurantId(Long restaurantId) {
        return thankYouPageRepository.findByRestaurantId(restaurantId);
    }

    @Transactional
    public ThankYouContent save(ThankYouContent thankYouPage) {
        return thankYouPageRepository.save(thankYouPage);
    }

    @Transactional
    public ThankYouContent update(ThankYouContent thankYouPage) {
        if (!thankYouPageRepository.existsById(thankYouPage.getId())) {
            throw new RuntimeException("Thank you page not found");
        }
        return thankYouPageRepository.save(thankYouPage);
    }

    public boolean existsById(Long id) {
        return thankYouPageRepository.existsById(id);
    }
}