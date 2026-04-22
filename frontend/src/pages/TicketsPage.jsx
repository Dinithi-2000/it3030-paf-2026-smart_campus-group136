import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { addComment, createTicket, deleteComment, fetchTickets, updateComment } from "../api/tickets";

const categoryOptions = [
  "Projector Fault",
  "Network Issue",
  "Electrical",
  "Furniture Damage",
  "Air Conditioning",
  "Safety"
];

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const navItems = [
  { label: "Dashboard", to: "/", icon: "dashboard" },
  { label: "Resources", to: "/facilities", icon: "resources" },
  { label: "My Bookings", to: "/my-bookings", icon: "booking" },
  { label: "Ticketing", to: "/user-tickets", icon: "ticketing" },
  { label: "Notifications", to: "/notifications", icon: "notifications" },
  { label: "Analytics", to: "/admin", icon: "analytics" }
];

function prettyDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function shortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function shortTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
  return `status-pill status-${String(status || "open").toLowerCase().replaceAll("_", "-")}`;
}

function metricValue(tickets, targetStatus) {
  return tickets.filter((ticket) => ticket.status === targetStatus).length;
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

function TicketsPage() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const actorId = user?.id || user?.username || "";
  const isAdmin = roles?.includes("ADMIN");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusInfo, setShowStatusInfo] = useState(false);

  const generateResourceId = () => `RES-${Date.now()}`;

  const [form, setForm] = useState({
    resourceId: generateResourceId(),
    location: "",
    category: categoryOptions[0],
    description: "",
    priority: "MEDIUM",
    preferredContact: ""
  });
  const [attachments, setAttachments] = useState([]);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || null, [tickets, selectedId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        !searchTerm.trim() ||
        ticket.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tickets, searchTerm, priorityFilter, statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTickets();
      setTickets(data || []);
      if (!selectedId && data?.length) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    setError("");

    if (attachments.length > 3) {
      setError("Maximum 3 image attachments are allowed.");
      return;
    }

    if (attachments.some((file) => !file.type.startsWith("image/"))) {
      setError("Only image attachments are allowed.");
      return;
    }

    try {
      const created = await createTicket({ ...form, attachments });

      if (created?.id) {
        setTickets((prev) => {
          const withoutDuplicate = prev.filter((ticket) => ticket.id !== created.id);
          return [created, ...withoutDuplicate].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        setSelectedId(created.id);
      }

      setForm({
        resourceId: "",
        location: "",
        category: categoryOptions[0],
        description: "",
        priority: "MEDIUM",
        preferredContact: ""
      });
      setAttachments([]);
      setShowNewTicket(false);
      await loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create ticket");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentDraft.trim()) return;
    try {
      const updated = await addComment(selectedTicket.id, commentDraft.trim());
      if (updated) {
        setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
      } else {
        await loadTickets();
      }
      setCommentDraft("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add comment");
    }
  };

  const handleUpdateComment = async () => {
    if (!selectedTicket || !editingCommentId || !editingContent.trim()) return;
    try {
      const updated = await updateComment(selectedTicket.id, editingCommentId, editingContent.trim());
      if (updated) {
        setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
      } else {
        await loadTickets();
      }
      setEditingCommentId("");
      setEditingContent("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTicket) return;
    try {
      const updated = await deleteComment(selectedTicket.id, commentId);
      if (updated) {
        setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
      } else {
        await loadTickets();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleExportReport = () => {
    const headers = ["Ticket ID", "Category", "Location", "Priority", "Status", "Created At"];
    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      ticket.category,
      ticket.location,
      ticket.priority,
      ticket.status,
      prettyDate(ticket.createdAt)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ticket-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <section className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">SC</div>
          <div>
            <h2>Operations Hub</h2>
            <p>INTELLIGENT OBSERVATORIUM</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`}
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
            <span className="foot-icon">?</span>
            Support
          </button>
          <button type="button">
            <span className="foot-icon">*</span>
            Settings
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <input type="search" placeholder="Global system search..." />
          <div className="ops-top-actions">
            <button type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M12 3a6 6 0 0 0-6 6v3.6l-1.4 2.3a1 1 0 0 0 .86 1.51h13.08a1 1 0 0 0 .86-1.51L18 12.6V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button type="button" aria-label="Quick logout" className="logout-soft" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M10 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 1 1 0-2h7V5h-7a1 1 0 0 1-1-1ZM13.7 12.7a1 1 0 0 0 0-1.4l-2-2a1 1 0 1 0-1.4 1.4L10.59 11H4a1 1 0 1 0 0 2h6.59l-.29.29a1 1 0 1 0 1.4 1.42l2-2.01Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Campus User"}</strong>
                <span>{roles?.[0] || "USER"}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          <section className="ticket-workspace ticketing-v2">
            <div className="ticket-page-head">
              <div>
                <h1>Ticketing &amp; Incidents</h1>
                <p>Manage and track campus maintenance requests.</p>
              </div>
              <div className="ticket-toolbar-actions">
                <button type="button" className="ticket-btn-light" onClick={handleExportReport}>
                  Export Report
                </button>
                <button
                  type="button"
                  className="ticket-btn-primary"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, resourceId: generateResourceId() }));
                    setShowNewTicket(true);
                  }}
                >
                  + New Ticket
                </button>
              </div>
            </div>

            {error ? <div className="ticket-alert">{error}</div> : null}

            <div className="ticket-kpi-row">
              <article className="ticket-kpi-card ticket-kpi-open">
                <p>Open Tickets</p>
                <h3>{metricValue(tickets, "OPEN")}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-progress">
                <p>In Progress</p>
                <h3>{metricValue(tickets, "IN_PROGRESS")}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-critical">
                <p>Critical/Overdue</p>
                <h3>{tickets.filter((ticket) => ticket.priority === "CRITICAL").length}</h3>
              </article>
              <article className="ticket-kpi-card ticket-kpi-resolved">
                <p>Resolved Today</p>
                <h3>{metricValue(tickets, "RESOLVED")}</h3>
              </article>
            </div>

            {showNewTicket ? (
              <div className="ticket-modal-backdrop" onClick={() => setShowNewTicket(false)}>
                <article className="ticket-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="ticket-modal-header">
                    <h2>Create New Ticket</h2>
                    <button
                      type="button"
                      className="ticket-modal-close"
                      onClick={() => setShowNewTicket(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>
                  <form className="ticket-form" onSubmit={handleCreateTicket}>
                    <label>
                      Location
                      <input
                        value={form.location}
                        onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                        required
                      />
                    </label>
                    <div className="ticket-form-grid">
                      <label>
                        Category
                        <select
                          value={form.category}
                          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                        >
                          {categoryOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Priority
                        <select
                          value={form.priority}
                          onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                        >
                          {priorityOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Preferred Contact
                      <input
                        value={form.preferredContact}
                        onChange={(event) => setForm((prev) => ({ ...prev, preferredContact: event.target.value }))}
                        placeholder="Email or phone"
                        required
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows="4"
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Evidence Images (max 3)
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => setAttachments(Array.from(event.target.files || []).slice(0, 3))}
                      />
                    </label>
                    <div className="ticket-attachment-list">
                      {attachments.map((file) => (
                        <span key={file.name}>{file.name}</span>
                      ))}
                    </div>
                    <div className="ticket-modal-footer">
                      <button type="button" className="ticket-btn-light" onClick={() => setShowNewTicket(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="ticket-btn-primary">
                        Submit Ticket
                      </button>
                    </div>
                  </form>
                </article>
              </div>
            ) : null}

            <div className="ticket-main-layout">
              <article className="ticket-panel ticket-table-panel">
                <div className="ticket-filter-bar">
                  <input
                    type="search"
                    placeholder="Filter by ID or keyword..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                    <option value="ALL">Priority: All</option>
                    {priorityOptions.map((item) => (
                      <option key={item} value={item}>
                        Priority: {item}
                      </option>
                    ))}
                  </select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="ALL">Status: All</option>
                    <option value="OPEN">Status: OPEN</option>
                    <option value="IN_PROGRESS">Status: IN_PROGRESS</option>
                    <option value="RESOLVED">Status: RESOLVED</option>
                    <option value="CLOSED">Status: CLOSED</option>
                    <option value="REJECTED">Status: REJECTED</option>
                  </select>
                </div>

                {loading ? <p style={{ padding: "0 14px" }}>Loading tickets...</p> : null}

                <div className="ticket-table-wrap">
                  <table className="ticket-grid-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Subject / Location</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className={selectedId === ticket.id ? "ticket-row-selected" : ""}
                          onClick={() => setSelectedId(ticket.id)}
                        >
                          <td>
                            <strong>#{String(ticket.id || "").slice(-7)}</strong>
                          </td>
                          <td>
                            <strong>{ticket.category}</strong>
                            <p>{ticket.location}</p>
                          </td>
                          <td>
                            <span className="ticket-priority-chip">{ticket.priority}</span>
                          </td>
                          <td>
                            <span className={statusClass(ticket.status)}>{ticket.status.replaceAll("_", " ")}</span>
                          </td>
                          <td>
                            <div className="ticket-date-cell">
                              <span>{shortDate(ticket.createdAt)}</span>
                              <small>{shortTime(ticket.createdAt)}</small>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ticket-list-footer">
                  <button type="button" className="ticket-btn-light" onClick={loadTickets}>
                    Refresh
                  </button>
                </div>
              </article>

              <aside className="ticket-incident-detail">
                {!selectedTicket ? (
                  <p style={{ padding: "14px" }}>Select a ticket from the table to view detail.</p>
                ) : (
                  <>
                    <header className="ticket-incident-head">
                      <span className="ticket-id-chip">#{String(selectedTicket.id || "").slice(-7)}</span>
                      <span className="ticket-critical-chip">{selectedTicket.priority}</span>
                      <h3>
                        {selectedTicket.category} - {selectedTicket.location}
                      </h3>
                      <p>
                        {selectedTicket.createdByName} | {selectedTicket.preferredContact}
                      </p>
                    </header>

                    <section className="ticket-incident-section">
                      <h4>Description</h4>
                      <p>{selectedTicket.description}</p>
                    </section>

                    <section className="ticket-incident-section">
                      <h4>Attachments ({selectedTicket.attachments?.length || 0})</h4>
                      <div className="ticket-attachment-grid">
                        {(selectedTicket.attachments || []).slice(0, 3).map((item) => (
                          <div key={item.id || item.fileName} className="ticket-attachment-tile">
                            <span>{(item.fileName || "IMG").slice(0, 3).toUpperCase()}</span>
                            <small>{item.fileName}</small>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="ticket-incident-section">
                      <h4>Assignment</h4>
                      <p>{selectedTicket.assignedTechnicianName || "Unassigned"}</p>
                    </section>

                    <section className="ticket-incident-section">
                      <h4>Comment Thread</h4>
                      <div className="ticket-comments ticket-comments-compact">
                        {(selectedTicket.comments || []).map((comment) => {
                          const canEdit = isAdmin || comment.authorId === actorId;
                          const isEditing = editingCommentId === comment.id;
                          return (
                            <article key={comment.id} className="ticket-comment">
                              <header>
                                <strong>{comment.authorName}</strong>
                                <small>{prettyDate(comment.updatedAt || comment.createdAt)}</small>
                              </header>

                              {isEditing ? (
                                <>
                                  <textarea
                                    rows="2"
                                    value={editingContent}
                                    onChange={(event) => setEditingContent(event.target.value)}
                                  />
                                  <div className="ticket-inline-actions">
                                    <button type="button" className="ticket-btn-primary" onClick={handleUpdateComment}>
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="ticket-btn-light"
                                      onClick={() => {
                                        setEditingCommentId("");
                                        setEditingContent("");
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <p>{comment.content}</p>
                              )}

                              {canEdit && !isEditing ? (
                                <div className="ticket-inline-actions">
                                  <button
                                    type="button"
                                    className="ticket-btn-light"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingContent(comment.content);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="ticket-btn-danger"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>

                      <div className="ticket-comment-form">
                        <textarea
                          rows="2"
                          value={commentDraft}
                          onChange={(event) => setCommentDraft(event.target.value)}
                          placeholder="Add comment..."
                        />
                        <button type="button" className="ticket-btn-primary" onClick={handleAddComment}>
                          Update Thread
                        </button>
                      </div>
                    </section>

                    {showStatusInfo && (
                      <div className="ticket-status-info-box">
                        <strong>Current Status: </strong>
                        <span className={statusClass(selectedTicket.status)}>
                          {selectedTicket.status.replaceAll("_", " ")}
                        </span>
                        <p>
                          Status updates are handled by your assigned technician or admin.
                          {selectedTicket.assignedTechnicianName
                            ? ` Your technician is: ${selectedTicket.assignedTechnicianName}.`
                            : " No technician has been assigned yet."}
                        </p>
                        <button
                          type="button"
                          className="ticket-btn-light"
                          onClick={() => setShowStatusInfo(false)}
                        >
                          Close
                        </button>
                      </div>
                    )}

                    <div className="ticket-detail-actions">
                      <button
                        type="button"
                        className="ticket-btn-light"
                        onClick={() => {
                          setCommentDraft("");
                          setEditingCommentId("");
                          setEditingContent("");
                          setShowStatusInfo(false);
                        }}
                      >
                        Discard Changes
                      </button>
                      <button
                        type="button"
                        className="ticket-btn-primary"
                        onClick={() => setShowStatusInfo((prev) => !prev)}
                      >
                        View Status Info
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}

export default TicketsPage;
