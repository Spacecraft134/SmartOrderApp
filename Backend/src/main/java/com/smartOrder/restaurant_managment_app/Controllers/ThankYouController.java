package com.smartOrder.restaurant_managment_app.Controllers;

import com.smartOrder.restaurant_managment_app.Models.Restaurant;
import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import com.smartOrder.restaurant_managment_app.services.ThankYouPageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/thank-you-content")
public class ThankYouController {

    private final ThankYouPageService thankYouPageService;

    public ThankYouController(ThankYouPageService thankYouPageService) {
        this.thankYouPageService = thankYouPageService;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ThankYouContent> getByRestaurant(@PathVariable Long restaurantId) {
        try {
            ThankYouContent thankYouPage = thankYouPageService.findByRestaurantId(restaurantId);
            if (thankYouPage != null) {
                return ResponseEntity.ok(thankYouPage);
            } else {
                return ResponseEntity.ok(createDefaultThankYouPage(restaurantId));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<ThankYouContent> save(@RequestBody ThankYouContent thankYouPage) {
        try {
            ThankYouContent savedPage = thankYouPageService.save(thankYouPage);
            return ResponseEntity.ok(savedPage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThankYouContent> update(
            @PathVariable Long id,
            @RequestBody ThankYouContent thankYouPage
    ) {
        try {
            if (!id.equals(thankYouPage.getId())) {
                return ResponseEntity.badRequest().build();
            }
            
            ThankYouContent updatedPage = thankYouPageService.update(thankYouPage);
            return ResponseEntity.ok(updatedPage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private ThankYouContent createDefaultThankYouPage(Long restaurantId) {
        ThankYouContent defaultPage = new ThankYouContent();
        defaultPage.setTitle("Thanks for dining with us!");
        defaultPage.setSubtitle("We hope you enjoyed your meal and experience.");
        defaultPage.setGoogleReviewLink("https://www.google.com/maps");
        defaultPage.setWebsiteLink("/");
        defaultPage.setBackgroundColor("from-gray-50 to-gray-100");
        defaultPage.setTextColor("text-gray-800");
        defaultPage.setButtonColor("from-blue-600 to-indigo-700");
        
        Restaurant restaurant = new Restaurant();
        restaurant.setId(restaurantId);  // This must match the type in Restaurant class
        defaultPage.setRestaurant(restaurant);
        
        return defaultPage;
    }
}