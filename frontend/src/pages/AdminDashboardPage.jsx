import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { label: "Admin Dashboard", to: "/admin-dashboard", icon: "dashboard" },
  { label: "Resources", to: "/facilities", icon: "resources" },
  { label: "My Bookings", to: "/my-bookings", icon: "booking" },
  { label: "Ticketing", to: "/tickets", icon: "ticketing" },
  { label: "Notifications", to: "/notifications", icon: "notifications" },
  { label: "Analytics", to: "/analytics", icon: "analytics" }
];

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

function navIcon(type) {
  const icons = {
    dashboard: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z",
    resources: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
    booking: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z",
    ticketing: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
    notifications: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z",
    analytics: "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z"
  };

  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <path d={icons[type]} fill="currentColor" />
    </svg>
  );
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
    <section className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">AD</div>
          <div>
            <h2>Admin Command</h2>
            <p>CONTROL AND COMPLIANCE</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin-dashboard"}
              className={({ isActive }) =>
                `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`
              }
            >
              <span className="menu-link-content">
                {navIcon(item.icon)}
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="ops-sidebar-foot">
          <button type="button">
            <span className="foot-icon">!</span>
            Emergency Protocol
          </button>
          <button type="button" onClick={handleLogout}>
            <span className="foot-icon">x</span>
            Exit Console
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <input type="search" placeholder="Search admin events, users, tickets..." />
          <div className="ops-top-actions">
            <button type="button" aria-label="Admin notifications">
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M12 3a6 6 0 0 0-6 6v3.6l-1.4 2.3a1 1 0 0 0 .86 1.51h13.08a1 1 0 0 0 .86-1.51L18 12.6V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Quick logout"
              className="logout-soft"
              onClick={handleLogout}
            >
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M10 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 1 1 0-2h7V5h-7a1 1 0 0 1-1-1ZM13.7 12.7a1 1 0 0 0 0-1.4l-2-2a1 1 0 1 0-1.4 1.4L10.59 11H4a1 1 0 1 0 0 2h6.59l-.29.29a1 1 0 1 0 1.4 1.42l2-2.01Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Admin"}</strong>
                <span>{roles?.includes("ADMIN") ? "ADMIN" : roles?.[0] || "USER"}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || "A").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

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
      </div>
    </section>
  );
}

export default AdminDashboardPage;
