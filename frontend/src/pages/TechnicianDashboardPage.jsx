import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchTickets } from "../api/tickets";
import TechSidebar from "../components/TechSidebar";



function shortDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function statusClass(s) {
  return `status-pill status-${String(s || "open").toLowerCase().replaceAll("_", "-")}`;
}

const PRIORITY_COLOR = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7c3aed" };

export default function TechnicianDashboardPage() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const actorId = user?.id || user?.username || "";

  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchTickets();   // returns all tickets now (TECHNICIAN role allowed)
        setTickets(all || []);
      } catch {
        setError("Could not load tickets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const open       = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved   = tickets.filter((t) => t.status === "RESOLVED").length;
  const critical   = tickets.filter((t) => t.priority === "CRITICAL").length;

  const recent = [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);

  return (
    <section className="ops-shell">
      <TechSidebar />

      {/* ── Main ── */}
      <div className="ops-main">
        <header className="ops-topbar">
          <input type="search" placeholder="Search tickets..." />
          <div className="ops-top-actions">
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Technician"}</strong>
                <span>{roles?.[0] || "TECHNICIAN"}</span>
              </div>
              <div className="avatar tech-avatar">{(user?.displayName || user?.username || "T").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          {/* Page head */}
          <div className="ticket-page-head">
            <div>
              <h1>My Dashboard <span className="tech-badge-label">TECH</span></h1>
              <p>View and manage your assigned maintenance tickets.</p>
            </div>
            <button type="button" className="ticket-btn-primary" onClick={() => navigate("/tech-tickets")}>
              View All Tickets →
            </button>
          </div>

          {error && <div className="ticket-alert">{error}</div>}

          {/* KPI cards */}
          <div className="tech-kpi-row">
            <article className="tech-kpi-card" style={{ "--kpi-accent": "#3b82f6" }}>
              <div className="tech-kpi-icon">📋</div>
              <div>
                <p>Assigned</p>
                <h3>{tickets.length}</h3>
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
            <article className="tech-kpi-card" style={{ "--kpi-accent": "#22c55e" }}>
              <div className="tech-kpi-icon">✅</div>
              <div>
                <p>Resolved</p>
                <h3>{resolved}</h3>
              </div>
            </article>
          </div>

          {/* Recent assigned tickets */}
          <div className="tech-section-head">
            <h2>Recent Assigned Tickets</h2>
            <button type="button" className="ticket-btn-light" onClick={() => navigate("/tech-tickets")}>
              See All
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#6b8299", fontSize: "0.9rem" }}>Loading your tickets…</p>
          ) : recent.length === 0 ? (
            <div className="tech-empty">
              <span>🎉</span>
              <p>No tickets assigned to you yet.</p>
            </div>
          ) : (
            <div className="tech-ticket-grid">
              {recent.map((t) => (
                <article
                  key={t.id}
                  className="tech-ticket-card"
                  onClick={() => navigate("/tech-tickets")}
                  style={{ "--card-accent": PRIORITY_COLOR[t.priority] || "#64748b" }}
                >
                  <div className="tech-card-top">
                    <span className="tech-ticket-id">#{String(t.id || "").slice(-6)}</span>
                    <span className={statusClass(t.status)}>{t.status.replaceAll("_", " ")}</span>
                  </div>
                  <h4>{t.category}</h4>
                  <p className="tech-card-loc">📍 {t.location}</p>
                  <div className="tech-card-foot">
                    <span className="tech-priority-dot" style={{ color: PRIORITY_COLOR[t.priority] }}>
                      ● {t.priority}
                    </span>
                    <small>{shortDate(t.updatedAt || t.createdAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
