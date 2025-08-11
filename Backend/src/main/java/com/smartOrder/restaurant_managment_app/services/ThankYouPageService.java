package com.smartOrder.restaurant_managment_app.services;

import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import com.smartOrder.restaurant_managment_app.repository.ThankYouContentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ThankYouPageService {

    private static final Logger logger = LoggerFactory.getLogger(ThankYouPageService.class);
    private final ThankYouContentRepository repository;

    public ThankYouPageService(ThankYouContentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ThankYouContent findByRestaurantId(Long restaurantId) {
        return repository.findFirstByRestaurantIdOrderByIdDesc(restaurantId)
                .orElse(null);
    }

    @Transactional
    public ThankYouContent save(ThankYouContent content) {
        if (content.getRestaurant() == null || content.getRestaurant().getId() == null) {
            throw new IllegalArgumentException("Restaurant ID is required");
        }
        
        return repository.findFirstByRestaurantIdOrderByIdDesc(content.getRestaurant().getId())
                .map(existing -> {
                    existing.setTitle(content.getTitle());
                    existing.setSubtitle(content.getSubtitle());
                    existing.setGoogleReviewLink(content.getGoogleReviewLink());
                    existing.setWebsiteLink(content.getWebsiteLink());
                    existing.setBackgroundColor(content.getBackgroundColor());
                    existing.setTextColor(content.getTextColor());
                    existing.setButtonColor(content.getButtonColor());
                    return repository.save(existing);
                })
                .orElseGet(() -> repository.save(content));
    }

    @Transactional
    public ThankYouContent update(ThankYouContent content) {
        if (!repository.existsById(content.getId())) {
            throw new IllegalArgumentException("Content not found with ID: " + content.getId());
        }
        return repository.save(content);
    }
}