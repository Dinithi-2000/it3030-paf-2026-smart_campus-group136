import client from "./client";

const API_BASE = "/notifications";

/**
 * Notification Service for Member 4 - Notifications Module
 * Handles all notification API calls for user, admin, and technician roles
 */

const MOCK_KEY = "smartcampus.mockNotifications.v2";

function currentRole() {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return Array.isArray(roles) && roles.length > 0 ? roles[0] : "USER";
  } catch {
    return "USER";
  }
}

function readMockNotifications() {
  const role = currentRole();
  const raw = localStorage.getItem(MOCK_KEY);
  if (!raw) {
    const seeded = [
      // --- ADMIN NOTIFICATIONS ---
      {
        id: 101,
        title: "System Update Complete",
        message: "Smart Campus v2.4 is now live. New administrative reports available.",
        type: "ROLE_ASSIGNED",
        role: "ADMIN",
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 102,
        title: "Escalated Ticket Alert",
        message: "Ticket #TK-992 (HVAC failure) has been escalated to critical priority.",
        type: "TICKET_ASSIGNED",
        role: "ADMIN",
        isRead: false,
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 103,
        title: "New Facility Added",
        message: "A new study space 'Library Pod 4' has been registered in the system.",
        type: "ROLE_ASSIGNED",
        role: "ADMIN",
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 104,
        title: "High System Load",
        message: "Server resources exceeded 90% utilization during morning peak.",
        type: "ROLE_REMOVED",
        role: "ADMIN",
        isRead: false,
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },

      // --- TECHNICIAN NOTIFICATIONS ---
      {
        id: 201,
        title: "New Ticket Assigned",
        message: "Ticket #TK-1002 (Projector Fault) has been assigned to your workspace.",
        type: "TICKET_ASSIGNED",
        role: "TECHNICIAN",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 202,
        title: "Work Report Reminder",
        message: "Weekly technician performance reports are due by Friday 5 PM.",
        type: "COMMENT_ADDED",
        role: "TECHNICIAN",
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 203,
        title: "Urgent Maintenance",
        message: "Room 402 AC requires immediate attention. Priority updated to High.",
        type: "TICKET_IN_PROGRESS",
        role: "TECHNICIAN",
        isRead: false,
        createdAt: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 204,
        title: "Comment on Assigned Ticket",
        message: "Reporter added an image to #TK-1002. Please check attachments.",
        type: "COMMENT_ADDED",
        role: "TECHNICIAN",
        isRead: true,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },

      // --- USER NOTIFICATIONS ---
      {
        id: 301,
        title: "Booking Approved",
        message: "Your request for LAB-402 for 'Project Work' has been confirmed.",
        type: "BOOKING_APPROVED",
        role: "USER",
        isRead: false,
        createdAt: new Date(Date.now() - 4500000).toISOString()
      },
      {
        id: 302,
        title: "Comment on your Ticket",
        message: "Technician Sam has replied to your projector fault report.",
        type: "COMMENT_ADDED",
        role: "USER",
        isRead: false,
        createdAt: new Date(Date.now() - 9000000).toISOString()
      },
      {
        id: 303,
        title: "Ticket Resolved",
        message: "Your ticket #TK-1001 (Wi-Fi issue) has been marked as resolved.",
        type: "TICKET_ASSIGNED",
        role: "USER",
        isRead: true,
        createdAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 304,
        title: "Booking Reminder",
        message: "Your reservation for Hall-2 starts in 30 minutes.",
        type: "BOOKING_APPROVED",
        role: "USER",
        isRead: false,
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 305,
        title: "Booking Rejected",
        message: "Your request for LAB-5 was rejected due to scheduled maintenance.",
        type: "BOOKING_REJECTED",
        role: "USER",
        isRead: false,
        createdAt: new Date(Date.now() - 21600000).toISOString()
      }
    ];
    localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
    return seeded.filter(n => n.role === role);
  }
  return JSON.parse(raw).filter(n => n.role === role);
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    try {
      const response = await client.get(API_BASE, { params: { page, size } });
      if (response.data.content && response.data.content.length > 0) return response.data;
      throw new Error("Empty server data");
    } catch (error) {
      const all = readMockNotifications();
      return {
        content: all.slice(page * size, (page + 1) * size),
        totalElements: all.length,
        last: (page + 1) * size >= all.length
      };
    }
  },

  getUnreadNotifications: async () => {
    try {
      const response = await client.get(`${API_BASE}/unread`);
      if (response.data && response.data.length > 0) return response.data;
      throw new Error("Empty server data");
    } catch (error) {
      return readMockNotifications().filter(n => !n.isRead);
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await client.get(`${API_BASE}/unread/count`);
      return response.data.unreadCount;
    } catch (error) {
      return readMockNotifications().filter(n => !n.isRead).length;
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
    } catch (error) {
      const all = readMockNotifications();
      const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem(MOCK_KEY, JSON.stringify(updated));
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      await client.put(`${API_BASE}/read-all`);
    } catch (error) {
      const all = readMockNotifications();
      const updated = all.map(n => ({ ...n, isRead: true }));
      localStorage.setItem(MOCK_KEY, JSON.stringify(updated));
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
