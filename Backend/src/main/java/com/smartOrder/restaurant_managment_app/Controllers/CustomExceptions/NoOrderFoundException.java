package com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception thrown when a requested order is not found in the system.
 * Automatically returns HTTP 404 (Not Found) status when thrown.
 * 
 */
@ResponseStatus(code = HttpStatus.NOT_FOUND)
public class NoOrderFoundException extends RuntimeException {

    /**
     * Constructs a new NoOrderFoundException with the specified detail message.
     *
     * @param message the detail message explaining why the order was not found
     */
    public NoOrderFoundException(String message) {
        super(message);
    }

    /**
     * Constructs a new NoOrderFoundException with the specified detail message and cause.
     *
     * @param message the detail message explaining why the order was not found
     * @param cause the cause of the exception
     */
    public NoOrderFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}