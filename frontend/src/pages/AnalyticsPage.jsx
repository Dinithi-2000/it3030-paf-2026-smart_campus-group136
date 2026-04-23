import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/* ── Navigation items (mirrors DashboardPage) ── */
const navItems = [
  { label: "Dashboard",      to: "/dashboard",       icon: "dashboard" },
  { label: "Resources",      to: "/facilities",      icon: "resources" },
  { label: "Create Booking", to: "/create-booking",  icon: "booking" },
  { label: "My Bookings",    to: "/my-bookings",     icon: "booking" },
  { label: "Ticketing",      to: "/user-tickets",    icon: "ticketing" },
  { label: "Notifications",  to: "/notifications",   icon: "notifications" },
  { label: "Analytics",      to: "/analytics",       icon: "analytics" },
];

/* ── Static demo data ── */
const kpiCards = [
  { id: "bookings",      label: "Total Bookings",    value: 42,  delta: "+8%",   tone: "teal",   icon: "calendar" },
  { id: "resources",     label: "Active Resources",  value: 15,  delta: "+2",    tone: "indigo", icon: "resources" },
  { id: "tickets",       label: "Open Tickets",      value: 3,   delta: "1 crit",tone: "amber",  icon: "ticket" },
  { id: "notifications", label: "Notifications",     value: 7,   delta: "2 new", tone: "rose",   icon: "bell" },
];

const bookingTrend = [
  { day: "Mon", bookings: 6,  cancelled: 1 },
  { day: "Tue", bookings: 9,  cancelled: 2 },
  { day: "Wed", bookings: 14, cancelled: 0 },
  { day: "Thu", bookings: 8,  cancelled: 3 },
  { day: "Fri", bookings: 12, cancelled: 1 },
  { day: "Sat", bookings: 5,  cancelled: 0 },
  { day: "Sun", bookings: 3,  cancelled: 0 },
];

const resourceUsage = [
  { label: "Study Spaces",    value: 88, tone: "teal" },
  { label: "Computing Labs",  value: 64, tone: "indigo" },
  { label: "Seminar Rooms",   value: 42, tone: "amber" },
  { label: "Sports Facilities", value: 31, tone: "rose" },
  { label: "Meeting Pods",    value: 75, tone: "teal" },
];

const recentBookings = [
  { time: "10:42 AM", resource: "Lab Room 402",    status: "Completed",  type: "study" },
  { time: "09:15 AM", resource: "HVAC Cluster 9",  status: "In Progress",type: "maintenance" },
  { time: "08:30 AM", resource: "Server Rack B-12",status: "Delayed",    type: "it" },
  { time: "08:05 AM", resource: "Seminar Hall 2",  status: "Approved",   type: "seminar" },
  { time: "Yesterday",resource: "Meeting Pod 7",   status: "Completed",  type: "meeting" },
];

const ticketStats = [
  { label: "Open",        value: 3,  color: "#ef5a6b" },
  { label: "In Progress", value: 7,  color: "#f2b429" },
  { label: "Resolved",    value: 28, color: "#15b593" },
  { label: "Closed",      value: 14, color: "#8fa3b8" },
];

/* ── Icon paths ── */
const NAV_ICONS = {
  dashboard:     "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z",
  resources:     "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
  booking:       "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z",
  ticketing:     "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
  notifications: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z",
  analytics:     "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z",
};

const KPI_ICONS = {
  calendar:  "M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 7H6v10h12V9Z",
  resources: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
  ticket:    "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
  bell:      "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z",
};

const TONE_STYLES = {
  teal:   { card: "#e7f8f4", icon: "#0c9b7c", bar: "linear-gradient(90deg,#15b593,#20cb9e)" },
  indigo: { card: "#eef0ff", icon: "#4940a3", bar: "linear-gradient(90deg,#2f2969,#4940a3)" },
  amber:  { card: "#fff8e7", icon: "#c69a2e", bar: "linear-gradient(90deg,#d18a12,#f2b429)" },
  rose:   { card: "#fff0f3", icon: "#cc4961", bar: "linear-gradient(90deg,#cc4961,#ef7a8a)" },
};

function statusClass(s) {
  return `status-pill status-${s.toLowerCase().replace(" ", "-")}`;
}

function NavIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <path d={NAV_ICONS[type]} fill="currentColor" />
    </svg>
  );
}

/* ── Mini bar chart (SVG, no lib) ── */
const BAR_W = 16;
const BAR_GAP = 6;
const CHART_H = 70;

function BookingBar({ day, bookings, cancelled, maxVal }) {
  const bH = Math.round((bookings / maxVal) * CHART_H);
  const cH = Math.round((cancelled / maxVal) * CHART_H);
  return (
    <g>
      {/* cancelled stacked on top */}
      <rect
        x={0} y={CHART_H - bH - cH}
        width={BAR_W} height={cH}
        rx={4} fill="#ef5a6b" opacity={0.75}
      />
      <rect
        x={0} y={CHART_H - bH}
        width={BAR_W} height={bH}
        rx={4} fill="#15b593"
      />
      <text
        x={BAR_W / 2} y={CHART_H + 16}
        textAnchor="middle" fontSize={10} fill="#8fa3b8"
      >
        {day}
      </text>
    </g>
  );
}

function BookingTrendChart() {
  const maxVal = Math.max(...bookingTrend.map(d => d.bookings + d.cancelled)) + 2;
  const totalW = bookingTrend.length * (BAR_W + BAR_GAP) - BAR_GAP;
  return (
    <svg
      viewBox={`0 0 ${totalW} ${CHART_H + 26}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-label="Bookings over time bar chart"
    >
      {bookingTrend.map((d, i) => (
        <g key={d.day} transform={`translate(${i * (BAR_W + BAR_GAP)}, 0)`}>
          <BookingBar {...d} maxVal={maxVal} />
        </g>
      ))}
    </svg>
  );
}

/* ── Donut chart for ticket stats ── */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;
  const cx = 60, cy = 60, r = 48, inner = 32;

  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + inner * Math.cos(angle - sweep);
    const yi1 = cy + inner * Math.sin(angle - sweep);
    const xi2 = cx + inner * Math.cos(angle);
    const yi2 = cy + inner * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return {
      ...d,
      d: `M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${xi2},${yi2} A${inner},${inner},0,${large},0,${xi1},${yi1} Z`,
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 120 120" style={{ width: 120, minWidth: 120 }} aria-label="Ticket distribution donut chart">
        {slices.map(s => (
          <path key={s.label} d={s.d} fill={s.color} opacity={0.9} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#12263b">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#8fa3b8">TICKETS</text>
      </svg>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {data.map(d => (
          <li key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 600, color: "#3a516a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: "inline-block", flexShrink: 0 }} />
            {d.label} — <strong style={{ color: "#12263b" }}>{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Time range tabs ── */
const TIME_RANGES = ["7 Days", "30 Days", "3 Months", "Year"];

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState("7 Days");

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <section className="ops-shell">
      {/* ── Sidebar ── */}
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">SC</div>
          <div>
            <h2>Operations Hub</h2>
            <p>INTELLIGENT OBSERVATORIUM</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Dashboard navigation">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`
              }
            >
              <span className="menu-link-content">
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="ops-sidebar-foot">
          <button type="button"><span className="foot-icon">?</span>Support</button>
          <button type="button"><span className="foot-icon">*</span>Settings</button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span>Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ops-main">
        <header className="ops-topbar">
          <input type="search" placeholder="Global system search..." />
          <div className="ops-top-actions">
            <button type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0-6 6v3.6l-1.4 2.3a1 1 0 0 0 .86 1.51h13.08a1 1 0 0 0 .86-1.51L18 12.6V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z" fill="currentColor" />
              </svg>
            </button>
            <button type="button" aria-label="Quick logout" className="logout-soft" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path d="M10 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 1 1 0-2h7V5h-7a1 1 0 0 1-1-1ZM13.7 12.7a1 1 0 0 0 0-1.4l-2-2a1 1 0 1 0-1.4 1.4L10.59 11H4a1 1 0 1 0 0 2h6.59l-.29.29a1 1 0 1 0 1.4 1.42l2-2.01Z" fill="currentColor" />
              </svg>
            </button>
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Campus User"}</strong>
                <span>{roles?.[0] || "USER"}</span>
              </div>
              <div className="avatar">
                {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <section className="ops-content" aria-label="Analytics & Insights">
          {/* Page heading */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <h1>Analytics &amp; Insights</h1>
              <p className="ops-subtitle">Overview of your campus activity and resource usage.</p>
            </div>
            {/* Time range selector */}
            <div style={{ display: "flex", gap: 6, background: "#f0f4f9", borderRadius: 10, padding: 4 }}>
              {TIME_RANGES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRange(t)}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: range === t ? "#ffffff" : "transparent",
                    color: range === t ? "#12263b" : "#8fa3b8",
                    boxShadow: range === t ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                    transition: "all 0.18s ease",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className="ops-metrics" style={{ marginBottom: 16 }}>
            {kpiCards.map(card => {
              const tone = TONE_STYLES[card.tone];
              return (
                <article key={card.id} className="ops-metric-card" style={{ position: "relative", overflow: "hidden" }}>
                  {/* colour accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: tone.bar, borderRadius: "14px 14px 0 0" }} />
                  <div className="ops-metric-top" style={{ color: tone.icon }}>
                    <span
                      className="metric-icon"
                      style={{ background: tone.card, color: tone.icon }}
                    >
                      <svg viewBox="0 0 24 24" className="metric-svg" aria-hidden="true">
                        <path d={KPI_ICONS[card.icon]} fill="currentColor" />
                      </svg>
                    </span>
                    <span style={{ color: tone.icon }}>{card.delta}</span>
                  </div>
                  <p>{card.label}</p>
                  <h3>{card.value}</h3>
                </article>
              );
            })}
          </div>

          {/* ── Charts row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {/* Booking trend chart */}
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2 style={{ fontSize: "0.9rem" }}>Bookings Trend</h2>
              </div>
              <BookingTrendChart />
              <div style={{ display: "flex", gap: 10, fontSize: "0.65rem", fontWeight: 700, marginTop: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#15b593" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#15b593", display: "inline-block" }} />
                  Booked
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef5a6b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef5a6b", display: "inline-block" }} />
                  Cancelled
                </span>
              </div>
            </article>

            {/* Ticket breakdown donut */}
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2 style={{ fontSize: "0.9rem" }}>Tickets</h2>
              </div>
              <DonutChart data={ticketStats} />
            </article>

            {/* Resource utilisation bars (Moved here) */}
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2 style={{ fontSize: "0.9rem" }}>Usage</h2>
              </div>
              <div className="pulse-list" style={{ gap: 8 }}>
                {resourceUsage.slice(0, 4).map(item => {
                  const tone = TONE_STYLES[item.tone];
                  return (
                    <div key={item.label} className="pulse-item" style={{ marginBottom: 0 }}>
                      <div className="pulse-meta" style={{ fontSize: "0.75rem" }}>
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className="pulse-track" style={{ height: 4 }}>
                        <div
                          className="pulse-fill"
                          style={{ width: `${item.value}%`, background: tone.bar }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* ── Bottom row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {/* Recent bookings mini-table */}
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>Recent System Activity</h2>
                <button type="button" onClick={() => navigate("/my-bookings")}>
                  Full Report
                </button>
              </div>
              <div className="ops-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Resource</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((item, i) => (
                      <tr key={`${item.time}-${i}`}>
                        <td style={{ color: "#8fa3b8", fontSize: "0.8rem" }}>{item.time}</td>
                        <td style={{ fontWeight: 600, fontSize: "0.86rem" }}>{item.resource}</td>
                        <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
