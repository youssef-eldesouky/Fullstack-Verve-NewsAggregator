package com.verve.vervedemo.notification;

import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.verve.vervedemo.model.entity.Notification;
import com.verve.vervedemo.repo.NotificationRepository;

/**
 * Observer that handles storing notifications in the database
 * This is a global observer that handles notifications for all users
 */
@Component
public class UserNotificationObserver implements NotificationObserver {
    private static final Logger logger = LoggerFactory.getLogger(UserNotificationObserver.class);
    
    private final NotificationRepository notificationRepository;
    
    public UserNotificationObserver(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
        logger.info("UserNotificationObserver initialized");
    }
    
    @Override
    public Long getUserId() {
        // Return null to indicate this is a global observer that handles all notifications
        return null;
    }
    
    @Override
    public void update(NotificationEvent event) {
        logger.info("Received notification event: type={}, targetUserId={}, message={}",
                event.getType(), event.getTargetUserId(), event.getMessage());
        
        if (event.getTargetUserId() == null) {
            logger.error("Cannot process notification with null targetUserId");
            return;
        }
        
        // Create and save notification to database
        Notification notification = new Notification();
        notification.setType(event.getType());
        notification.setMessage(event.getMessage());
        notification.setUserId(event.getTargetUserId());
        notification.setResourceId(event.getResourceId());
        notification.setRead(false);
        notification.setCreatedAt(new Date());
        
        notification = notificationRepository.save(notification);
        logger.info("Saved notification to database with ID: {} for userId: {}", 
            notification.getId(), notification.getUserId());
    }
} 