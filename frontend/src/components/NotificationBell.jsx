import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../api/notificationService";
import "./NotificationBell.css";

/**
 * NotificationBell Component
 * Displays unread notification count and provides quick access to notifications
 * Used in TopNav for all authenticated users
 */
function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch unread count on component mount and set up polling
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent unread notifications when dropdown opens
  useEffect(() => {
    if (isOpen && recentNotifications.length === 0) {
      fetchRecentNotifications();
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const unread = await notificationService.getUnreadNotifications();
      setRecentNotifications(unread.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error("Error fetching recent notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await notificationService.markAsRead(notification.id);
      setUnreadCount(Math.max(0, unreadCount - 1));

      // Navigate to related entity if available
      if (notification.relatedEntityType === "BOOKING") {
        navigate("/bookings");
      } else if (notification.relatedEntityType === "TICKET") {
        navigate("/tickets");
      }

      // Close dropdown
      setIsOpen(false);
      
      // Refresh recent notifications
      setRecentNotifications([]);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleViewAll = () => {
    navigate("/notifications");
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications([]);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="notification-empty">
                {unreadCount === 0
                  ? "No notifications"
                  : "Swipe down to refresh"}
              </div>
            ) : (
              <ul className="notification-list">
                {recentNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-icon">
                      {notificationService.getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title">{notification.title}</div>
                      <div className="notification-item-message">{notification.message}</div>
                      <div className="notification-item-time">
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {recentNotifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button className="view-all-btn" onClick={handleViewAll}>
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="notification-backdrop"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

/**
 * Format time to relative format (e.g., "2 hours ago")
 */
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export default NotificationBell;
