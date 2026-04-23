import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchTickets } from "../api/tickets";
import { fetchMyBookings } from "../api/bookings";

/* ─── navigation ─────────────────────────────────────────── */
const navItems = [
  { label: "Dashboard",     to: "/",              icon: "dashboard" },
  { label: "Resources",     to: "/facilities",    icon: "resources" },
  { label: "Create Booking",to: "/create-booking",icon: "plus" },
  { label: "My Bookings",   to: "/my-bookings",   icon: "booking" },
  { label: "Ticketing",     to: "/user-tickets",  icon: "ticketing" },
  { label: "Notifications", to: "/notifications", icon: "notifications" },
  { label: "Analytics",     to: "/analytics",     icon: "analytics" },
];

function navIcon(type) {
  const d = {
    dashboard:     "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z",
    resources:     "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
    plus:          "M12 4v16m-8-8h16",
    booking:       "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z",
    ticketing:     "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
    notifications: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z",
    analytics:     "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <path d={d[type] || d.analytics} fill="currentColor" />
    </svg>
  );
}

/* ─── helpers ────────────────────────────────────────────── */
function dayLabel(iso) {
  if (!iso) return "?";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function weekBucket(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7)  return "This week";
  if (diffDays < 14) return "Last week";
  if (diffDays < 21) return "2 weeks ago";
  return "3+ weeks ago";
}

function buildCategoryBreakdown(tickets) {
  const map = {};
  tickets.forEach(t => { map[t.category] = (map[t.category] || 0) + 1; });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function buildWeeklyActivity(tickets) {
  const buckets = ["3+ weeks ago", "2 weeks ago", "Last week", "This week"];
  const map = {};
  buckets.forEach(b => { map[b] = 0; });
  tickets.forEach(t => {
    const b = weekBucket(t.createdAt);
    if (map[b] !== undefined) map[b]++;
  });
  return buckets.map(b => ({ label: b, count: map[b] }));
}

function buildBookingStatus(bookings) {
  const arr = Array.isArray(bookings) ? bookings : (bookings?.data || []);
  const map = { APPROVED: 0, PENDING: 0, REJECTED: 0, CANCELLED: 0 };
  arr.forEach(b => { if (map[b.status] !== undefined) map[b.status]++; });
  return Object.entries(map).map(([label, count]) => ({ label, count }));
}

/* ─── DonutChart (CSS conic-gradient) ───────────────────── */
function DonutChart({ slices, size = 120 }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) {
    return <div className="an-donut-empty">No data yet</div>;
  }
  let cum = 0;
  const segments = slices.map(s => {
    const pct = (s.count / total) * 100;
    const from = cum;
    cum += pct;
    return { ...s, from, to: cum };
  });
  const gradient = segments
    .map(s => `${s.color} ${s.from.toFixed(1)}% ${s.to.toFixed(1)}%`)
    .join(", ");

  return (
    <div className="an-donut-wrap">
      <div
        className="an-donut"
        style={{
          width: size, height: size,
          background: `conic-gradient(${gradient})`,
        }}
        aria-label={`Donut chart: ${slices.map(s => `${s.label} ${s.count}`).join(", ")}`}
      >
        <div className="an-donut-hole">
          <span className="an-donut-total">{total}</span>
          <span className="an-donut-sub">total</span>
        </div>
      </div>
      <ul className="an-legend" aria-label="Chart legend">
        {slices.map(s => (
          <li key={s.label} className="an-legend-item">
            <span className="an-legend-dot" style={{ background: s.color }} />
            <span className="an-legend-label">{s.label}</span>
            <span className="an-legend-val">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── BarChart (CSS height bars) ────────────────────────── */
function BarChart({ data, color = "#2f2969" }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="an-bar-chart" role="img" aria-label="Bar chart">
      {data.map(d => (
        <div key={d.label} className="an-bar-col">
          <span className="an-bar-val">{d.count}</span>
          <div
            className="an-bar-fill"
            style={{ height: `${(d.count / max) * 100}%`, background: color }}
            title={`${d.label}: ${d.count}`}
          />
          <span className="an-bar-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── HorizBar ───────────────────────────────────────────── */
function HorizBar({ items, colorFn }) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="an-horiz-list">
      {items.map((item, idx) => (
        <div key={item.label} className="an-horiz-row">
          <span className="an-horiz-lbl">{item.label}</span>
          <div className="an-horiz-track">
            <div
              className="an-horiz-fill"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: colorFn ? colorFn(idx) : "#2f2969",
              }}
            />
          </div>
          <span className="an-horiz-count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Category colour palette ───────────────────────────── */
const PALETTE = [
  "#2f2969", "#0e8c8a", "#e07e1b", "#c0395e",
  "#3a7bd5", "#1aad72",
];

/* ─── Main Page ──────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const [tickets,  setTickets]  = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([fetchTickets(), fetchMyBookings()])
      .then(([tRes, bRes]) => {
        if (cancelled) return;
        if (tRes.status === "fulfilled") setTickets(tRes.value || []);
        if (bRes.status === "fulfilled") {
          const raw = bRes.value;
          setBookings(Array.isArray(raw) ? raw : (raw?.data || []));
        }
      })
      .catch(() => setError("Failed to load analytics data"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /* ── derived metrics ── */
  const totalTickets  = tickets.length;
  const openTickets   = tickets.filter(t => t.status === "OPEN").length;
  const resolvedTix   = tickets.filter(t => t.status === "RESOLVED").length;
  const criticalTix   = tickets.filter(t => t.priority === "CRITICAL").length;

  const totalBookings = bookings.length;
  const approvedBk    = bookings.filter(b => b.status === "APPROVED").length;
  const pendingBk     = bookings.filter(b => b.status === "PENDING").length;

  const resolutionRate = totalTickets
    ? Math.round((resolvedTix / totalTickets) * 100)
    : 0;

  /* ── chart data ── */
  const ticketStatusSlices = useMemo(() => [
    { label: "Open",        count: tickets.filter(t => t.status === "OPEN").length,        color: "#3a7bd5" },
    { label: "In Progress", count: tickets.filter(t => t.status === "IN_PROGRESS").length, color: "#e07e1b" },
    { label: "Resolved",    count: tickets.filter(t => t.status === "RESOLVED").length,    color: "#1aad72" },
    { label: "Closed",      count: tickets.filter(t => t.status === "CLOSED").length,      color: "#8092a7" },
    { label: "Rejected",    count: tickets.filter(t => t.status === "REJECTED").length,    color: "#c0395e" },
  ].filter(s => s.count > 0), [tickets]);

  const weeklyActivity  = useMemo(() => buildWeeklyActivity(tickets),  [tickets]);
  const categoryBreak   = useMemo(() => buildCategoryBreakdown(tickets), [tickets]);
  const bookingStatuses = useMemo(() => buildBookingStatus(bookings),   [bookings]);

  /* ── recent tickets ── */
  const recentTickets = useMemo(() =>
    [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [tickets]
  );

  const handleLogout = () => { logout(); navigate("/login"); };

  /* ── KPI cards data ── */
  const kpiCards = [
    {
      label: "Total Tickets",
      value: totalTickets,
      hint: `${openTickets} open`,
      color: "#2f2969",
      bg: "#eef1ff",
      icon: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
    },
    {
      label: "Resolution Rate",
      value: `${resolutionRate}%`,
      hint: `${resolvedTix} resolved`,
      color: "#1aad72",
      bg: "#e5f9ef",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
    {
      label: "Critical Issues",
      value: criticalTix,
      hint: criticalTix > 0 ? "Needs attention" : "All clear",
      color: "#c0395e",
      bg: "#ffeef3",
      icon: "M12 4 3 20h18L12 4Zm1 11h-2v2h2v-2Zm0-6h-2v4h2V9Z",
    },
    {
      label: "My Bookings",
      value: totalBookings,
      hint: `${approvedBk} approved · ${pendingBk} pending`,
      color: "#e07e1b",
      bg: "#fff4e5",
      icon: "M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 7H6v10h12V9Z",
    },
  ];

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
                {navIcon(item.icon)}
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="ops-sidebar-foot">
          <button type="button">
            <span className="foot-icon">?</span>Support
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span>Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ops-main">
        {/* topbar */}
        <header className="ops-topbar">
          <div className="an-topbar-title">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ color: "#2f2969" }}>
              <path d="M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z" fill="currentColor" />
            </svg>
            Analytics &amp; Insights
          </div>
          <div className="ops-top-actions">
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

        {/* content */}
        <section className="ops-content an-page">
          {/* page heading */}
          <div className="an-page-head">
            <div>
              <h1>My Analytics</h1>
              <p className="ops-subtitle">Personal overview of your campus activity and resource usage.</p>
            </div>
            <div className="an-date-badge">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>

          {error && <div className="ticket-alert">{error}</div>}

          {loading ? (
            <div className="an-loading">
              <div className="an-spinner" />
              <p>Loading your analytics…</p>
            </div>
          ) : (
            <>
              {/* ── KPI row ── */}
              <div className="an-kpi-row">
                {kpiCards.map(card => (
                  <article key={card.label} className="an-kpi-card" style={{ "--kpi-color": card.color, "--kpi-bg": card.bg }}>
                    <div className="an-kpi-icon-wrap">
                      <svg viewBox="0 0 24 24" className="an-kpi-icon" aria-hidden="true">
                        <path d={card.icon} fill="currentColor" />
                      </svg>
                    </div>
                    <div className="an-kpi-body">
                      <p className="an-kpi-label">{card.label}</p>
                      <h3 className="an-kpi-value">{card.value}</h3>
                      <span className="an-kpi-hint">{card.hint}</span>
                    </div>
                    <div className="an-kpi-glow" />
                  </article>
                ))}
              </div>

              {/* ── Row 2: donut + weekly bars ── */}
              <div className="an-row-2">
                {/* ticket status donut */}
                <article className="an-card">
                  <div className="an-card-head">
                    <h2>Ticket Status</h2>
                    <span className="an-chip">{totalTickets} tickets</span>
                  </div>
                  <DonutChart slices={ticketStatusSlices} size={140} />
                </article>

                {/* weekly activity bar */}
                <article className="an-card an-card-wide">
                  <div className="an-card-head">
                    <h2>Weekly Ticket Activity</h2>
                    <span className="an-chip">4-week view</span>
                  </div>
                  {weeklyActivity.every(d => d.count === 0) ? (
                    <div className="an-empty">No ticket activity recorded yet.</div>
                  ) : (
                    <BarChart data={weeklyActivity} color="linear-gradient(180deg, #4940a3, #2f2969)" />
                  )}
                </article>
              </div>

              {/* ── Row 3: category breakdown + booking status ── */}
              <div className="an-row-3">
                {/* category breakdown */}
                <article className="an-card">
                  <div className="an-card-head">
                    <h2>Issues by Category</h2>
                  </div>
                  {categoryBreak.length === 0 ? (
                    <div className="an-empty">No tickets filed yet.</div>
                  ) : (
                    <HorizBar items={categoryBreak} colorFn={i => PALETTE[i % PALETTE.length]} />
                  )}
                </article>

                {/* booking status donut */}
                <article className="an-card">
                  <div className="an-card-head">
                    <h2>Booking Status</h2>
                    <span className="an-chip">{totalBookings} bookings</span>
                  </div>
                  <DonutChart
                    slices={[
                      { label: "Approved",  count: bookingStatuses.find(s => s.label === "APPROVED")?.count  || 0, color: "#1aad72" },
                      { label: "Pending",   count: bookingStatuses.find(s => s.label === "PENDING")?.count   || 0, color: "#e07e1b" },
                      { label: "Rejected",  count: bookingStatuses.find(s => s.label === "REJECTED")?.count  || 0, color: "#c0395e" },
                      { label: "Cancelled", count: bookingStatuses.find(s => s.label === "CANCELLED")?.count || 0, color: "#8092a7" },
                    ].filter(s => s.count > 0)}
                    size={120}
                  />
                </article>

                {/* resolution gauge */}
                <article className="an-card an-gauge-card">
                  <div className="an-card-head">
                    <h2>Resolution Rate</h2>
                  </div>
                  <div className="an-gauge-wrap">
                    <div
                      className="an-gauge-ring"
                      style={{ "--rate": resolutionRate }}
                      aria-label={`Resolution rate: ${resolutionRate}%`}
                    >
                      <div className="an-gauge-inner">
                        <span className="an-gauge-pct">{resolutionRate}%</span>
                        <span className="an-gauge-sub">resolved</span>
                      </div>
                    </div>
                    <div className="an-gauge-stats">
                      <div className="an-gauge-stat">
                        <span className="an-gs-dot" style={{ background: "#1aad72" }} />
                        <span>Resolved</span>
                        <strong>{resolvedTix}</strong>
                      </div>
                      <div className="an-gauge-stat">
                        <span className="an-gs-dot" style={{ background: "#3a7bd5" }} />
                        <span>Open</span>
                        <strong>{openTickets}</strong>
                      </div>
                      <div className="an-gauge-stat">
                        <span className="an-gs-dot" style={{ background: "#c0395e" }} />
                        <span>Critical</span>
                        <strong>{criticalTix}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* ── Row 4: recent tickets timeline ── */}
              <article className="an-card an-timeline-card">
                <div className="an-card-head">
                  <h2>Recent Ticket Timeline</h2>
                  <NavLink to="/user-tickets" className="an-view-all">View all tickets →</NavLink>
                </div>
                {recentTickets.length === 0 ? (
                  <div className="an-empty">You have not filed any tickets yet.</div>
                ) : (
                  <div className="an-timeline">
                    {recentTickets.map((t, i) => (
                      <div key={t.id} className="an-tl-item">
                        <div className="an-tl-line-col">
                          <div className={`an-tl-dot an-tl-dot-${String(t.status).toLowerCase().replace("_", "-")}`} />
                          {i < recentTickets.length - 1 && <div className="an-tl-connector" />}
                        </div>
                        <div className="an-tl-body">
                          <div className="an-tl-row">
                            <span className="an-tl-id">#{String(t.id).slice(-7)}</span>
                            <span className="an-tl-cat">{t.category}</span>
                            <span className={`an-tl-priority an-priority-${String(t.priority).toLowerCase()}`}>{t.priority}</span>
                            <span className={`status-pill status-${String(t.status).toLowerCase().replace("_", "-")}`}>
                              {String(t.status).replace("_", " ")}
                            </span>
                          </div>
                          <p className="an-tl-desc">{t.description}</p>
                          <span className="an-tl-date">{dayLabel(t.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
