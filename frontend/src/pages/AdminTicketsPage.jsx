import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  addComment,
  assignTechnician,
  deleteComment,
  fetchTechnicians,
  fetchTickets,
  updateComment,
  updateTicketStatus
} from "../api/tickets";

const STATUS_FLOW = {
  OPEN: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: []
};

const ALL_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const PRIORITY_COLORS = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7c3aed" };

const navItems = [
  { label: "Dashboard", to: "/admin-dashboard", icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z" },
  { label: "Resources", to: "/facilities", icon: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z" },
  { label: "Booking", to: "/bookings", icon: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z" },
  { label: "Ticketing", to: "/tickets", icon: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z" },
  { label: "Notifications", to: "/notifications", icon: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z" },
  { label: "Analytics", to: "/admin", icon: "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z" }
];

function prettyDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString();
}
function shortDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}
function shortTime(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function statusClass(s) {
  return `status-pill status-${String(s || "open").toLowerCase().replaceAll("_", "-")}`;
}
function count(tickets, status) {
  return tickets.filter((t) => t.status === status).length;
}

function AdminTicketsPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const actorId = user?.id || user?.username || "";
  const isAdmin = roles?.includes("ADMIN");
  const isTech = roles?.includes("TECHNICIAN");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [assignment, setAssignment] = useState({ technicianId: "", technicianName: "" });
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");   // dropdown selection
  const [nextStatus, setNextStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId) || null, [tickets, selectedId]);

  const availableStatuses = useMemo(() => {
    if (!selectedTicket) return [];
    const all = STATUS_FLOW[selectedTicket.status] || [];
    return isAdmin ? all : all.filter((s) => s !== "REJECTED");
  }, [selectedTicket, isAdmin]);

  const canUpdateStatus = useMemo(() => {
    if (!selectedTicket) return false;
    if (isAdmin) return true;
    return isTech && selectedTicket.assignedTechnicianId === actorId;
  }, [selectedTicket, isAdmin, isTech, actorId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || String(t.id).toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q) ||
        t.createdByName?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTickets();
      setTickets(data || []);
      if (data?.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  // Load technicians list once
  useEffect(() => {
    fetchTechnicians().then(setTechnicians).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTicket) {
      setAssignment({ technicianId: "", technicianName: "" });
      setSelectedTechId("");
      setNextStatus(""); setResolutionNotes(""); setRejectionReason("");
      return;
    }
    const currentId = selectedTicket.assignedTechnicianId || "";
    setAssignment({
      technicianId:   currentId,
      technicianName: selectedTicket.assignedTechnicianName || ""
    });
    setSelectedTechId(currentId);
    setNextStatus(""); setResolutionNotes(selectedTicket.resolutionNotes || "");
    setRejectionReason(selectedTicket.rejectionReason || "");
  }, [selectedTicket?.id]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const refresh = (updated) => setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const handleAssign = async () => {
    if (!selectedTicket || !assignment.technicianId.trim()) {
      setError("Please select a technician."); return;
    }
    try {
      const updated = await assignTechnician(selectedTicket.id, {
        technicianId:   assignment.technicianId.trim(),
        technicianName: assignment.technicianName.trim()
      });
      refresh(updated); setError(""); flash(`Assigned to ${assignment.technicianName}`);
    } catch (err) { setError(err?.response?.data?.message || "Failed to assign technician"); }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !nextStatus) return;
    if (nextStatus === "RESOLVED" && !resolutionNotes.trim()) { setError("Resolution notes required."); return; }
    if (nextStatus === "REJECTED" && !rejectionReason.trim()) { setError("Rejection reason required."); return; }
    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: nextStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined
      });
      refresh(updated); setNextStatus(""); setError(""); flash(`Status updated to ${nextStatus}`);
    } catch (err) { setError(err?.response?.data?.message || "Failed to update status"); }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentDraft.trim()) return;
    try {
      const updated = await addComment(selectedTicket.id, commentDraft.trim());
      if (updated) refresh(updated); else await loadTickets();
      setCommentDraft("");
    } catch (err) { setError(err?.response?.data?.message || "Failed to add comment"); }
  };

  const handleUpdateComment = async () => {
    if (!selectedTicket || !editingCommentId || !editingContent.trim()) return;
    try {
      const updated = await updateComment(selectedTicket.id, editingCommentId, editingContent.trim());
      if (updated) refresh(updated); else await loadTickets();
      setEditingCommentId(""); setEditingContent("");
    } catch (err) { setError(err?.response?.data?.message || "Failed to update comment"); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTicket) return;
    try {
      const updated = await deleteComment(selectedTicket.id, commentId);
      if (updated) refresh(updated); else await loadTickets();
    } catch (err) { setError(err?.response?.data?.message || "Failed to delete comment"); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleExport = () => {
    const headers = ["ID", "Category", "Location", "Priority", "Status", "Reporter", "Created"];
    const rows = filteredTickets.map((t) => [t.id, t.category, t.location, t.priority, t.status, t.createdByName, prettyDate(t.createdAt)]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "admin-tickets.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <section className="ops-shell">
      {/* ── Sidebar ── */}
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">SC</div>
          <div>
            <h2>Operations Hub</h2>
            <p>ADMIN CONSOLE</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`}
            >
              <span className="menu-link-content">
                <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                  <path d={item.icon} fill="currentColor" />
                </svg>
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
                <strong>{user?.displayName || user?.username || "Admin"}</strong>
                <span>{roles?.[0] || "ADMIN"}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || "A").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          <section className="ticket-workspace ticketing-v2">

            {/* ── Page header ── */}
            <div className="ticket-page-head">
              <div>
                <h1>Ticketing &amp; Incidents <span className="admin-badge-label">ADMIN</span></h1>
                <p>Manage assignments, status workflow, and comment governance across all tickets.</p>
              </div>
              <div className="ticket-toolbar-actions">
                <button type="button" className="ticket-btn-light" onClick={handleExport}>Export CSV</button>
                <button type="button" className="ticket-btn-light" onClick={loadTickets}>↺ Refresh</button>
              </div>
            </div>

            {/* ── Alerts ── */}
            {error && <div className="ticket-alert" role="alert">{error}</div>}
            {success && <div className="ticket-success" role="status">{success}</div>}

            {/* ── KPI row ── */}
            <div className="ticket-kpi-row">
              <article className="ticket-kpi-card ticket-kpi-open">
                <p>Open</p>
                <h3>{count(tickets, "OPEN")}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-progress">
                <p>In Progress</p>
                <h3>{count(tickets, "IN_PROGRESS")}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-critical">
                <p>Critical</p>
                <h3>{tickets.filter((t) => t.priority === "CRITICAL").length}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-resolved">
                <p>Resolved</p>
                <h3>{count(tickets, "RESOLVED")}</h3>
              </article>
              <article className="ticket-kpi-card" style={{ borderLeft: "3px solid #64748b" }}>
                <p>Closed</p>
                <h3>{count(tickets, "CLOSED")}</h3>
              </article>
              <article className="ticket-kpi-card" style={{ borderLeft: "3px solid #f43f5e" }}>
                <p>Rejected</p>
                <h3>{count(tickets, "REJECTED")}</h3>
              </article>
            </div>

            {/* ── Main layout ── */}
            <div className="atk-layout">

              {/* Left: ticket table */}
              <article className="ticket-panel atk-table-panel">
                {/* Filters */}
                <div className="atk-filter-bar">
                  <input
                    type="search"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="atk-search"
                  />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Status</option>
                    {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
                  </select>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="ALL">All Priority</option>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {loading && <p className="atk-loading">Loading tickets from database…</p>}

                <div className="ticket-table-wrap">
                  <table className="ticket-grid-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Category / Location</th>
                        <th>Reporter</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => (
                        <tr
                          key={t.id}
                          className={selectedId === t.id ? "ticket-row-selected" : ""}
                          onClick={() => setSelectedId(t.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td><strong>#{String(t.id || "").slice(-7)}</strong></td>
                          <td>
                            <strong>{t.category}</strong>
                            <p style={{ margin: "2px 0 0", color: "#5f7391", fontSize: "0.82rem" }}>{t.location}</p>
                          </td>
                          <td style={{ fontSize: "0.88rem" }}>{t.createdByName || "-"}</td>
                          <td>
                            <span className="atk-priority-dot" style={{ "--dot-color": PRIORITY_COLORS[t.priority] || "#64748b" }}>
                              {t.priority}
                            </span>
                          </td>
                          <td><span className={statusClass(t.status)}>{t.status.replaceAll("_", " ")}</span></td>
                          <td>
                            <div className="ticket-date-cell">
                              <span>{shortDate(t.createdAt)}</span>
                              <small>{shortTime(t.createdAt)}</small>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && filteredTickets.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#8a9bb5" }}>No tickets found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="ticket-list-footer">
                  <span style={{ fontSize: "0.82rem", color: "#7a90ab" }}>{filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}</span>
                </div>
              </article>

              {/* Right: detail & operations */}
              <aside className="atk-detail-panel">
                {!selectedTicket ? (
                  <div className="atk-empty-state">
                    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
                      <rect x="6" y="8" width="36" height="32" rx="4" fill="#e8f0fe" />
                      <rect x="13" y="16" width="22" height="3" rx="1.5" fill="#93aed4" />
                      <rect x="13" y="22" width="16" height="3" rx="1.5" fill="#b5c8e8" />
                      <rect x="13" y="28" width="10" height="3" rx="1.5" fill="#c8d9f0" />
                    </svg>
                    <p>Select a ticket to manage</p>
                  </div>
                ) : (
                  <div className="atk-detail-scroll">
                    {/* Ticket header */}
                    <div className="atk-detail-header">
                      <div className="atk-detail-id">#{String(selectedTicket.id || "").slice(-7)}</div>
                      <span className="atk-priority-chip" style={{ background: PRIORITY_COLORS[selectedTicket.priority] + "22", color: PRIORITY_COLORS[selectedTicket.priority] }}>
                        {selectedTicket.priority}
                      </span>
                      <span className={statusClass(selectedTicket.status)}>{selectedTicket.status.replaceAll("_", " ")}</span>
                    </div>
                    <h3 className="atk-detail-title">{selectedTicket.category} — {selectedTicket.location}</h3>
                    <div className="atk-meta-row">
                      <span>🧑 {selectedTicket.createdByName}</span>
                      <span>📞 {selectedTicket.preferredContact}</span>
                      <span>🕐 {prettyDate(selectedTicket.createdAt)}</span>
                    </div>

                    <div className="atk-section">
                      <h4>Description</h4>
                      <p className="atk-desc">{selectedTicket.description}</p>
                    </div>

                    {/* Assignment */}
                    {isAdmin && (
                      <div className="atk-section">
                        <h4>Technician Assignment</h4>

                        {/* Current assignment status */}
                        <div className="atk-assigned-current">
                          {selectedTicket.assignedTechnicianName
                            ? (
                              <div className="atk-assigned-badge">
                                <span className="atk-assigned-chip">✓ {selectedTicket.assignedTechnicianName}</span>
                                <button
                                  type="button"
                                  className="ticket-btn-light atk-reassign-btn"
                                  onClick={() => { setSelectedTechId(""); setAssignment({ technicianId:"", technicianName:"" }); }}
                                >
                                  Reassign
                                </button>
                              </div>
                            )
                            : <span className="atk-unassigned">⚠ Unassigned — select a technician below</span>}
                        </div>

                        {/* Technician picker dropdown */}
                        <div className="atk-assign-form">
                          <div className="atk-tech-select-wrap">
                            <select
                              className="atk-tech-select"
                              value={selectedTechId}
                              onChange={(e) => {
                                const id  = e.target.value;
                                const tech = technicians.find(t => (t.id ?? t.username) === id);
                                setSelectedTechId(id);
                                setAssignment({
                                  technicianId:   id,
                                  technicianName: tech ? (tech.displayName || tech.username) : ""
                                });
                              }}
                            >
                              <option value="">— Select technician —</option>
                              {technicians.map((t) => {
                                const techId = t.id ?? t.username;
                                const name   = t.displayName || t.username;
                                return (
                                  <option key={techId} value={techId}>
                                    {name} ({t.username})
                                  </option>
                                );
                              })}
                            </select>
                            <svg className="atk-select-caret" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                            </svg>
                          </div>

                          {/* Show selected tech info card */}
                          {selectedTechId && (() => {
                            const tech = technicians.find(t => (t.id ?? t.username) === selectedTechId);
                            return tech ? (
                              <div className="atk-tech-preview">
                                <div className="atk-tech-avatar">
                                  {(tech.displayName || tech.username).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong>{tech.displayName || tech.username}</strong>
                                  <p>@{tech.username} · {tech.email || "No email"}</p>
                                </div>
                              </div>
                            ) : null;
                          })()}

                          <button
                            type="button"
                            className="ticket-btn-primary"
                            onClick={handleAssign}
                            disabled={!selectedTechId}
                          >
                            {selectedTicket.assignedTechnicianName ? "Reassign Technician" : "Assign Technician"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Workflow */}
                    {canUpdateStatus && availableStatuses.length > 0 && (
                      <div className="atk-section">
                        <h4>Workflow Update</h4>
                        <div className="atk-workflow-form">
                          <div className="atk-status-pills">
                            {availableStatuses.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={`atk-status-pill-btn${nextStatus === s ? " selected" : ""}`}
                                onClick={() => setNextStatus(nextStatus === s ? "" : s)}
                              >
                                {s.replaceAll("_", " ")}
                              </button>
                            ))}
                          </div>
                          {nextStatus === "RESOLVED" && (
                            <textarea
                              rows="3"
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Resolution notes (required)"
                            />
                          )}
                          {nextStatus === "REJECTED" && isAdmin && (
                            <textarea
                              rows="2"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Rejection reason (required)"
                            />
                          )}
                          {nextStatus && (
                            <button type="button" className="ticket-btn-primary" onClick={handleUpdateStatus}>
                              Confirm → {nextStatus.replaceAll("_", " ")}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {selectedTicket.attachments?.length > 0 && (
                      <div className="atk-section">
                        <h4>Attachments ({selectedTicket.attachments.length})</h4>
                        <div className="ticket-attachment-grid">
                          {selectedTicket.attachments.map((a) => (
                            <div key={a.id || a.fileName} className="ticket-attachment-tile">
                              <span>{(a.fileName || "FILE").slice(0, 3).toUpperCase()}</span>
                              <small>{a.fileName}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="atk-section">
                      <h4>Comments ({selectedTicket.comments?.length || 0})</h4>
                      <div className="ticket-comments ticket-comments-compact">
                        {(selectedTicket.comments || []).map((c) => {
                          const canEdit = isAdmin || c.authorId === actorId;
                          const editing = editingCommentId === c.id;
                          return (
                            <article key={c.id} className="ticket-comment">
                              <header>
                                <strong>{c.authorName}</strong>
                                <span style={{ fontSize: "0.72rem", background: "#e7effa", color: "#20456e", padding: "2px 7px", borderRadius: 999 }}>{c.authorRole}</span>
                                <small>{prettyDate(c.updatedAt || c.createdAt)}</small>
                              </header>
                              {editing ? (
                                <>
                                  <textarea rows="2" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                                  <div className="ticket-inline-actions">
                                    <button type="button" className="ticket-btn-primary" onClick={handleUpdateComment}>Save</button>
                                    <button type="button" className="ticket-btn-light" onClick={() => { setEditingCommentId(""); setEditingContent(""); }}>Cancel</button>
                                  </div>
                                </>
                              ) : (
                                <p>{c.content}</p>
                              )}
                              {canEdit && !editing && (
                                <div className="ticket-inline-actions">
                                  <button type="button" className="ticket-btn-light" onClick={() => { setEditingCommentId(c.id); setEditingContent(c.content); }}>Edit</button>
                                  <button type="button" className="ticket-btn-danger" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                                </div>
                              )}
                            </article>
                          );
                        })}
                        {!(selectedTicket.comments?.length) && <p style={{ color: "#8a9bb5", fontSize: "0.88rem" }}>No comments yet.</p>}
                      </div>
                      <div className="ticket-comment-form">
                        <textarea
                          rows="2"
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Add admin comment..."
                        />
                        <button type="button" className="ticket-btn-primary" onClick={handleAddComment}>Post Comment</button>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}

export default AdminTicketsPage;
