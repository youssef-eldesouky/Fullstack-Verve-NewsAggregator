package com.verve.vervedemo.notification;

import java.util.Date;

/**
 * Class that represents notification events in the system
 */
public class NotificationEvent {
    private String type;
    private String message;
    private Long targetUserId;
    private Long sourceUserId;
    private Long resourceId; // Article ID, comment ID, etc.
    private Date createdAt;

    public NotificationEvent(String type, String message, Long targetUserId, Long sourceUserId, Long resourceId) {
        this.type = type;
        this.message = message;
        this.targetUserId = targetUserId;
        this.sourceUserId = sourceUserId;
        this.resourceId = resourceId;
        this.createdAt = new Date();
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }

    public Long getSourceUserId() {
        return sourceUserId;
    }

    public void setSourceUserId(Long sourceUserId) {
        this.sourceUserId = sourceUserId;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
} 