package com.sliit.smartcampus.repository;

import com.sliit.smartcampus.model.Notification;
import com.sliit.smartcampus.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a user, paginated
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Find notification by ID and user ID (for security)
     */
    java.util.Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /**
     * Find notifications of a specific type for a user
     */
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, Notification.NotificationType type);

    /**
     * Find notifications related to a specific entity
     */
    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String entityType, Long entityId);

    /**
     * Mark notification as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :id AND n.user.id = :userId")
    void markAsRead(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsRead(@Param("userId") Long userId);

    /**
     * Delete old notifications (older than days)
     */
    @Modifying
    @Query(value = "DELETE FROM notifications WHERE user_id = :userId AND created_at < DATE_SUB(NOW(), INTERVAL :days DAY)", nativeQuery = true)
    void deleteOldNotifications(@Param("userId") Long userId, @Param("days") Integer days);
}
