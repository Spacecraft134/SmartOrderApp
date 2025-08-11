package com.smartOrder.restaurant_managment_app.Controllers;

import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import com.smartOrder.restaurant_managment_app.services.ThankYouPageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/thank-you-content")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ThankYouController {

    private static final Logger logger = LoggerFactory.getLogger(ThankYouController.class);
    private final ThankYouPageService thankYouPageService;

    public ThankYouController(ThankYouPageService thankYouPageService) {
        this.thankYouPageService = thankYouPageService;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ThankYouContent> getByRestaurant(
            @PathVariable Long restaurantId,
            HttpServletRequest request) {
        
        logger.info("Request received for restaurant ID: {} from IP: {}", 
                restaurantId, request.getRemoteAddr());
        
        ThankYouContent content = thankYouPageService.findByRestaurantId(restaurantId);
        
        if (content == null) {
            content = createDefaultThankYouPage(restaurantId);
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .header("Pragma", "no-cache")
                .body(content);
    }

    @PostMapping
    public ResponseEntity<ThankYouContent> save(@RequestBody ThankYouContent thankYouPage) {
        logger.info("Received POST request to save thank you page: {}", thankYouPage);
        
        try {
            ThankYouContent savedPage = thankYouPageService.save(thankYouPage);
            logger.info("Successfully saved thank you page with ID: {}", savedPage.getId());
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noCache())
                    .header("Pragma", "no-cache")
                    .body(savedPage);
        } catch (Exception e) {
            logger.error("Error saving thank you page", e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThankYouContent> update(
            @PathVariable Long id,
            @RequestBody ThankYouContent thankYouPage) {
        
        logger.info("Received PUT request to update thank you page with ID: {}", id);
        logger.info("Request body: {}", thankYouPage);

        if (!id.equals(thankYouPage.getId())) {
            logger.warn("ID mismatch in update request. Path ID: {}, Body ID: {}", id, thankYouPage.getId());
            return ResponseEntity.badRequest().build();
        }

        try {
            ThankYouContent updatedPage = thankYouPageService.update(thankYouPage);
            logger.info("Successfully updated thank you page with ID: {}", id);
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noCache())
                    .header("Pragma", "no-cache")
                    .body(updatedPage);
        } catch (Exception e) {
            logger.error("Error updating thank you page with ID: {}", id, e);
            throw e;
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
        return defaultPage;
    }
}