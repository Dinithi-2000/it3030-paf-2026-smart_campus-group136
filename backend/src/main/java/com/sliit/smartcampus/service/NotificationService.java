package com.sliit.smartcampus.service;

import com.sliit.smartcampus.model.Notification;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.NotificationRepository;
import com.sliit.smartcampus.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create and send a notification to a user
     */
    public Notification createNotification(Long userId, String title, String message, 
                                          Notification.NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Notification notification = new Notification(user, title, message, type);
        return notificationRepository.save(notification);
    }

    /**
     * Create and send a notification with related entity reference
     */
    public Notification createNotification(Long userId, String title, String message, 
                                          Notification.NotificationType type,
                                          String relatedEntityType, Long relatedEntityId) {
        Notification notification = createNotification(userId, title, message, type);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for a user (paginated)
     */
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notification count for a user
     */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Get a specific notification (with authorization check)
     */
    public Optional<Notification> getNotification(Long notificationId, Long userId) {
        return notificationRepository.findByIdAndUserId(notificationId, userId);
    }

    /**
     * Mark a notification as read
     */
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findByIdAndUserId(notificationId, userId)
                .ifPresent(notification -> {
                    notificationRepository.markAsRead(notificationId, userId);
                });
    }

    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    /**
     * Delete a specific notification
     */
    public void deleteNotification(Long notificationId, Long userId) {
        notificationRepository.findByIdAndUserId(notificationId, userId)
                .ifPresent(notification -> notificationRepository.delete(notification));
    }

    /**
     * Delete old notifications for a user (older than specified days)
     */
    public void deleteOldNotifications(Long userId, Integer days) {
        notificationRepository.deleteOldNotifications(userId, days);
    }

    /**
     * Notify booking approval to user
     */
    public Notification notifyBookingApproved(Long userId, String bookingReference, Long bookingId) {
        return createNotification(userId, 
                "Booking Approved", 
                "Your booking (" + bookingReference + ") has been approved. You can now proceed with your planned activity.",
                Notification.NotificationType.BOOKING_APPROVED,
                "BOOKING",
                bookingId);
    }

    /**
     * Notify booking rejection to user
     */
    public Notification notifyBookingRejected(Long userId, String bookingReference, String reason, Long bookingId) {
        return createNotification(userId, 
                "Booking Rejected", 
                "Your booking (" + bookingReference + ") has been rejected. Reason: " + reason,
                Notification.NotificationType.BOOKING_REJECTED,
                "BOOKING",
                bookingId);
    }

    /**
     * Notify ticket assignment to technician
     */
    public Notification notifyTicketAssigned(Long technicianId, String ticketId, String ticketTitle, Long ticketEntityId) {
        return createNotification(technicianId, 
                "Ticket Assigned", 
                "A new ticket has been assigned to you: " + ticketTitle,
                Notification.NotificationType.TICKET_ASSIGNED,
                "TICKET",
                ticketEntityId);
    }

    /**
     * Notify ticket status change to creator
     */
    public Notification notifyTicketStatusChange(Long userId, String ticketId, String newStatus, Long ticketEntityId) {
        return createNotification(userId, 
                "Ticket Status Updated", 
                "Your ticket (" + ticketId + ") status has been updated to: " + newStatus,
                Notification.NotificationType.TICKET_IN_PROGRESS,
                "TICKET",
                ticketEntityId);
    }

    /**
     * Notify new comment on user's ticket
     */
    public Notification notifyCommentAdded(Long userId, String ticketId, String commenterName, Long ticketEntityId) {
        return createNotification(userId, 
                "New Comment", 
                commenterName + " commented on ticket " + ticketId,
                Notification.NotificationType.COMMENT_ADDED,
                "TICKET",
                ticketEntityId);
    }

    /**
     * Get all notifications related to an entity
     */
    public List<Notification> getNotificationsForEntity(String entityType, Long entityId) {
        return notificationRepository.findByRelatedEntityTypeAndRelatedEntityId(entityType, entityId);
    }
}
