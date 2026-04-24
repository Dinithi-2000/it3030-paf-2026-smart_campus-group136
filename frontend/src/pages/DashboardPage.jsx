import React, { useState, useEffect } from "react";
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

function metricIcon(type) {
  const icons = {
    box: "M12 3 4 7.5V16.5L12 21l8-4.5V7.5L12 3Zm0 2.3 5.8 3.2L12 11.7 6.2 8.5 12 5.3Z",
    calendar: "M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 7H6v10h12V9Z",
    clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 4h-2v5l4 2 1-1.7-3-1.3V8Z",
    alert: "M12 4 3 20h18L12 4Zm1 11h-2v2h2v-2Zm0-6h-2v4h2V9Z"
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
    pendingRequests: 0,
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
        const openTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

        // 2. Fetch User Bookings
        const bookingRes = await fetchMyBookings();
        const myBookings = bookingRes.data || [];
        const activeCount = myBookings.filter(b => b.status === "APPROVED").length;
        const pendingCount = myBookings.filter(b => b.status === "PENDING").length;

        // 3. Fetch Recent Activity (Notifications)
        const notifRes = await notificationService.getNotifications(0, 5);
        const latestActivities = (notifRes.content || []).map(n => ({
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: user?.displayName || user?.username || "Me",
          resource: n.title,
          status: n.type.replace('_', ' ')
        }));

        setMetrics({
          totalBookings: myBookings.length,
          activeBookings: activeCount,
          pendingRequests: pendingCount,
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

  const metricCards = [
    { title: "Total Bookings", value: metrics.totalBookings, hint: "All time", icon: "box" },
    { title: "Active Bookings", value: metrics.activeBookings, hint: "Approved", icon: "calendar" },
    { title: "Pending Requests", value: metrics.pendingRequests, hint: "Awaiting admin", icon: "clock" },
    { title: "Open Tickets", value: metrics.openTickets, hint: "In progress", icon: "alert" }
  ];

  const resourcePulse = [
    { label: "Study Spaces", value: 88, tone: "teal" },
    { label: "Computing Labs", value: 64, tone: "indigo" },
    { label: "Seminar Rooms", value: 42, tone: "amber" }
  ];

  return (
    <DashboardShell>
        <section className="ops-content">
          <h1>My Dashboard</h1>
          <p className="ops-subtitle">Personal operational overview and recent activity.</p>

          <div className="ops-metrics">
            {metricCards.map((card) => (
              <article key={card.title} className="ops-metric-card">
                <div className="ops-metric-top">
                  <span className={`metric-icon metric-${card.icon}`}>{metricIcon(card.icon)}</span>
                  <span>{card.hint}</span>
                </div>
                <p>{card.title}</p>
                <h3>{loading ? "..." : String(card.value).padStart(2, '0')}</h3>
              </article>
            ))}
          </div>

          <div className="ops-panels">
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>Recent Activity</h2>
                <button type="button" onClick={() => navigate("/notifications")}>View All</button>
              </div>
              <div className="ops-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Event</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length > 0 ? activities.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.time}</td>
                        <td>
                          <span className="user-cell">
                            <span className="user-badge">{item.user.charAt(0).toUpperCase()}</span>
                            {item.user}
                          </span>
                        </td>
                        <td>{item.resource}</td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                          {loading ? "Loading activity..." : "No recent activity found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="ops-panel pulse-panel">
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
                      <div
                        className={`pulse-fill pulse-${item.tone}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
    </DashboardShell>
  );
}

export default DashboardPage;
