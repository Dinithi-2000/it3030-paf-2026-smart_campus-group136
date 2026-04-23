import OperationsShell from "../components/layout/OperationsShell";

const STATUS_FLOW = {
  OPEN:        ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED:    [],
  CLOSED:      [],
  REJECTED:    []
};

const PRIORITY_COLOR = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7c3aed" };
const ALL_STATUSES   = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

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

export default function TechnicianTicketsPage() {
  const { user } = useAuth();
  const actorId   = user?.id   || user?.username || "";
  const actorName = user?.displayName || user?.username || "";

  // Data
  const [allTickets, setAllTickets] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  // UI state
  const [selectedId,    setSelectedId]    = useState("");
  const [viewMode,      setViewMode]      = useState("all");  // "all" | "mine"
  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [priorityFilter,setPriorityFilter]= useState("ALL");

  // Workflow
  const [nextStatus,     setNextStatus]      = useState("");
  const [resolutionNotes,setResolutionNotes] = useState("");

  // Comments
  const [commentDraft,  setCommentDraft]  = useState("");
  const [editingId,     setEditingId]     = useState("");
  const [editingContent,setEditingContent]= useState("");

  /* ── derived ── */
  const myTickets = useMemo(
    () => allTickets.filter(
      t => t.assignedTechnicianId === actorId || t.assignedTechnicianName === actorName
    ),
    [allTickets, actorId, actorName]
  );

  const baseTickets = viewMode === "mine" ? myTickets : allTickets;

  const filteredTickets = useMemo(() => {
    return baseTickets.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        String(t.id).toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.createdByName?.toLowerCase().includes(q);
      const matchStatus   = statusFilter   === "ALL" || t.status   === statusFilter;
      const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [baseTickets, searchTerm, statusFilter, priorityFilter]);

  const selectedTicket = useMemo(
    () => allTickets.find(t => t.id === selectedId) || null,
    [allTickets, selectedId]
  );

  const isAssignedToMe = useMemo(() =>
    selectedTicket &&
    (selectedTicket.assignedTechnicianId === actorId ||
     selectedTicket.assignedTechnicianName === actorName),
    [selectedTicket, actorId, actorName]
  );

  const availableStatuses = useMemo(() => {
    if (!selectedTicket || !isAssignedToMe) return [];
    return STATUS_FLOW[selectedTicket.status] || [];
  }, [selectedTicket, isAssignedToMe]);

  /* ── load all tickets from DB ── */
  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTickets();
      setAllTickets(data || []);
      if (data?.length && !selectedId) setSelectedId(data[0].id);
    } catch {
      setError("Failed to load tickets from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    if (!selectedTicket) { setNextStatus(""); setResolutionNotes(""); return; }
    setNextStatus("");
    setResolutionNotes(selectedTicket.resolutionNotes || "");
  }, [selectedTicket?.id]);

  const flash   = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const refresh = (updated) =>
    setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));

  /* ── handlers ── */
  const handleUpdateStatus = async () => {
    if (!selectedTicket || !nextStatus) return;
    if (nextStatus === "RESOLVED" && !resolutionNotes.trim()) {
      setError("Resolution notes required."); return;
    }
    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: nextStatus,
        resolutionNotes: resolutionNotes.trim() || undefined
      });
      refresh(updated); setNextStatus(""); setError("");
      flash(`Ticket marked as ${nextStatus}`);
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
    if (!selectedTicket || !editingId || !editingContent.trim()) return;
    try {
      const updated = await updateComment(selectedTicket.id, editingId, editingContent.trim());
      if (updated) refresh(updated); else await loadTickets();
      setEditingId(""); setEditingContent("");
    } catch (err) { setError(err?.response?.data?.message || "Failed to update comment"); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTicket) return;
    try {
      const updated = await deleteComment(selectedTicket.id, commentId);
      if (updated) refresh(updated); else await loadTickets();
    } catch (err) { setError(err?.response?.data?.message || "Failed to delete comment"); }
  };

  const navItems = [
    { label: "Dashboard", to: "/technician-dashboard", icon: "dashboard" },
    { label: "Tickets", to: "/tech-tickets", icon: "ticketing" },
    { label: "Facilities", to: "/facilities", icon: "resources" },
    { label: "Notifications", to: "/notifications", icon: "notifications" }
  ];

  return (
    <OperationsShell
      title="Ticketing (Technician)"
      subtitle="View all campus tickets. Update and reply on your assigned tickets."
      navItems={navItems}
    >
      <div className="ticket-page-head-actions">
        <button type="button" className="ticket-btn-light" onClick={loadTickets}>↺ Refresh</button>
      </div>

      {error   && <div className="ticket-alert"   role="alert">{error}</div>}
      {success && <div className="ticket-success" role="status">{success}</div>}

      <div className="tech-mini-kpis">
        {[
          { label: "Total",       val: allTickets.length,                                       color: "#3b82f6" },
          { label: "My Assigned", val: myTickets.length,                                        color: "#0d766e" },
          { label: "In Progress", val: allTickets.filter(t => t.status === "IN_PROGRESS").length, color: "#f59e0b" },
          { label: "Critical",    val: allTickets.filter(t => t.priority === "CRITICAL").length,  color: "#ef4444" },
          { label: "Resolved",    val: allTickets.filter(t => t.status === "RESOLVED").length,    color: "#22c55e" },
        ].map(k => (
          <div key={k.label} className="tech-mini-kpi" style={{ "--mk-color": k.color }}>
            <span>{k.val}</span>
            <p>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="atk-layout">
        <article className="ticket-panel atk-table-panel">
          <div className="tech-tab-bar">
            <button
              type="button"
              className={`tech-tab${viewMode === "all" ? " tech-tab-active" : ""}`}
              onClick={() => setViewMode("all")}
            >
              All Tickets
              <span className="tech-tab-count">{allTickets.length}</span>
            </button>
            <button
              type="button"
              className={`tech-tab${viewMode === "mine" ? " tech-tab-active" : ""}`}
              onClick={() => setViewMode("mine")}
            >
              My Assigned
              <span className="tech-tab-count">{myTickets.length}</span>
            </button>
          </div>

          <div className="atk-filter-bar">
            <input
              type="search"
              placeholder="Search by ID, category, location, reporter..."
              className="atk-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="ALL">All Priority</option>
              {["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <option key={p} value={p}>{p}</option>)}
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
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => {
                  const isMyRow = t.assignedTechnicianId === actorId || t.assignedTechnicianName === actorName;
                  return (
                    <tr
                      key={t.id}
                      className={`${selectedId === t.id ? "ticket-row-selected" : ""} ${isMyRow ? "tech-assigned-row" : ""}`}
                      onClick={() => setSelectedId(t.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>#{String(t.id || "").slice(-7)}</strong>
                        {isMyRow && <span className="tech-mine-badge">mine</span>}
                      </td>
                      <td>
                        <strong>{t.category}</strong>
                        <p style={{ margin:"2px 0 0", color:"#5f7391", fontSize:"0.82rem" }}>{t.location}</p>
                      </td>
                      <td style={{ fontSize:"0.86rem" }}>{t.createdByName || "-"}</td>
                      <td style={{ fontSize:"0.82rem", color: isMyRow ? "#0d766e" : "#6b7f99", fontWeight: isMyRow ? 700 : 400 }}>
                        {t.assignedTechnicianName || <span style={{ color:"#b0bec5" }}>Unassigned</span>}
                      </td>
                      <td>
                        <span className="atk-priority-dot" style={{ "--dot-color": PRIORITY_COLOR[t.priority] || "#64748b" }}>
                          {t.priority}
                        </span>
                      </td>
                      <td><span className={statusClass(t.status)}>{t.status.replaceAll("_"," ")}</span></td>
                      <td>
                        <div className="ticket-date-cell">
                          <span>{shortDate(t.createdAt)}</span>
                          <small>{shortTime(t.createdAt)}</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredTickets.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:"24px", color:"#8a9bb5" }}>
                    No tickets found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ticket-list-footer">
            <span style={{ fontSize:"0.82rem", color:"#7a90ab" }}>
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
              {viewMode === "all" && ` · ${myTickets.length} assigned to me`}
            </span>
          </div>
        </article>

        <aside className="atk-detail-panel">
          {!selectedTicket ? (
            <div className="atk-empty-state">
              <svg viewBox="0 0 48 48" width="48" height="48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#e8f0fe"/><rect x="13" y="16" width="22" height="3" rx="1.5" fill="#93aed4"/><rect x="13" y="22" width="16" height="3" rx="1.5" fill="#b5c8e8"/><rect x="13" y="28" width="10" height="3" rx="1.5" fill="#c8d9f0"/></svg>
              <p>Select a ticket to view details</p>
            </div>
          ) : (
            <div className="atk-detail-scroll">
              <div className="atk-detail-header">
                <div className="atk-detail-id">#{String(selectedTicket.id || "").slice(-7)}</div>
                <span className="atk-priority-chip"
                  style={{ background:(PRIORITY_COLOR[selectedTicket.priority]||"#64748b")+"22",
                           color: PRIORITY_COLOR[selectedTicket.priority]||"#64748b" }}>
                  {selectedTicket.priority}
                </span>
                <span className={statusClass(selectedTicket.status)}>
                  {selectedTicket.status.replaceAll("_"," ")}
                </span>
                {isAssignedToMe && <span className="atk-assigned-chip">✓ Assigned to me</span>}
              </div>

              <h3 className="atk-detail-title">{selectedTicket.category} — {selectedTicket.location}</h3>
              <div className="atk-meta-row">
                <span>🧑 {selectedTicket.createdByName}</span>
                <span>📞 {selectedTicket.preferredContact}</span>
                <span>🕐 {prettyDate(selectedTicket.createdAt)}</span>
              </div>

              <div className="atk-section">
                <h4>Assignment</h4>
                {selectedTicket.assignedTechnicianName
                  ? <span className="atk-assigned-chip">✓ {selectedTicket.assignedTechnicianName}</span>
                  : <span className="atk-unassigned">Not yet assigned</span>}
              </div>

              <div className="atk-section">
                <h4>Description</h4>
                <p className="atk-desc">{selectedTicket.description}</p>
              </div>

              {isAssignedToMe && availableStatuses.length > 0 && (
                <div className="atk-section">
                  <h4>Update Status</h4>
                  <div className="atk-workflow-form">
                    <div className="atk-status-pills">
                      {availableStatuses.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`atk-status-pill-btn${nextStatus === s ? " selected" : ""}`}
                          onClick={() => setNextStatus(nextStatus === s ? "" : s)}
                        >
                          {s.replaceAll("_"," ")}
                        </button>
                      ))}
                    </div>
                    {nextStatus === "RESOLVED" && (
                      <textarea
                        rows="3"
                        value={resolutionNotes}
                        onChange={e => setResolutionNotes(e.target.value)}
                        placeholder="Resolution notes (required)"
                      />
                    )}
                    {nextStatus && (
                      <button type="button" className="ticket-btn-primary" onClick={handleUpdateStatus}>
                        Confirm → {nextStatus.replaceAll("_"," ")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isAssignedToMe && (
                <div className="atk-section">
                  <div className="tech-not-assigned-notice">
                    ℹ️ This ticket is not assigned to you. Only the assigned technician can update its status.
                  </div>
                </div>
              )}

              <div className="atk-section">
                <h4>Comments ({selectedTicket.comments?.length || 0})</h4>
                <div className="ticket-comments ticket-comments-compact">
                  {(selectedTicket.comments || []).map(c => {
                    const isMine    = c.authorId === actorId;
                    const isEditing = editingId === c.id;
                    return (
                      <article key={c.id} className={`ticket-comment${isMine ? " tech-my-comment" : ""}`}>
                        <header>
                          <strong>{c.authorName}</strong>
                          <span style={{ fontSize:"0.72rem", background:"#e7effa", color:"#20456e", padding:"2px 7px", borderRadius:999 }}>
                            {c.authorRole}
                          </span>
                          <small>{prettyDate(c.updatedAt || c.createdAt)}</small>
                        </header>
                        {isEditing ? (
                          <>
                            <textarea rows="2" value={editingContent} onChange={e => setEditingContent(e.target.value)} />
                            <div className="ticket-inline-actions">
                              <button type="button" className="ticket-btn-primary" onClick={handleUpdateComment}>Save</button>
                              <button type="button" className="ticket-btn-light" onClick={() => { setEditingId(""); setEditingContent(""); }}>Cancel</button>
                            </div>
                          </>
                        ) : <p>{c.content}</p>}
                        {isMine && !isEditing && (
                          <div className="ticket-inline-actions">
                            <button type="button" className="ticket-btn-light" onClick={() => { setEditingId(c.id); setEditingContent(c.content); }}>Edit</button>
                            <button type="button" className="ticket-btn-danger" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {!(selectedTicket.comments?.length) && <p style={{ color:"#8a9bb5", fontSize:"0.88rem" }}>No comments yet.</p>}
                </div>

                <div className="ticket-comment-form" style={{ marginTop:"12px" }}>
                  <textarea
                    rows="3"
                    value={commentDraft}
                    onChange={e => setCommentDraft(e.target.value)}
                    placeholder="Add a technical note or reply..."
                  />
                  <button type="button" className="ticket-btn-primary" onClick={handleAddComment}>Post Reply</button>
                </div>
              </div>

              {selectedTicket.attachments?.length > 0 && (
                <div className="atk-section">
                  <h4>Attachments ({selectedTicket.attachments.length})</h4>
                  <div className="ticket-attachment-grid">
                    {selectedTicket.attachments.map(a => (
                      <div key={a.id || a.fileName} className="ticket-attachment-tile">
                        <span>{(a.fileName || "FILE").slice(0,3).toUpperCase()}</span>
                        <small>{a.fileName}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </OperationsShell>
  );
}
