package com.verve.vervedemo.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.verve.vervedemo.model.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(Long userId, boolean read);
    long countByUserIdAndRead(Long userId, boolean read);
} 