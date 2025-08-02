package com.smartOrder.restaurant_managment_app.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartOrder.restaurant_managment_app.Models.ThankYouContent;
import com.smartOrder.restaurant_managment_app.repository.ThankYouContentRepository;

@RestController
@RequestMapping("/api/thank-you-content")
public class ThankYouController {

    @Autowired
    private ThankYouContentRepository contentRepository;

    @GetMapping
    public ResponseEntity<ThankYouContent> getContent() {
        ThankYouContent content = contentRepository.findById(1L)
            .orElseGet(() -> {
                ThankYouContent defaultContent = new ThankYouContent();
                defaultContent.setId(1L);
                return contentRepository.save(defaultContent);
            });
        return ResponseEntity.ok(content);
    }

    @PostMapping
    public ResponseEntity<?> saveContent(@RequestBody ThankYouContent content) {
        content.setId(1L);
        contentRepository.save(content);
        return ResponseEntity.ok().build();
    }
}