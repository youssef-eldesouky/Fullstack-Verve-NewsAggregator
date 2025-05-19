package com.verve.vervedemo.services;

import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.verve.vervedemo.model.entity.Notification;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.notification.UserNotificationObserver;
import com.verve.vervedemo.repo.NotificationRepository;

/**
 * Service for notification operations
 */
@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final NotificationRepository notificationRepository;
    private final NotificationManager notificationManager;
    private final UserNotificationObserver userNotificationObserver;
    
    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationManager notificationManager,
            UserNotificationObserver userNotificationObserver) {
        this.notificationRepository = notificationRepository;
        this.notificationManager = notificationManager;
        this.userNotificationObserver = userNotificationObserver;
        
        // Register the observer with the notification manager
        this.notificationManager.registerObserver(userNotificationObserver);
    }
    
    /**
     * Get all notifications for a user
     */
    public List<Notification> getUserNotifications(User user) {
        if (user == null) return List.of();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(User user) {
        if (user == null) return List.of();
        return notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false);
    }
    
    /**
     * Count unread notifications for a user
     */
    public long countUnreadNotifications(User user) {
        if (user == null) return 0;
        return notificationRepository.countByUserIdAndRead(user.getId(), false);
    }
    
    /**
     * Mark a notification as read
     */
    public boolean markNotificationAsRead(User user, Long notificationId) {
        if (user == null) return false;
        
        return notificationRepository.findById(notificationId)
                .map(notification -> {
                    if (notification.getUserId().equals(user.getId())) {
                        notification.setRead(true);
                        notificationRepository.save(notification);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }
    
    /**
     * Create a notification when a user creates a new article
     */
    public void notifyNewArticle(User author, String articleTitle, Long articleId) {
        // In a real application, you would get the list of users following this author
        // For simplicity, we'll just create a notification for the author themselves
        notificationManager.createNotification(
                "NEW_ARTICLE",
                "You published a new article: " + articleTitle,
                author.getId(),
                author.getId(),
                articleId
        );
    }
    
    /**
     * Create a notification when a user comments on an article
     */
    public void notifyNewComment(User commenter, User articleAuthor, String articleTitle, Long articleId) {
        if (commenter == null || articleAuthor == null) {
            logger.warn("Cannot create notification: commenter or article author is null");
            return;
        }
        
        logger.info("Creating comment notification from user {} to article owner {}", 
            commenter.getUsername(), articleAuthor.getUsername());
        
        notificationManager.createNotification(
                "NEW_COMMENT",
                commenter.getUsername() + " commented on your article: " + articleTitle,
                articleAuthor.getId(),
                commenter.getId(),
                articleId
        );
        
        // Create a direct notification in case the observer pattern fails
        createDirectNotification(
            "NEW_COMMENT",
            commenter.getUsername() + " commented on your article: " + articleTitle,
            articleAuthor.getId(),
            articleId
        );
    }
    
    /**
     * Create a notification directly in the database (backup method)
     */
    public void createDirectNotification(String type, String message, Long userId, Long resourceId) {
        logger.info("Creating direct notification for userId: {}, type: {}", userId, type);
        
        Notification notification = new Notification();
        notification.setType(type);
        notification.setMessage(message);
        notification.setUserId(userId);
        notification.setResourceId(resourceId);
        notification.setRead(false);
        notification.setCreatedAt(new Date());
        
        try {
            notification = notificationRepository.save(notification);
            logger.info("Direct notification saved with ID: {}", notification.getId());
        } catch (Exception e) {
            logger.error("Failed to save direct notification", e);
        }
    }
} 