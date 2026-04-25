import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import notificationService from "../api/notificationService";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";
import "./NotificationsPage.css";



/**
 * NotificationsPage Component - Member 4
 * Displays comprehensive notification management for users, admins, and technicians
 */
function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const { user, roles, hasRole, isAuthenticated, logout } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isTechnician = hasRole("TECHNICIAN");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch notifications on mount and when page changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [notifications, filterType, sortBy]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications(page, 20);
      if (page === 0) {
        setNotifications(response.content);
      } else {
        setNotifications([...notifications, ...response.content]);
      }
      setHasMore(!response.last);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...notifications];

    // Apply type filter
    if (filterType !== "ALL") {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "unread-first") {
      filtered.sort((a, b) => (b.isRead ? 1 : -1) - (a.isRead ? 1 : -1));
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleBulkDelete = async () => {
    const toDelete = Array.from(selectedNotifications);
    try {
      await Promise.all(
        toDelete.map((id) => notificationService.deleteNotification(id))
      );
      setNotifications(notifications.filter((n) => !toDelete.includes(n.id)));
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error("Error bulk deleting notifications:", error);
    }
  };

  const toggleNotificationSelection = (id) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  const notificationTypes = [
    "ALL",
    "BOOKING_APPROVED",
    "BOOKING_REJECTED",
    "TICKET_ASSIGNED",
    "TICKET_IN_PROGRESS",
    "COMMENT_ADDED",
    "ROLE_ASSIGNED",
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardShell>
      <div className="notifications-page">
            <div className="notifications-header">
              <div className="header-title">
                <h1>📬 Notifications</h1>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount} unread</span>
                )}
              </div>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button
                    className="btn-primary"
                    onClick={handleMarkAllAsRead}
                    title="Mark all notifications as read"
                  >
                    ✓ Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="notifications-controls">
              <div className="filter-section">
                <label>Filter by type:</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(0);
                  }}
                  className="filter-select"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {notificationService.getNotificationTypeDisplay(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sort-section">
                <label>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="unread-first">Unread First</option>
                </select>
              </div>

              {selectedNotifications.size > 0 && (
                <div className="bulk-actions">
                  <span>{selectedNotifications.size} selected</span>
                  <button
                    className="btn-danger"
                    onClick={handleBulkDelete}
                    title="Delete selected notifications"
                  >
                    🗑️ Delete Selected
                  </button>
                </div>
              )}
            </div>

            <div className="notifications-list">
              {loading && page === 0 ? (
                <div className="loading">Loading notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No notifications yet</p>
                  <small>You're all caught up!</small>
                </div>
              ) : (
                <>
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-card ${notification.isRead ? "read" : "unread"}`}
                    >
                      <div className="notification-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          aria-label="Select notification"
                        />
                      </div>

                      <div className="notification-icon">
                        {notificationService.getNotificationIcon(notification.type)}
                      </div>

                      <div className="notification-content" onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.relatedEntityType === "BOOKING") {
                          navigate("/bookings");
                        } else if (notification.relatedEntityType === "TICKET") {
                          navigate("/tickets");
                        }
                      }}>
                        <div className="notification-header">
                          <h3 className="notification-title">{notification.title}</h3>
                          <span className="notification-type">
                            {notificationService.getNotificationTypeDisplay(notification.type)}
                          </span>
                        </div>
                        <p className="notification-message">{notification.message}</p>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.relatedEntityType && (
                            <span className="notification-entity">
                              → {notification.relatedEntityType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="notification-actions">
                        {!notification.isRead && (
                          <button
                            className="btn-icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="load-more-section">
                      <button
                        className="btn-secondary"
                        onClick={handleLoadMore}
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Load More Notifications"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {isAdmin && (
              <div className="admin-panel">
                <h2>🔧 Admin Notification Management</h2>
                <p>As an admin, you can view and manage notifications for all users.</p>
                <div className="admin-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate("/admin/users")}
                  >
                    Manage User Notifications
                  </button>
                </div>
              </div>
            )}

            {isTechnician && (
              <div className="technician-panel">
                <h2>🔧 Ticket Notifications</h2>
                <p>View assigned tickets and ticket updates below.</p>
                <div className="technician-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate("/tickets")}
                  >
                    View My Tickets
                  </button>
                </div>
              </div>
            )}
      </div>
    </DashboardShell>
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

export default NotificationsPage;
