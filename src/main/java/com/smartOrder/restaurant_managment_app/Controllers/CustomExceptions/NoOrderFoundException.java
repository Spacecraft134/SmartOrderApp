package com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(code=HttpStatus.NOT_FOUND)
public class NoOrderFoundException extends RuntimeException {
  public NoOrderFoundException(String message) {
    super(message);
  }
}
