// Author: Member 3 - Technician Work Report Module
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchTickets } from "../api/tickets";
import DashboardShell from "../components/layout/DashboardShell";


const PRIORITY_COLOR = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#7c3aed"
};

function statusClass(s) {
  return `status-pill status-${String(s || "open").toLowerCase().replaceAll("_", "-")}`;
}

function shortDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function calcDuration(createdAt, updatedAt) {
  if (!createdAt || !updatedAt) return "-";
  const ms = new Date(updatedAt) - new Date(createdAt);
  if (isNaN(ms) || ms < 0) return "-";
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function TechWorkReportPage() {
  const { user, roles } = useAuth();
  const actorId = user?.id || user?.username || "";
  const actorName = user?.displayName || user?.username || "";

  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTickets();
        setAllTickets(data || []);
      } catch {
        setError("Could not load work report data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter to only my assigned tickets
  const myTickets = useMemo(
    () => allTickets.filter(
      t => t.assignedTechnicianId === actorId || t.assignedTechnicianName === actorName
    ),
    [allTickets, actorId, actorName]
  );

  // KPI stats
  const total = myTickets.length;
  const resolved = myTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const inProgress = myTickets.filter(t => t.status === "IN_PROGRESS").length;
  const open = myTickets.filter(t => t.status === "OPEN").length;
  const critical = myTickets.filter(t => t.priority === "CRITICAL").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Priority breakdown
  const priorityBreakdown = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(p => ({
    label: p,
    count: myTickets.filter(t => t.priority === p).length,
    color: PRIORITY_COLOR[p]
  }));

  // Category breakdown
  const categoryMap = {};
  myTickets.forEach(t => {
    const cat = t.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const resolved_tickets = myTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");

  return (
    <DashboardShell>
        <section className="ops-content">
          {/* Page Header */}
          <div className="ticket-page-head">
            <div>
              <h1>Work Report <span className="tech-badge-label">TECH</span></h1>
              <p>Summary of your assigned tickets and resolution performance.</p>
            </div>
            <button
              type="button"
              className="ticket-btn-light"
              onClick={() => window.print()}
            >
              🖨️ Print Report
            </button>
          </div>

          {error && <div className="ticket-alert">{error}</div>}

          {loading ? (
            <p style={{ color: "#6b8299", fontSize: "0.9rem" }}>Loading report…</p>
          ) : (
            <>
              {/* ── KPI Cards ── */}
              <div className="tech-kpi-row" style={{ marginBottom: 20 }}>
                <article className="tech-kpi-card" style={{ "--kpi-accent": "#3b82f6" }}>
                  <div className="tech-kpi-icon">📋</div>
                  <div>
                    <p>Total Assigned</p>
                    <h3>{total}</h3>
                  </div>
                </article>
                <article className="tech-kpi-card" style={{ "--kpi-accent": "#22c55e" }}>
                  <div className="tech-kpi-icon">✅</div>
                  <div>
                    <p>Resolved / Closed</p>
                    <h3>{resolved}</h3>
                  </div>
                </article>
                <article className="tech-kpi-card" style={{ "--kpi-accent": "#f59e0b" }}>
                  <div className="tech-kpi-icon">🔧</div>
                  <div>
                    <p>In Progress</p>
                    <h3>{inProgress}</h3>
                  </div>
                </article>
                <article className="tech-kpi-card" style={{ "--kpi-accent": "#ef4444" }}>
                  <div className="tech-kpi-icon">🚨</div>
                  <div>
                    <p>Critical</p>
                    <h3>{critical}</h3>
                  </div>
                </article>
                <article className="tech-kpi-card" style={{ "--kpi-accent": "#8b5cf6" }}>
                  <div className="tech-kpi-icon">📊</div>
                  <div>
                    <p>Resolution Rate</p>
                    <h3>{resolutionRate}%</h3>
                  </div>
                </article>
              </div>

              {/* ── Two-column breakdown ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* Priority breakdown */}
                <article className="ops-panel">
                  <div className="ops-panel-head">
                    <h2>Priority Breakdown</h2>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {priorityBreakdown.map(({ label, count, color }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", fontWeight: 600, marginBottom: 4 }}>
                          <span style={{ color }}>{label}</span>
                          <span style={{ color: "#3a516a" }}>{count} ticket{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: "#e8f0f8", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: total > 0 ? `${(count / total) * 100}%` : "0%",
                            background: color,
                            borderRadius: 4,
                            transition: "width 0.4s ease"
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Category breakdown */}
                <article className="ops-panel">
                  <div className="ops-panel-head">
                    <h2>Top Categories</h2>
                  </div>
                  {categoryBreakdown.length === 0 ? (
                    <p style={{ color: "#8a9bb5", fontSize: "0.88rem" }}>No data yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {categoryBreakdown.map(([cat, count]) => (
                        <div key={cat}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", fontWeight: 600, marginBottom: 4 }}>
                            <span style={{ color: "#2f3f52" }}>{cat}</span>
                            <span style={{ color: "#0d766e" }}>{count}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 4, background: "#e8f0f8", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: total > 0 ? `${(count / total) * 100}%` : "0%",
                              background: "linear-gradient(90deg, #15b593, #20cb9e)",
                              borderRadius: 4,
                              transition: "width 0.4s ease"
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>

              {/* ── Resolved Tickets Log ── */}
              <article className="ops-panel">
                <div className="ops-panel-head">
                  <h2>Resolved Ticket Log</h2>
                  <span style={{ fontSize: "0.8rem", color: "#8a9bb5", fontWeight: 600 }}>
                    {resolved_tickets.length} completed
                  </span>
                </div>
                {resolved_tickets.length === 0 ? (
                  <div className="tech-empty">
                    <span>📝</span>
                    <p>No resolved tickets yet. Keep up the work!</p>
                  </div>
                ) : (
                  <div className="ops-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Resolved</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolved_tickets.map(t => (
                          <tr key={t.id}>
                            <td><strong>#{String(t.id || "").slice(-7)}</strong></td>
                            <td>{t.category}</td>
                            <td style={{ color: "#5f7391", fontSize: "0.84rem" }}>{t.location}</td>
                            <td>
                              <span style={{
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: PRIORITY_COLOR[t.priority] || "#64748b",
                                background: (PRIORITY_COLOR[t.priority] || "#64748b") + "18",
                                padding: "2px 8px",
                                borderRadius: 999
                              }}>
                                {t.priority}
                              </span>
                            </td>
                            <td><span className={statusClass(t.status)}>{t.status.replaceAll("_", " ")}</span></td>
                            <td style={{ fontSize: "0.82rem" }}>{shortDate(t.createdAt)}</td>
                            <td style={{ fontSize: "0.82rem" }}>{shortDate(t.updatedAt)}</td>
                            <td style={{ fontSize: "0.82rem", color: "#0d766e", fontWeight: 600 }}>
                              {calcDuration(t.createdAt, t.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              {/* ── All My Tickets Log ── */}
              {myTickets.length === 0 && (
                <div className="tech-empty" style={{ marginTop: 16 }}>
                  <span>🎉</span>
                  <p>No tickets are currently assigned to you.</p>
                </div>
              )}
            </>
          )}
        </section>
    </DashboardShell>
  );
}

