package com.verve.vervedemo.notification;

/**
 * Interface for the subject in the Observer pattern
 * Defines methods for attaching, detaching, and notifying observers
 */
public interface NotificationSubject {
    void registerObserver(NotificationObserver observer);
    void removeObserver(NotificationObserver observer);
    void notifyObservers(NotificationEvent event);
} 