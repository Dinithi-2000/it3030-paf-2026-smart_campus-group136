import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";

const metricCards = [
  { title: "Total Resources", value: "0", hint: "+12% vs LY", icon: "box" },
  { title: "Active Bookings", value: "0", hint: "Today", icon: "calendar" },
  { title: "Pending Requests", value: "0", hint: "Awaiting admin", icon: "clock" },
  { title: "Open Tickets", value: "0", hint: "High priority", icon: "alert" }
];

const recentActivity = [
  {
    time: "10:42 AM",
    user: "Prof. Sarah Miller",
    resource: "Lab Room 402",
    status: "Completed"
  },
  {
    time: "09:15 AM",
    user: "Maintenance Team A",
    resource: "HVAC Cluster 9",
    status: "In Progress"
  },
  {
    time: "08:30 AM",
    user: "IT Helpdesk",
    resource: "Server Rack B-12",
    status: "Delayed"
  },
  {
    time: "08:05 AM",
    user: "Faculty Admin",
    resource: "Seminar Hall 2",
    status: "Approved"
  }
];

const resourcePulse = [
  { label: "Study Spaces", value: 88, tone: "teal" },
  { label: "Computing Labs", value: 64, tone: "indigo" },
  { label: "Seminar Rooms", value: 42, tone: "amber" }
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

function DashboardPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DashboardShell>
        <section className="ops-content">
          <h1>System Overview</h1>
          <p className="ops-subtitle">Operational status for North Campus Precinct.</p>

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
                <h2>Recent Activity</h2>
                <button type="button">Export Logs</button>
              </div>
              <div className="ops-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Resource</th>
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
                <h2>Resource Pulse</h2>
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
