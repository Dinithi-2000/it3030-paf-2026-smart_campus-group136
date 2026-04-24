package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.model.Notification;
import com.sliit.smartcampus.repository.UserRepository;
import com.sliit.smartcampus.service.NotificationService;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Notification Management
 * Handles notifications for users, admins, and technicians
 * 
 * Member 4: Notifications + Role Management + OAuth Integration
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/notifications
     * Retrieve paginated notifications for the current user
     * 
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param authentication Current user authentication
     * @return Paginated notifications
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            Authentication authentication) {
        
        Long userId = extractUserIdFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getUserNotifications(userId, pageable);
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/notifications/unread
     * Retrieve unread notifications for the current user
     * 
     * @param authentication Current user authentication
     * @return List of unread notifications
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getUnreadNotifications(Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        List<Notification> unreadNotifications = notificationService.getUnreadNotifications(userId);
        
        return ResponseEntity.ok(unreadNotifications);
    }

    /**
     * GET /api/notifications/unread/count
     * Get count of unread notifications for the current user
     * 
     * @param authentication Current user authentication
     * @return Count of unread notifications
     */
    @GetMapping("/unread/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        long count = notificationService.getUnreadCount(userId);
        
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", count);
        
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/{id}
     * Retrieve a specific notification by ID
     * 
     * @param id Notification ID
     * @param authentication Current user authentication
     * @return The notification if found and belongs to the user
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> getNotification(
            @PathVariable Long id,
            Authentication authentication) {
        
        Long userId = extractUserIdFromAuthentication(authentication);
        return notificationService.getNotification(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark a notification as read
     * 
     * @param id Notification ID
     * @param authentication Current user authentication
     * @return No content on success
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        
        Long userId = extractUserIdFromAuthentication(authentication);
        notificationService.markAsRead(id, userId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read for the current user
     * 
     * @param authentication Current user authentication
     * @return No content on success
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        notificationService.markAllAsRead(userId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a specific notification
     * 
     * @param id Notification ID
     * @param authentication Current user authentication
     * @return No content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {
        
        Long userId = extractUserIdFromAuthentication(authentication);
        notificationService.deleteNotification(id, userId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/notifications/type/{type}
     * Retrieve notifications of a specific type for the current user
     * 
     * @param type Notification type (BOOKING_APPROVED, TICKET_ASSIGNED, etc.)
     * @param authentication Current user authentication
     * @return List of notifications of the specified type
     */
    @GetMapping("/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getNotificationsByType(
            @PathVariable String type,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuthentication(authentication);
            Notification.NotificationType notificationType = Notification.NotificationType.valueOf(type);
            List<Notification> notifications = notificationService.getUnreadNotifications(userId)
                    .stream()
                    .filter(n -> n.getType() == notificationType)
                    .toList();
            
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Admin endpoint: GET /api/notifications/admin/user/{userId}
     * Retrieve all notifications for a specific user (admin only)
     * 
     * @param userId User ID
     * @param page Page number
     * @param size Page size
     * @return Paginated notifications for the user
     */
    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Notification>> getUserNotificationsAdmin(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getUserNotifications(userId, pageable);
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Admin endpoint: DELETE /api/notifications/admin/user/{userId}/old
     * Delete old notifications for a user (admin only)
     * 
     * @param userId User ID
     * @param days Number of days (notifications older than this will be deleted)
     * @return No content on success
     */
    @DeleteMapping("/admin/user/{userId}/old")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOldNotificationsAdmin(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") @Min(1) Integer days) {
        
        notificationService.deleteOldNotifications(userId, days);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Helper method to extract user ID from authentication
     * In a real OAuth implementation, this would extract from JWT token
     */
    private Long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }

        return userRepository.findByUsername(authentication.getName())
                .map(user -> user.getId())
                .orElse(null);
    }
}
