package com.smartOrder.restaurant_managment_app.Controllers.CustomExceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception thrown when a requested help request is not found in the system.
 * Automatically returns HTTP 404 (Not Found) status when thrown.
 * 
 */
@ResponseStatus(code = HttpStatus.NOT_FOUND)
public class NoRequestFoundException extends RuntimeException {

    /**
     * Constructs a new NoRequestFoundException with the specified detail message.
     *
     * @param message the detail message explaining why the help request was not found
     */
    public NoRequestFoundException(String message) {
        super(message);
    }

    /**
     * Constructs a new NoRequestFoundException with the specified detail message and cause.
     *
     * @param message the detail message explaining why the help request was not found
     * @param cause the cause of the exception
     */
    public NoRequestFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}