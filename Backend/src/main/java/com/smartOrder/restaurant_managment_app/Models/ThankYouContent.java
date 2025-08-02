package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ThankYouContent {
    @Id
    private Long id = 1L; 
    
    private String title;
    private String subtitle;
    private String shareTitle;
    private String googleReviewText;
    private String socialMediaText;
    private String returnText;
    private String websiteButtonText;
    
    public Long getId() {
      return id;
    }
    public void setId(Long id) {
      this.id = id;
    }
    public String getTitle() {
      return title;
    }
    public String getSubtitle() {
      return subtitle;
    }
    public String getShareTitle() {
      return shareTitle;
    }
    public String getGoogleReviewText() {
      return googleReviewText;
    }
    public String getSocialMediaText() {
      return socialMediaText;
    }
    public String getReturnText() {
      return returnText;
    }
    public String getWebsiteButtonText() {
      return websiteButtonText;
    }
    public void setTitle(String title) {
      this.title = title;
    }
    public void setSubtitle(String subtitle) {
      this.subtitle = subtitle;
    }
    public void setShareTitle(String shareTitle) {
      this.shareTitle = shareTitle;
    }
    public void setGoogleReviewText(String googleReviewText) {
      this.googleReviewText = googleReviewText;
    }
    public void setSocialMediaText(String socialMediaText) {
      this.socialMediaText = socialMediaText;
    }
    public void setReturnText(String returnText) {
      this.returnText = returnText;
    }
    public void setWebsiteButtonText(String websiteButtonText) {
      this.websiteButtonText = websiteButtonText;
    }
    @Override
    public String toString() {
      return "ThankYouContent [id=" + id + ", title=" + title + ", subtitle=" + subtitle
          + ", shareTitle=" + shareTitle + ", googleReviewText=" + googleReviewText
          + ", socialMediaText=" + socialMediaText + ", returnText=" + returnText
          + ", websiteButtonText=" + websiteButtonText + "]";
    }
}