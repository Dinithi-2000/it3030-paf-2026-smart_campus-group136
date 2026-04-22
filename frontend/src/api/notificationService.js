import client from "./client";

const API_BASE = "/api/notifications";

/**
 * Notification Service for Member 4 - Notifications Module
 * Handles all notification API calls for user, admin, and technician roles
 */

export const notificationService = {
  /**
   * GET /api/notifications
   * Retrieve paginated notifications for current user
   */
  getNotifications: async (page = 0, size = 20) => {
    try {
      const response = await client.get(API_BASE, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/unread
   * Get all unread notifications
   */
  getUnreadNotifications: async () => {
    try {
      const response = await client.get(`${API_BASE}/unread`);
      return response.data;
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/unread/count
   * Get count of unread notifications
   */
  getUnreadCount: async () => {
    try {
      const response = await client.get(`${API_BASE}/unread/count`);
      return response.data.unreadCount;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/{id}
   * Get a specific notification
   */
  getNotification: async (id) => {
    try {
      const response = await client.get(`${API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching notification ${id}:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/notifications/{id}/read
   * Mark a notification as read
   */
  markAsRead: async (id) => {
    try {
      await client.put(`${API_BASE}/${id}/read`);
      return true;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      await client.put(`${API_BASE}/read-all`);
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  /**
   * DELETE /api/notifications/{id}
   * Delete a specific notification
   */
  deleteNotification: async (id) => {
    try {
      await client.delete(`${API_BASE}/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/type/{type}
   * Get notifications by type
   */
  getNotificationsByType: async (type) => {
    try {
      const response = await client.get(`${API_BASE}/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      throw error;
    }
  },

  /**
   * Admin: GET /api/notifications/admin/user/{userId}
   * Get notifications for a specific user (admin only)
   */
  getUserNotificationsAdmin: async (userId, page = 0, size = 20) => {
    try {
      const response = await client.get(`${API_BASE}/admin/user/${userId}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Admin: DELETE /api/notifications/admin/user/{userId}/old
   * Delete old notifications for a user (admin only)
   */
  deleteOldNotificationsAdmin: async (userId, days = 30) => {
    try {
      await client.delete(`${API_BASE}/admin/user/${userId}/old`, {
        params: { days }
      });
      return true;
    } catch (error) {
      console.error(`Error deleting old notifications for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get notification type display name
   */
  getNotificationTypeDisplay: (type) => {
    const displayNames = {
      BOOKING_APPROVED: "Booking Approved",
      BOOKING_REJECTED: "Booking Rejected",
      BOOKING_CANCELLED: "Booking Cancelled",
      TICKET_CREATED: "Ticket Created",
      TICKET_ASSIGNED: "Ticket Assigned",
      TICKET_IN_PROGRESS: "Ticket In Progress",
      TICKET_RESOLVED: "Ticket Resolved",
      TICKET_CLOSED: "Ticket Closed",
      TICKET_REJECTED: "Ticket Rejected",
      COMMENT_ADDED: "Comment Added",
      COMMENT_REPLY: "Comment Reply",
      ROLE_ASSIGNED: "Role Assigned",
      ROLE_REMOVED: "Role Removed"
    };
    return displayNames[type] || type;
  },

  /**
   * Get notification icon based on type
   */
  getNotificationIcon: (type) => {
    const icons = {
      BOOKING_APPROVED: "✓",
      BOOKING_REJECTED: "✗",
      BOOKING_CANCELLED: "✗",
      TICKET_CREATED: "📋",
      TICKET_ASSIGNED: "👤",
      TICKET_IN_PROGRESS: "⚙️",
      TICKET_RESOLVED: "✓",
      TICKET_CLOSED: "✓",
      TICKET_REJECTED: "✗",
      COMMENT_ADDED: "💬",
      COMMENT_REPLY: "💬",
      ROLE_ASSIGNED: "👑",
      ROLE_REMOVED: "✗"
    };
    return icons[type] || "📌";
  }
};

export default notificationService;
