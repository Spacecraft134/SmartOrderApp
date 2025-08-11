package com.smartOrder.restaurant_managment_app.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "thank_you_content", 
uniqueConstraints = @UniqueConstraint(columnNames = "restaurant_id"))
public class ThankYouContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
    
    private String title;
    private String subtitle;
    private String googleReviewLink;
    private String websiteLink;
    private String backgroundColor;
    private String textColor;
    private String buttonColor;
    public Long getId() {
      return id;
    }
    public Restaurant getRestaurant() {
      return restaurant;
    }
    public String getTitle() {
      return title;
    }
    public String getSubtitle() {
      return subtitle;
    }
    public String getGoogleReviewLink() {
      return googleReviewLink;
    }
    public String getWebsiteLink() {
      return websiteLink;
    }
    public String getBackgroundColor() {
      return backgroundColor;
    }
    public String getTextColor() {
      return textColor;
    }
    public String getButtonColor() {
      return buttonColor;
    }
    public void setId(Long id) {
      this.id = id;
    }
    public void setRestaurant(Restaurant restaurant) {
      this.restaurant = restaurant;
    }
    public void setTitle(String title) {
      this.title = title;
    }
    public void setSubtitle(String subtitle) {
      this.subtitle = subtitle;
    }
    public void setGoogleReviewLink(String googleReviewLink) {
      this.googleReviewLink = googleReviewLink;
    }
    public void setWebsiteLink(String websiteLink) {
      this.websiteLink = websiteLink;
    }
    public void setBackgroundColor(String backgroundColor) {
      this.backgroundColor = backgroundColor;
    }
    public void setTextColor(String textColor) {
      this.textColor = textColor;
    }
    public void setButtonColor(String buttonColor) {
      this.buttonColor = buttonColor;
    }
    @Override
    public String toString() {
      return "ThankYouContent [id=" + id + ", restaurant=" + restaurant + ", title=" + title
          + ", subtitle=" + subtitle + ", googleReviewLink=" + googleReviewLink + ", websiteLink="
          + websiteLink + ", backgroundColor=" + backgroundColor + ", textColor=" + textColor
          + ", buttonColor=" + buttonColor + "]";
    }
    
    
    
}