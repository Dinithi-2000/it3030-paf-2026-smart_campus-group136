import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";
import { fetchTickets } from "../api/tickets";
import { fetchMyBookings } from "../api/bookings";
import { notificationService } from "../api/notificationService";

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("approved") || s.includes("completed") || s.includes("resolved")) return "status-pill status-approved";
  if (s.includes("pending") || s.includes("in progress")) return "status-pill status-in-progress";
  if (s.includes("rejected") || s.includes("critical") || s.includes("escalated")) return "status-pill status-rejected";
  return "status-pill status-default";
}

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

function statusLabel(rawStatus) {
  const normalized = String(rawStatus || "").replaceAll("_", " ").trim();
  if (!normalized) return "Unknown";
  return normalized
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function metricIcon(type) {
  const icons = {
    box: "M12 3 4 7.5V16.5L12 21l8-4.5V7.5L12 3Zm0 2.3 5.8 3.2L12 11.7 6.2 8.5 12 5.3Z",
    calendar: "M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 7H6v10h12V9Z",
    clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 4h-2v5l4 2 1-1.7-3-1.3V8Z",
    alert: "M12 4 3 20h18L12 4Zm1 11h-2v2h2v-2Zm0-6h-2v4h2V9Z",
    check: "M20 7 9 18l-5-5 1.4-1.4 3.6 3.6L18.6 5.6 20 7Z"
  };

  return (
    <svg viewBox="0 0 24 24" className="metric-svg" aria-hidden="true">
      <path d={icons[type]} fill="currentColor" />
    </svg>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    activeBookings: 0,
    approvedBookings: 0,
    pendingRequests: 0,
    inProgress: 0,
    openTickets: 0
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch User Tickets
        const tickets = await fetchTickets();
        const openTicketsCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
        const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;

        // 2. Fetch User Bookings
        const bookingRes = await fetchMyBookings();
        const myBookings = bookingRes.data || [];
        const approvedCount = myBookings.filter((b) => b.status === "APPROVED").length;
        const pendingCount = myBookings.filter((b) => b.status === "PENDING").length;
        const activeCount = myBookings.filter((b) => b.status === "APPROVED" || b.status === "PENDING").length;

        // 3. Fetch Recent Activity (Notifications)
        const notifRes = await notificationService.getNotifications(0, 5);
        const latestActivities = (notifRes.content || []).map(n => ({
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: user?.displayName || user?.username || "Me",
          resource: n.title || n.message || "Booking activity",
          status: statusLabel(n.type)
        }));

        setMetrics({
          totalBookings: myBookings.length,
          activeBookings: activeCount,
          approvedBookings: approvedCount,
          pendingRequests: pendingCount,
          inProgress: inProgressCount,
          openTickets: openTicketsCount
        });

        setActivities(latestActivities);

      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const todayLabel = useMemo(() => formatTodayDate(), []);

  const metricCards = [
    { title: "Total Bookings", value: metrics.totalBookings, hint: "All time", icon: "box" },
    { title: "Active Bookings", value: metrics.activeBookings, hint: "Approved + pending", icon: "calendar", tone: "active" },
    { title: "Approved", value: metrics.approvedBookings, hint: "Confirmed", icon: "check" },
    { title: "Awaiting admin", value: metrics.pendingRequests, hint: "Pending", icon: "clock" },
    { title: "In progress", value: metrics.inProgress, hint: "Ticket workflow", icon: "alert" }
  ];

  const resourcePulse = [
    { label: "Study Spaces", value: 88, tone: "teal" },
    { label: "Computing Labs", value: 64, tone: "indigo" },
    { label: "Seminar Rooms", value: 42, tone: "amber" }
  ];

  const quickLinks = [
    { label: "Create Booking", action: () => navigate("/create-booking") },
    { label: "My Bookings", action: () => navigate("/my-bookings") },
    { label: "Notifications", action: () => navigate("/notifications") }
  ];

  return (
    <DashboardShell>
      <section className="ops-content">
        <section className="dashx-hero">
          <div className="dashx-hero-main">
            <p className="dashx-kicker">Operations Hub</p>
            <h1>My Dashboard</h1>
            <p className="ops-subtitle">Personal operational overview and recent activity.</p>
            <p className="userdash-welcome">Welcome back, {user?.displayName || user?.username || "User"}</p>
          </div>
          <div className="dashx-hero-side" aria-label="User summary">
            <div className="userdash-datebox" aria-label="Today's date and user avatar">
              <div className="userdash-avatar">{(user?.displayName || user?.username || "C").charAt(0).toUpperCase()}</div>
              <div>
                <span>Today</span>
                <strong>{todayLabel}</strong>
              </div>
            </div>
            <div className="dashx-actions">
              {quickLinks.map((link) => (
                <button key={link.label} type="button" onClick={link.action} className="dashx-action-btn">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="dashx-metrics-grid" aria-label="Dashboard metrics">
          {metricCards.map((card) => (
            <article key={card.title} className={`dashx-metric-card ${card.tone === "active" ? "dashx-metric-card-active" : ""}`}>
              <div className="dashx-metric-head">
                <span className={`metric-icon metric-${card.icon}`}>{metricIcon(card.icon)}</span>
                <span>{card.hint}</span>
              </div>
              <p>{card.title}</p>
              <h3>{loading ? "..." : String(card.value).padStart(2, "0")}</h3>
            </article>
          ))}
        </section>

        <section className="dashx-grid">
          <article className="dashx-panel dashx-panel-wide">
            <div className="ops-panel-head">
              <h2>Recent Activity</h2>
              <button type="button" onClick={() => navigate("/notifications")}>View All</button>
            </div>

            <div className="dashx-activity-list" role="table" aria-label="Recent Activity">
              <div className="dashx-activity-head" role="row">
                <span>Time</span>
                <span>User</span>
                <span>Event</span>
                <span>Type</span>
              </div>

              {activities.length > 0 ? activities.map((item, idx) => (
                <div key={idx} className="dashx-activity-row" role="row">
                  <span>{item.time}</span>
                  <span className="user-cell">
                    <span className="user-badge">{item.user.charAt(0).toUpperCase()}</span>
                    {item.user}
                  </span>
                  <span>{item.resource}</span>
                  <span>
                    <span className={statusClass(item.status)}>{statusLabel(item.status)}</span>
                  </span>
                </div>
              )) : (
                <div className="dashx-empty-row">{loading ? "Loading activity..." : "No recent activity found"}</div>
              )}
            </div>
          </article>

          <article className="dashx-panel">
            <div className="ops-panel-head">
              <h2>Campus Resource Pulse</h2>
            </div>
            <div className="pulse-list">
              {resourcePulse.map((item) => (
                <div key={item.label} className="pulse-item">
                  <div className="pulse-meta">
                    <span>{item.label}</span>
                    <strong>{item.value}%</strong>
                  </div>
                  <div className="pulse-track">
                    <div className={`pulse-fill pulse-${item.tone}`} style={{ "--target": `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="dashx-footnote">
              <strong>Open Tickets:</strong> {loading ? "..." : String(metrics.openTickets).padStart(2, "0")}
            </div>
          </article>
        </section>
      </section>
    </DashboardShell>
  );
}

export default DashboardPage;
