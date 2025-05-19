package com.verve.vervedemo.services;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.verve.vervedemo.notification.NotificationEvent;
import com.verve.vervedemo.notification.NotificationObserver;
import com.verve.vervedemo.notification.NotificationSubject;

/**
 * Service that manages notifications using the Observer pattern
 */
@Service
public class NotificationManager implements NotificationSubject {
    private static final Logger logger = LoggerFactory.getLogger(NotificationManager.class);
    private final List<NotificationObserver> observers = new ArrayList<>();
    
    @Override
    public void registerObserver(NotificationObserver observer) {
        logger.info("Registering observer with userId: {}", observer.getUserId());
        observers.add(observer);
    }
    
    @Override
    public void removeObserver(NotificationObserver observer) {
        logger.info("Removing observer with userId: {}", observer.getUserId());
        observers.removeIf(o -> o.getUserId().equals(observer.getUserId()));
    }
    
    @Override
    public void notifyObservers(NotificationEvent event) {
        logger.info("Notifying observers about event: type={}, targetUserId={}. Total observers: {}", 
            event.getType(), event.getTargetUserId(), observers.size());
        
        boolean observerFound = false;
        for (NotificationObserver observer : observers) {
            // If observer has no userId (global observer) or matches the target user
            if (observer.getUserId() == null || observer.getUserId().equals(event.getTargetUserId())) {
                logger.info("Found matching observer (userId: {}) for targetUserId: {}", 
                    observer.getUserId(), event.getTargetUserId());
                observer.update(event);
                observerFound = true;
            } else {
                logger.debug("Observer userId: {} does not match target: {}", 
                    observer.getUserId(), event.getTargetUserId());
            }
        }
        
        if (!observerFound) {
            logger.warn("No matching observer found for targetUserId: {}", event.getTargetUserId());
        }
    }
    
    /**
     * Method to create and send notifications for various events
     */
    public void createNotification(String type, String message, Long targetUserId, 
                                  Long sourceUserId, Long resourceId) {
        logger.info("Creating notification: type={}, message={}, targetUserId={}", 
            type, message, targetUserId);
        
        NotificationEvent event = new NotificationEvent(type, message, targetUserId, 
                                                     sourceUserId, resourceId);
        notifyObservers(event);
    }
} 