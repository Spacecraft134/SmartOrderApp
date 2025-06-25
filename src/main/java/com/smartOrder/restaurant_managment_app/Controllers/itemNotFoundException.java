package com.smartOrder.restaurant_managment_app.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(code= HttpStatus.NOT_FOUND)
public class itemNotFoundException extends RuntimeException {
  public itemNotFoundException(String message) {
    super(message);
  }
}
