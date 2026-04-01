import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  addComment,
  createTicket,
  deleteComment,
  fetchTickets,
  updateComment
} from "../api/tickets";

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const navItems = [
  { label: "Dashboard", to: "/", icon: "dashboard" },
  { label: "Resources", to: "/facilities", icon: "resources" },
  { label: "Booking", to: "/bookings", icon: "booking" },
  { label: "Ticketing", to: "/tickets", icon: "ticketing" },
  { label: "Notifications", to: "/notifications", icon: "notifications" },
  { label: "Analytics", to: "/admin", icon: "analytics" }
];

const userProfile = { userId: "student001", userName: "Google User", userRole: "USER" };

const initialForm = {
  resourceId: "",
  location: "",
  category: "",
  description: "",
  priority: "MEDIUM",
  preferredContact: "",
  attachments: []
};

function asLocalTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function ticketStatusClass(status) {
  return `ticket-status ticket-status-${String(status || "").toLowerCase()}`;
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
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [ticketForm, setTicketForm] = useState(initialForm);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentText, setEditingCommentText] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const currentUserId = localStorage.getItem("smartcampus.userId") || userProfile.userId;

  async function loadTickets() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTickets();
      setTickets(data);
      if (!selectedTicketId && data.length > 0) {
        setSelectedTicketId(data[0].id);
      }
      if (selectedTicketId && !data.some((item) => item.id === selectedTicketId)) {
        setSelectedTicketId(data[0]?.id || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("smartcampus.userId", userProfile.userId);
    localStorage.setItem("smartcampus.userName", userProfile.userName);
    localStorage.setItem("smartcampus.userRole", userProfile.userRole);
    loadTickets();
  }, []);

  async function handleTicketSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (ticketForm.attachments.length > 3) {
      setError("Only up to 3 images are allowed.");
      return;
    }

    try {
      const created = await createTicket(ticketForm);
      setMessage("Ticket created.");
      setTicketForm(initialForm);
      await loadTickets();
      setSelectedTicketId(created.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    if (!selectedTicket || !newComment.trim()) {
      return;
    }
    setError("");
    setMessage("");

    try {
      await addComment(selectedTicket.id, newComment.trim());
      setNewComment("");
      setMessage("Comment added.");
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  }

  async function handleSaveComment(commentId) {
    if (!selectedTicket || !editingCommentText.trim()) {
      return;
    }
    setError("");
    setMessage("");

    try {
      await updateComment(selectedTicket.id, commentId, editingCommentText.trim());
      setEditingCommentId("");
      setEditingCommentText("");
      setMessage("Comment updated.");
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update comment");
    }
  }

  async function handleDeleteComment(commentId) {
    if (!selectedTicket) {
      return;
    }
    setError("");
    setMessage("");

    try {
      await deleteComment(selectedTicket.id, commentId);
      setMessage("Comment deleted.");
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment");
    }
  }

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
            <span className="foot-icon">?</span>
            Support
          </button>
          <button type="button">
            <span className="foot-icon">*</span>
            Settings
          </button>
          <button type="button" className="danger">
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
            <button type="button" aria-label="Quick logout" className="logout-soft">
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M10 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 1 1 0-2h7V5h-7a1 1 0 0 1-1-1ZM13.7 12.7a1 1 0 0 0 0-1.4l-2-2a1 1 0 1 0-1.4 1.4L10.59 11H4a1 1 0 1 0 0 2h6.59l-.29.29a1 1 0 1 0 1.4 1.42l2-2.01Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="ops-user">
              <div>
                <strong>{userProfile.userName}</strong>
                <span>{userProfile.userRole}</span>
              </div>
              <div className="avatar">{userProfile.userName.charAt(0)}</div>
            </div>
          </div>
        </header>

        <section className="ops-content ticket-workspace">
          <h1>Service Tickets</h1>
          <p className="ops-subtitle">Resolving institutional bottlenecks with algorithmic precision.</p>

          {error ? <p className="ticket-alert ticket-alert-error">{error}</p> : null}
          {message ? <p className="ticket-alert ticket-alert-success">{message}</p> : null}

          <div className="ticket-grid">
            <article className="ticket-panel">
              <h3>Create Incident Ticket</h3>
              <form className="ticket-form" onSubmit={handleTicketSubmit}>
                <label>
                  Resource ID
                  <input
                    value={ticketForm.resourceId}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, resourceId: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Location
                  <input
                    value={ticketForm.location}
                    onChange={(event) => setTicketForm((current) => ({ ...current, location: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Category
                  <input
                    value={ticketForm.category}
                    onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={ticketForm.priority}
                    onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value }))}
                  >
                    {priorityOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred contact
                  <input
                    value={ticketForm.preferredContact}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, preferredContact: event.target.value }))
                    }
                    placeholder="email or phone"
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={ticketForm.description}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={4}
                    required
                  />
                </label>
                <label>
                  Evidence images (max 3)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setTicketForm((current) => ({
                        ...current,
                        attachments: Array.from(event.target.files || []).slice(0, 3)
                      }))
                    }
                  />
                </label>
                <button type="submit">Send Ticket</button>
              </form>
            </article>

            <article className="ticket-panel">
              <div className="ticket-panel-head">
                <h3>My Tickets</h3>
                <button type="button" onClick={loadTickets}>
                  Refresh
                </button>
              </div>
              {loading ? <p>Loading...</p> : null}
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`ticket-list-item${ticket.id === selectedTicketId ? " is-active" : ""}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div>
                      <strong>{ticket.category}</strong>
                      <p>{ticket.location}</p>
                    </div>
                    <span className={ticketStatusClass(ticket.status)}>{ticket.status}</span>
                  </button>
                ))}
                {!loading && tickets.length === 0 ? <p>No tickets yet.</p> : null}
              </div>
            </article>
          </div>

          <article className="ticket-panel ticket-detail">
            <h3>Selected Ticket</h3>
            {selectedTicket ? (
              <>
                <div className="ticket-meta-grid">
                  <p><strong>ID:</strong> {selectedTicket.id}</p>
                  <p><strong>Status:</strong> <span className={ticketStatusClass(selectedTicket.status)}>{selectedTicket.status}</span></p>
                  <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                  <p><strong>Created by:</strong> {selectedTicket.createdByName}</p>
                  <p><strong>Assigned technician:</strong> {selectedTicket.assignedTechnicianName || "Unassigned"}</p>
                  <p><strong>Created at:</strong> {asLocalTime(selectedTicket.createdAt)}</p>
                </div>

                <p className="ticket-description">{selectedTicket.description}</p>

                <p className="ops-subtitle">Track progress and communicate with support staff on your incident.</p>

                <section className="ticket-comments">
                  <h4>Comments</h4>
                  <form onSubmit={handleAddComment} className="ticket-comment-new">
                    <input
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder="Add a comment"
                    />
                    <button type="submit">Post</button>
                  </form>

                  <div className="ticket-comment-list">
                    {(selectedTicket.comments || []).map((comment) => (
                      <article key={comment.id} className="ticket-comment-item">
                        <div className="ticket-comment-head">
                          <strong>{comment.authorName}</strong>
                          <span>{comment.authorRole}</span>
                          <time>{asLocalTime(comment.updatedAt)}</time>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="ticket-comment-edit">
                            <input
                              value={editingCommentText}
                              onChange={(event) => setEditingCommentText(event.target.value)}
                            />
                            <button type="button" onClick={() => handleSaveComment(comment.id)}>
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId("");
                                setEditingCommentText("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p>{comment.content}</p>
                        )}

                        {comment.authorId === currentUserId ? (
                          <div className="ticket-comment-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.content);
                              }}
                            >
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteComment(comment.id)}>
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                    {(selectedTicket.comments || []).length === 0 ? <p>No comments yet.</p> : null}
                  </div>
                </section>
              </>
            ) : (
              <p>Select a ticket from the queue.</p>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}

export default TicketsPage;
