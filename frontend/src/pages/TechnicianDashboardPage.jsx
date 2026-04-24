// Author: Member 3 - Technician Dashboard (Ticketing Focus)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchTickets } from "../api/tickets";
import TechSidebar from "../components/TechSidebar";

const PRIORITY_COLOR = {
  LOW:      { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  MEDIUM:   { bg: "#fef9c3", text: "#a16207", dot: "#f59e0b" },
  HIGH:     { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" },
  CRITICAL: { bg: "#ede9fe", text: "#6d28d9", dot: "#7c3aed" },
};

const STATUS_META = {
  OPEN:        { color: "#3b82f6", label: "Open" },
  IN_PROGRESS: { color: "#f59e0b", label: "In Progress" },
  RESOLVED:    { color: "#22c55e", label: "Resolved" },
  CLOSED:      { color: "#64748b", label: "Closed" },
  REJECTED:    { color: "#ef4444", label: "Rejected" },
};

function statusClass(s) {
  return `status-pill status-${String(s || "open").toLowerCase().replaceAll("_", "-")}`;
}

function timeAgo(v) {
  if (!v) return "-";
  const diff = Date.now() - new Date(v);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return "Just now";
}

function shortDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export default function TechnicianDashboardPage() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const actorId   = user?.id   || user?.username || "";
  const actorName = user?.displayName || user?.username || "";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchTickets();
        setTickets(all || []);
      } catch {
        setError("Could not load tickets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // My assigned tickets
  const myTickets = useMemo(
    () => tickets.filter(
      t => t.assignedTechnicianId === actorId || t.assignedTechnicianName === actorName
    ),
    [tickets, actorId, actorName]
  );

  // Stats from all tickets
  const stats = useMemo(() => ({
    total:      tickets.length,
    open:       tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
    critical:   tickets.filter(t => t.priority === "CRITICAL").length,
    myAssigned: myTickets.length,
    myOpen:     myTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length,
  }), [tickets, myTickets]);

  // Priority breakdown for donut-style display
  const priorityStats = useMemo(() => [
    { label: "Critical", count: tickets.filter(t => t.priority === "CRITICAL").length, ...PRIORITY_COLOR.CRITICAL },
    { label: "High",     count: tickets.filter(t => t.priority === "HIGH").length,     ...PRIORITY_COLOR.HIGH },
    { label: "Medium",   count: tickets.filter(t => t.priority === "MEDIUM").length,   ...PRIORITY_COLOR.MEDIUM },
    { label: "Low",      count: tickets.filter(t => t.priority === "LOW").length,      ...PRIORITY_COLOR.LOW },
  ], [tickets]);

  // Recently updated tickets (most recent 5)
  const recentActivity = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 5),
    [tickets]
  );

  // My urgent tickets (OPEN or IN_PROGRESS, sorted by priority)
  const PRIORITY_WEIGHT = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const urgentMyTickets = useMemo(
    () => myTickets
      .filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS")
      .sort((a, b) => (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0))
      .slice(0, 4),
    [myTickets]
  );

  return (
    <section className="ops-shell">
      <TechSidebar />

      <div className="ops-main">
        {/* Top bar */}
        <header className="ops-topbar">
          <input type="search" placeholder="Search tickets..." />
          <div className="ops-top-actions">
            <div className="ops-user">
              <div>
                <strong>{actorName || "Technician"}</strong>
                <span>{roles?.[0] || "TECHNICIAN"}</span>
              </div>
              <div className="avatar tech-avatar">
                {(actorName || "T").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          {/* ── Hero Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0d766e 100%)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 20,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Decorative circle */}
            <div style={{
              position: "absolute", right: -40, top: -40,
              width: 180, height: 180, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)"
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", opacity: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
                Technician Console
              </p>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>
                Ticket Management
              </h1>
              <p style={{ margin: "6px 0 0", opacity: 0.8, fontSize: "0.9rem" }}>
                Manage campus maintenance and incident tickets assigned to you.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => navigate("/tech-tickets")}
                style={{
                  background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", borderRadius: 10, padding: "9px 18px", fontSize: "0.88rem",
                  fontWeight: 700, cursor: "pointer", transition: "background 0.2s"
                }}
              >
                All Tickets →
              </button>
              <button
                type="button"
                onClick={() => navigate("/tech-work-report")}
                style={{
                  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.85)", borderRadius: 10, padding: "9px 18px", fontSize: "0.88rem",
                  fontWeight: 700, cursor: "pointer"
                }}
              >
                Work Report
              </button>
            </div>
          </div>

          {error && <div className="ticket-alert">{error}</div>}

          {/* ── KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Tickets",  value: stats.total,      accent: "#3b82f6", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-2-2h-2" },
              { label: "Open",           value: stats.open,       accent: "#3b82f6", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
              { label: "In Progress",    value: stats.inProgress, accent: "#f59e0b", icon: "M11.42 15.17 17 21 21 17l-5.83-5.58M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
              { label: "Critical",       value: stats.critical,   accent: "#ef4444", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" },
            ].map(card => (
              <article key={card.label} style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: "1px solid #e8eff8", boxShadow: "0 4px 14px rgba(20,40,70,0.06)",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.accent, borderRadius: "14px 14px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: card.accent + "18", display: "grid", placeItems: "center" }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={card.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.76rem", fontWeight: 700, color: "#8a9bb5", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</p>
                    <h3 style={{ margin: "3px 0 0", fontSize: "1.8rem", fontWeight: 800, color: "#12263b", lineHeight: 1 }}>
                      {loading ? "—" : card.value}
                    </h3>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* ── Second row: My Assigned + Status Breakdown ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>

            {/* My Assigned Stats */}
            <article style={{
              background: "linear-gradient(135deg, #eef2ff, #f0fdfa)",
              borderRadius: 14, padding: "18px 20px",
              border: "1px solid #e0e7ff"
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.76rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.07em" }}>My Assigned</p>
              <h2 style={{ margin: "0 0 12px", fontSize: "2.2rem", fontWeight: 800, color: "#1e1b4b" }}>{stats.myAssigned}</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #e0e7ff" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 700 }}>Pending Work</p>
                  <strong style={{ fontSize: "1.2rem", color: "#4f46e5" }}>{stats.myOpen}</strong>
                </div>
                <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #e0e7ff" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 700 }}>Resolved</p>
                  <strong style={{ fontSize: "1.2rem", color: "#0d766e" }}>{stats.resolved}</strong>
                </div>
              </div>
            </article>

            {/* Status Distribution */}
            <article style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e8eff8" }}>
              <p style={{ margin: "0 0 14px", fontSize: "0.76rem", fontWeight: 800, color: "#8a9bb5", textTransform: "uppercase", letterSpacing: "0.07em" }}>Status Overview</p>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(STATUS_META).slice(0, 4).map(([key, meta]) => {
                  const count = tickets.filter(t => t.status === key).length;
                  const pct   = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: 3 }}>
                        <span style={{ color: "#3a516a" }}>{meta.label}</span>
                        <span style={{ color: meta.color }}>{count}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 4, background: "#f0f4f9" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Priority Distribution */}
            <article style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e8eff8" }}>
              <p style={{ margin: "0 0 14px", fontSize: "0.76rem", fontWeight: 800, color: "#8a9bb5", textTransform: "uppercase", letterSpacing: "0.07em" }}>Priority Split</p>
              <div style={{ display: "grid", gap: 8 }}>
                {priorityStats.map(p => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, color: "#3a516a" }}>{p.label}</span>
                    <span style={{
                      fontSize: "0.76rem", fontWeight: 800, color: p.text,
                      background: p.bg, padding: "2px 10px", borderRadius: 999
                    }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* ── Bottom row: My Urgent Tickets + Recent Activity ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* My Urgent Tickets */}
            <article style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e8eff8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#12263b" }}>My Active Tickets</h2>
                <button
                  type="button"
                  onClick={() => navigate("/tech-tickets")}
                  style={{ background: "none", border: "none", color: "#0d766e", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                >
                  See All →
                </button>
              </div>

              {loading ? (
                <p style={{ color: "#8a9bb5", fontSize: "0.88rem" }}>Loading…</p>
              ) : urgentMyTickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#8a9bb5" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎉</div>
                  <p style={{ margin: 0, fontSize: "0.88rem" }}>No active tickets assigned to you.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {urgentMyTickets.map(t => {
                    const pc = PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.LOW;
                    return (
                      <div
                        key={t.id}
                        onClick={() => navigate("/tech-tickets")}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 14px", borderRadius: 10,
                          border: "1px solid #e8eff8", cursor: "pointer",
                          borderLeft: `3px solid ${pc.dot}`,
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <strong style={{ fontSize: "0.82rem", color: "#12263b" }}>
                              #{String(t.id || "").slice(-7)}
                            </strong>
                            <span style={{
                              fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
                              color: pc.text, background: pc.bg, padding: "1px 7px", borderRadius: 999
                            }}>{t.priority}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600, color: "#2f3f52", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.category}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "#8a9bb5" }}>📍 {t.location}</p>
                        </div>
                        <span className={statusClass(t.status)} style={{ flexShrink: 0, fontSize: "0.72rem" }}>
                          {t.status.replaceAll("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            {/* Recent Activity */}
            <article style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e8eff8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#12263b" }}>Recent Activity</h2>
                <button
                  type="button"
                  onClick={() => navigate("/tech-tickets")}
                  style={{ background: "none", border: "none", color: "#0d766e", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <p style={{ color: "#8a9bb5", fontSize: "0.88rem" }}>Loading…</p>
              ) : recentActivity.length === 0 ? (
                <p style={{ color: "#8a9bb5", fontSize: "0.88rem", textAlign: "center", paddingTop: 24 }}>No ticket activity yet.</p>
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {recentActivity.map((t, i) => {
                    const sm = STATUS_META[t.status] || STATUS_META.OPEN;
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "10px 0",
                          borderBottom: i < recentActivity.length - 1 ? "1px solid #f0f4f9" : "none"
                        }}
                      >
                        {/* Status dot */}
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: sm.color, marginTop: 6, flexShrink: 0
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.82rem", color: "#12263b" }}>
                              #{String(t.id || "").slice(-7)} — {t.category}
                            </strong>
                            <span style={{ fontSize: "0.72rem", color: "#8a9bb5", flexShrink: 0, marginLeft: 8 }}>
                              {timeAgo(t.updatedAt || t.createdAt)}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 700, color: sm.color,
                              background: sm.color + "18", padding: "1px 8px", borderRadius: 999
                            }}>{sm.label}</span>
                            <span style={{ fontSize: "0.76rem", color: "#8a9bb5" }}>
                              {t.assignedTechnicianName
                                ? `→ ${t.assignedTechnicianName}`
                                : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </div>

          {/* Quick action bar */}
          <div style={{
            marginTop: 20, padding: "16px 20px",
            background: "#f8fafc", borderRadius: 14, border: "1px solid #e8eff8",
            display: "flex", gap: 12, alignItems: "center"
          }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8a9bb5", marginRight: 4 }}>QUICK ACTIONS</span>
            {[
              { label: "🔧 View All Tickets",   path: "/tech-tickets",     primary: true  },
              { label: "📊 Work Report",         path: "/tech-work-report", primary: false },
            ].map(a => (
              <button
                key={a.path}
                type="button"
                onClick={() => navigate(a.path)}
                style={{
                  padding: "8px 18px", borderRadius: 9,
                  border: a.primary ? "none" : "1px solid #d1dce9",
                  background: a.primary ? "linear-gradient(110deg,#0d766e,#15b593)" : "#fff",
                  color: a.primary ? "#fff" : "#3a516a",
                  fontSize: "0.84rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: a.primary ? "0 4px 12px rgba(13,118,110,0.25)" : "none"
                }}
              >{a.label}</button>
            ))}
          </div>

        </section>
      </div>
    </section>
  );
}
