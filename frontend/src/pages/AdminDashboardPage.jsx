import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";

const metricCards = [
  { title: "Pending Role Requests", value: "06", hint: "Needs approval", icon: "alert" },
  { title: "Escalated Tickets", value: "14", hint: "High urgency", icon: "clock" },
  { title: "Active Admins", value: "04", hint: "Online now", icon: "box" },
  { title: "Audit Events", value: "128", hint: "Past 24 hours", icon: "calendar" }
];

const recentActivity = [
  {
    time: "10:55 AM",
    user: "Security Desk",
    resource: "Privilege Request #AR-19",
    status: "Approved"
  },
  {
    time: "09:48 AM",
    user: "System Monitor",
    resource: "Ticket Escalation #TK-233",
    status: "In Progress"
  },
  {
    time: "08:36 AM",
    user: "Facility Admin",
    resource: "Lab 5 Access Policy",
    status: "Completed"
  },
  {
    time: "08:02 AM",
    user: "Compliance Bot",
    resource: "Daily Audit Snapshot",
    status: "Completed"
  }
];

const adminQueue = [
  { label: "Role Escalations", value: 6, tone: "teal" },
  { label: "Booking Overrides", value: 3, tone: "indigo" },
  { label: "Critical Incidents", value: 2, tone: "amber" }
];

function statusClass(status) {
  return `status-pill status-${status.toLowerCase().replace(" ", "-")}`;
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

function AdminDashboardPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DashboardShell>
      <section className="ops-content">
          <h1>Admin Operations Overview</h1>
          <p className="ops-subtitle">Centralized supervision for access, incidents, and policy compliance.</p>

          <div className="ops-metrics">
            {metricCards.map((card) => (
              <article key={card.title} className="ops-metric-card">
                <div className="ops-metric-top">
                  <span className={`metric-icon metric-${card.icon}`}>{metricIcon(card.icon)}</span>
                  <span>{card.hint}</span>
                </div>
                <p>{card.title}</p>
                <h3>{card.value}</h3>
              </article>
            ))}
          </div>

          <div className="ops-panels">
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>Administrative Activity</h2>
                <button type="button">Export Audit</button>
              </div>
              <div className="ops-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Entity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item) => (
                      <tr key={`${item.time}-${item.user}`}>
                        <td>{item.time}</td>
                        <td>
                          <span className="user-cell">
                            <span className="user-badge">{item.user.charAt(0)}</span>
                            {item.user}
                          </span>
                        </td>
                        <td>{item.resource}</td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="ops-panel pulse-panel">
              <div className="ops-panel-head">
                <h2>Action Queue</h2>
                <button type="button">Open Center</button>
              </div>
              <div className="pulse-list">
                {adminQueue.map((item) => (
                  <div key={item.label} className="pulse-item">
                    <div>
                      <h4>{item.label}</h4>
                      <p>{item.value} items pending</p>
                    </div>
                    <div className="pulse-meter" aria-hidden="true">
                      <span className={`pulse-fill pulse-${item.tone}`} style={{ width: `${Math.min(item.value * 16, 100)}%` }} />
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

export default AdminDashboardPage;
