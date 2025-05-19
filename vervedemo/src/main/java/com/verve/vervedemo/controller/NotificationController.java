package com.verve.vervedemo.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.verve.vervedemo.model.entity.Notification;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.repo.NotificationRepository;
import com.verve.vervedemo.repo.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    // Store emitters by userId for better management and filtering
    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    
    public NotificationController(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }
    
    private User getUserFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            logger.warn("No userId found in session");
            return null;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            logger.warn("No user found for userId: {}", userId);
        } else {
            logger.debug("Found user in session: {}", user.getUsername());
        }
        return user;
    }
    
    /**
     * Stream notifications using Server-Sent Events (SSE)
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam Long userId, HttpSession session) {
        logger.info("SSE connection request for userId: {}", userId);
        User user = getUserFromSession(session);
        if (user == null || !user.getId().equals(userId)) {
            logger.error("Unauthorized SSE connection attempt for userId: {}", userId);
            throw new RuntimeException("Unauthorized");
        }
        
        logger.info("Creating SSE emitter for userId: {}", userId);
        
        // Set a reasonable timeout (2 hours)
        SseEmitter emitter = new SseEmitter(7200000L);
        
        // Get or create user's emitter list
        List<SseEmitter> userEmitterList = userEmitters.computeIfAbsent(userId, 
            k -> new CopyOnWriteArrayList<>());
        
        // Add new emitter to user's list
        userEmitterList.add(emitter);
        
        // Clean up on completion
        emitter.onCompletion(() -> {
            logger.info("SSE connection completed for userId: {}", userId);
            removeEmitter(userId, emitter);
        });
        
        // Clean up on timeout
        emitter.onTimeout(() -> {
            logger.info("SSE connection timed out for userId: {}", userId);
            removeEmitter(userId, emitter);
        });
        
        // Clean up on error
        emitter.onError(e -> {
            logger.info("SSE connection error for userId: {}: {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        });
        
        // Send initial ping event
        try {
            logger.debug("Sending initial ping event to userId: {}", userId);
            emitter.send(SseEmitter.event()
                .name("ping")
                .data("connected"));
        } catch (IOException e) {
            logger.error("Error sending initial ping to userId: {}", userId, e);
            removeEmitter(userId, emitter);
            throw new RuntimeException("Error establishing SSE connection", e);
        }
        
        return emitter;
    }
    
    /**
     * Helper method to remove an emitter when it's no longer active
     */
    private void removeEmitter(Long userId, SseEmitter emitter) {
        if (userId != null) {
            List<SseEmitter> userEmitterList = userEmitters.get(userId);
            if (userEmitterList != null) {
                userEmitterList.remove(emitter);
                
                // If list is empty, remove the entry
                if (userEmitterList.isEmpty()) {
                    userEmitters.remove(userId);
                }
            }
        }
    }
    
    /**
     * Method to send notification to a specific user
     * (Called by other services)
     */
    public void sendNotification(Notification notification) {
        logger.info("Sending notification: type={}, userId={}, message={}", 
            notification.getType(), notification.getUserId(), notification.getMessage());
        
        // Validate notification has required fields
        if (notification.getUserId() == null) {
            logger.error("Cannot send notification without userId");
            return;
        }
        
        // Save notification to the database
        notification = notificationRepository.save(notification);
        logger.info("Saved notification to database with ID: {}", notification.getId());
        
        // Get emitters for this specific user
        List<SseEmitter> userEmitterList = userEmitters.get(notification.getUserId());
        
        if (userEmitterList == null || userEmitterList.isEmpty()) {
            logger.warn("No active emitters found for userId: {}", notification.getUserId());
            return;
        }
        
        // Send to only this user's emitters
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        boolean emitterFound = false;
        
        for (SseEmitter emitter : userEmitterList) {
            try {
                logger.debug("Sending notification to emitter for userId: {}", notification.getUserId());
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(notification));
                emitterFound = true;
            } catch (IOException e) {
                logger.error("Error sending notification to emitter for userId: {}", 
                    notification.getUserId(), e);
                deadEmitters.add(emitter);
            }
        }
        
        // Remove dead emitters
        if (!deadEmitters.isEmpty()) {
            userEmitterList.removeAll(deadEmitters);
            
            // If list is empty, remove the entry
            if (userEmitterList.isEmpty()) {
                userEmitters.remove(notification.getUserId());
            }
        }
        
        if (!emitterFound) {
            logger.warn("Failed to send notification to any emitters for userId: {}", 
                notification.getUserId());
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            logger.warn("Unauthorized attempt to get notifications");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Fetching notifications for userId: {}", user.getId());
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        logger.info("Found {} notifications for userId: {}", notifications.size(), user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            logger.warn("Unauthorized attempt to get unread notifications");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Fetching unread notifications for userId: {}", user.getId());
        List<Notification> notifications = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false);
        logger.info("Found {} unread notifications for userId: {}", notifications.size(), user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/count/unread")
    public ResponseEntity<Long> getUnreadCount(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            logger.warn("Unauthorized attempt to get unread count");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Counting unread notifications for userId: {}", user.getId());
        long count = notificationRepository.countByUserIdAndRead(user.getId(), false);
        logger.info("Found {} unread notifications for userId: {}", count, user.getId());
        return ResponseEntity.ok(count);
    }
    
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId, HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            logger.warn("Unauthorized attempt to mark notification as read");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Marking notification {} as read for userId: {}", notificationId, user.getId());
        notificationRepository.findById(notificationId)
            .ifPresent(notification -> {
                if (notification.getUserId().equals(user.getId())) {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    logger.info("Successfully marked notification {} as read", notificationId);
                } else {
                    logger.warn("Attempted to mark notification {} as read, but it belongs to userId: {}", 
                        notificationId, notification.getUserId());
                }
            });
        
        return ResponseEntity.ok().build();
    }
    
    /**
     * Mark all notifications as read for the current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(HttpSession session) {
        User user = getUserFromSession(session);
        if (user == null) {
            logger.warn("Unauthorized attempt to mark all notifications as read");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Marking all unread notifications as read for userId: {}", user.getId());
        List<Notification> unreadNotifications = 
            notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false);
            
        logger.info("Found {} unread notifications to mark as read", unreadNotifications.size());
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
        }
        
        if (!unreadNotifications.isEmpty()) {
            notificationRepository.saveAll(unreadNotifications);
            logger.info("Successfully marked all notifications as read for userId: {}", user.getId());
        }
        
        return ResponseEntity.ok().build();
    }
    
    // Add this debugging endpoint
    @GetMapping("/debug")
    public ResponseEntity<List<Notification>> getAllNotificationsForDebugging() {
        logger.info("Debug endpoint called to get all notifications");
        List<Notification> allNotifications = notificationRepository.findAll();
        logger.info("Found total {} notifications in database", allNotifications.size());
        return ResponseEntity.ok(allNotifications);
    }
    
    // Add a test endpoint to create a notification
    @GetMapping("/test-create/{userId}")
    public ResponseEntity<Notification> createTestNotification(@PathVariable Long userId) {
        logger.info("Creating a test notification for userId: {}", userId);
        
        Notification notification = new Notification();
        notification.setType("TEST_NOTIFICATION");
        notification.setMessage("This is a test notification created at " + new Date());
        notification.setUserId(userId);
        notification.setResourceId(1L); // Dummy resource ID
        notification.setRead(false);
        notification.setCreatedAt(new Date());
        
        try {
            notification = notificationRepository.save(notification);
            logger.info("Test notification created with ID: {}", notification.getId());
            
            // Send the notification to connected clients
            try {
                sendNotification(notification);
            } catch (Exception e) {
                logger.error("Error sending test notification to clients", e);
            }
            
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            logger.error("Error creating test notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Add a force reconnect test endpoint 
    @GetMapping("/test-reconnect")
    public ResponseEntity<String> testReconnect() {
        for (Map.Entry<Long, List<SseEmitter>> entry : userEmitters.entrySet()) {
            Long userId = entry.getKey();
            List<SseEmitter> emitters = entry.getValue();
            
            logger.info("Forcing reconnect for userId: {} with {} emitters", userId, emitters.size());
            
            for (SseEmitter emitter : new ArrayList<>(emitters)) {
                try {
                    // Send a message to trigger reconnect
                    emitter.send(SseEmitter.event()
                        .name("reconnect")
                        .data("Please reconnect"));
                    
                    // Then complete the emitter
                    emitter.complete();
                } catch (Exception e) {
                    logger.error("Error forcing reconnect for userId: {}", userId, e);
                }
            }
        }
        
        return ResponseEntity.ok("Reconnect signal sent to all connected clients");
    }
    
    // Add an endpoint to get connection status
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getConnectionStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("totalUsers", userEmitters.size());
        
        Map<Long, Integer> userCounts = new HashMap<>();
        int totalConnections = 0;
        
        for (Map.Entry<Long, List<SseEmitter>> entry : userEmitters.entrySet()) {
            Long userId = entry.getKey();
            List<SseEmitter> emitters = entry.getValue();
            
            userCounts.put(userId, emitters.size());
            totalConnections += emitters.size();
        }
        
        status.put("userCounts", userCounts);
        status.put("totalConnections", totalConnections);
        
        return ResponseEntity.ok(status);
    }
} 