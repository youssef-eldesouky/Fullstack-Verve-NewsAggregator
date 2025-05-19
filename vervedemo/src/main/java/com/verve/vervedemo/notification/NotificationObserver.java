package com.verve.vervedemo.notification;

/**
 * Interface for observers in the Observer pattern
 * Defines method for receiving updates from the subject
 */
public interface NotificationObserver {
    void update(NotificationEvent event);
    Long getUserId(); // To identify which user this observer represents
} 