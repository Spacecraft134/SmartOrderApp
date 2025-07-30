package com.smartOrder.restaurant_managment_app.Controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;




@RestController
@RequestMapping("/api/upsell")
public class UpsellController {
  
  @Value("${openai.api.key}")
  private String openaiApiKey;

  @Value("${openai.api.url}")
  private String openaiApiUrl;

  private final RestTemplate restTemplate;

  
  public UpsellController(RestTemplate restTemplate) {
      this.restTemplate = restTemplate;
  }
  
  @PostMapping("/recommend")
  public Map<String, Object> getRecommendation(@RequestBody Map<String, Object> requestBody) {
    List<String> orderItems = (List<String>) requestBody.get("orderItems");
    List<String> menuItems = (List<String>) requestBody.get("menuItemNames");
    
    String prompt = "You are a restaurant upsell assistant. The customer has ordered: " +
        String.join(", ", orderItems) + ". " +
        "Recommend 2-3 items from our menu that would complement this order. " +
        "Menu items: " + String.join(", ", menuItems) + ". " +
        "For each recommendation, provide a brief reason. " +
        "Format response as JSON: { \"recommendations\": [{ \"name\": \"Item\", \"reason\": \"Reason\" }] }";
    
    Map<String, Object> request = new HashMap<>();
    request.put("model", "gpt-3.5-turbo");
    
    List<Map<String, String>>messages = new ArrayList<>();
    Map<String, String>message = new HashMap<>();
    message.put("role", "user");
    message.put("content", prompt);
    messages.add(message);
    
    request.put("messages", messages);
    request.put("temperature", 0.7);
    request.put("max_tokens", 500);
    
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setBearerAuth(openaiApiKey);
    
    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request,headers);
    ResponseEntity<Map> response = restTemplate.exchange(openaiApiUrl, HttpMethod.POST, entity, Map.class);
    
    
    Map<String, Object> responseBody = response.getBody();
    Map<String, Object> choices = ((List<Map<String, Object>>) responseBody.get("choices")).get(0);
    
    String content = (String) ((Map<String, Object>) choices.get("message")).get("content");

    ObjectMapper mapper = new ObjectMapper();
    try {
      return mapper.readValue(content, Map.class);
    }
    catch(Exception e) {
      throw new RuntimeException("Failed to get AI response", e);
    }
  }
}
