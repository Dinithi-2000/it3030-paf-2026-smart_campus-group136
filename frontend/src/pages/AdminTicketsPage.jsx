import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  addComment,
  assignTechnician,
  deleteComment,
  fetchTickets,
  updateComment,
  updateTicketStatus
} from "../api/tickets";

const statusOptionsByCurrent = {
  OPEN: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: []
};

function prettyDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusClass(status) {
  return `status-pill status-${String(status || "open").toLowerCase().replaceAll("_", "-")}`;
}

function AdminTicketsPage() {
  const { user, roles } = useAuth();
  const actorId = user?.id || user?.username || "";
  const isAdmin = roles?.includes("ADMIN");
  const isTechnician = roles?.includes("TECHNICIAN");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [assignment, setAssignment] = useState({ technicianId: "", technicianName: "" });
  const [nextStatus, setNextStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId]
  );

  const availableNextStatuses = useMemo(() => {
    if (!selectedTicket) return [];
    const all = statusOptionsByCurrent[selectedTicket.status] || [];
    return isAdmin ? all : all.filter((status) => status !== "REJECTED");
  }, [selectedTicket, isAdmin]);

  const canUpdateStatus = useMemo(() => {
    if (!selectedTicket) return false;
    if (isAdmin) return true;
    if (!isTechnician) return false;
    return selectedTicket.assignedTechnicianId === actorId;
  }, [selectedTicket, isAdmin, isTechnician, actorId]);

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTickets(statusFilter ? { status: statusFilter } : {});
      setTickets(data || []);
      if (data?.length && !selectedId) {
        setSelectedId(data[0].id);
      }
      if (selectedId && data?.every((ticket) => ticket.id !== selectedId)) {
        setSelectedId(data[0]?.id || "");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedTicket) {
      setAssignment({ technicianId: "", technicianName: "" });
      setNextStatus("");
      setResolutionNotes("");
      setRejectionReason("");
      return;
    }

    setAssignment({
      technicianId: selectedTicket.assignedTechnicianId || "",
      technicianName: selectedTicket.assignedTechnicianName || ""
    });
    setNextStatus("");
    setResolutionNotes(selectedTicket.resolutionNotes || "");
    setRejectionReason(selectedTicket.rejectionReason || "");
  }, [selectedTicket?.id]);

  const refreshOne = (updatedTicket) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)));
  };

  const handleAssign = async () => {
    if (!selectedTicket) return;
    if (!assignment.technicianId.trim() || !assignment.technicianName.trim()) {
      setError("Technician ID and name are required for assignment.");
      return;
    }

    try {
      const updated = await assignTechnician(selectedTicket.id, {
        technicianId: assignment.technicianId.trim(),
        technicianName: assignment.technicianName.trim()
      });
      refreshOne(updated);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to assign technician");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !nextStatus) return;
    if (nextStatus === "RESOLVED" && !resolutionNotes.trim()) {
      setError("Resolution notes are required when marking RESOLVED.");
      return;
    }
    if (nextStatus === "REJECTED" && !rejectionReason.trim()) {
      setError("Rejection reason is required when marking REJECTED.");
      return;
    }

    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: nextStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined
      });
      refreshOne(updated);
      setNextStatus("");
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update ticket status");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentDraft.trim()) return;
    try {
      const updated = await addComment(selectedTicket.id, commentDraft.trim());
      if (updated) {
        refreshOne(updated);
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
        refreshOne(updated);
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
        refreshOne(updated);
      } else {
        await loadTickets();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete comment");
    }
  };

  return (
    <section className="ticket-workspace">
      <div className="ticket-page-head">
        <h1>Incident Ticketing - Admin Console</h1>
        <p>Manage assignments, status workflow, and comment governance across all maintenance tickets.</p>
      </div>

      {error ? <div className="ticket-alert">{error}</div> : null}

      <div className="ticket-grid">
        <article className="ticket-panel">
          <div className="ticket-list-head">
            <h2>All Tickets</h2>
            <div className="ticket-filter-row">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Status</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <button type="button" className="ticket-btn-light" onClick={loadTickets}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? <p>Loading tickets...</p> : null}
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                className={`ticket-row${selectedId === ticket.id ? " ticket-row-active" : ""}`}
                onClick={() => setSelectedId(ticket.id)}
                type="button"
              >
                <div>
                  <strong>{ticket.category}</strong>
                  <p>
                    {ticket.location} - {ticket.createdByName}
                  </p>
                </div>
                <span className={statusClass(ticket.status)}>{ticket.status}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="ticket-panel ticket-detail">
          <h2>Operations</h2>
          {!selectedTicket ? (
            <p>Select a ticket to start.</p>
          ) : (
            <>
              <div className="ticket-detail-grid">
                <p>
                  <strong>ID:</strong> {selectedTicket.id}
                </p>
                <p>
                  <strong>Priority:</strong> {selectedTicket.priority}
                </p>
                <p>
                  <strong>Status:</strong> <span className={statusClass(selectedTicket.status)}>{selectedTicket.status}</span>
                </p>
                <p>
                  <strong>Created:</strong> {prettyDate(selectedTicket.createdAt)}
                </p>
                <p>
                  <strong>Reporter:</strong> {selectedTicket.createdByName}
                </p>
                <p>
                  <strong>Contact:</strong> {selectedTicket.preferredContact}
                </p>
              </div>

              <p className="ticket-description">{selectedTicket.description}</p>

              <div className="ticket-subsection">
                <h3>Technician Assignment</h3>
                <div className="ticket-inline-form">
                  <input
                    value={assignment.technicianId}
                    onChange={(event) => setAssignment((prev) => ({ ...prev, technicianId: event.target.value }))}
                    placeholder="Technician ID"
                    disabled={!isAdmin}
                  />
                  <input
                    value={assignment.technicianName}
                    onChange={(event) => setAssignment((prev) => ({ ...prev, technicianName: event.target.value }))}
                    placeholder="Technician Name"
                    disabled={!isAdmin}
                  />
                  <button type="button" className="ticket-btn-primary" onClick={handleAssign} disabled={!isAdmin}>
                    Assign
                  </button>
                </div>
              </div>

              <div className="ticket-subsection">
                <h3>Workflow Update</h3>
                <div className="ticket-inline-form ticket-inline-form-stack">
                  <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} disabled={!canUpdateStatus}>
                    <option value="">Choose next status</option>
                    {availableNextStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows="3"
                    value={resolutionNotes}
                    onChange={(event) => setResolutionNotes(event.target.value)}
                    placeholder="Resolution notes (required for RESOLVED)"
                    disabled={!canUpdateStatus}
                  />

                  <textarea
                    rows="2"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Rejection reason (required for REJECTED, admin only)"
                    disabled={!isAdmin}
                  />

                  <button type="button" className="ticket-btn-primary" onClick={handleUpdateStatus} disabled={!canUpdateStatus}>
                    Update Status
                  </button>
                </div>
              </div>

              <div className="ticket-subsection">
                <h3>Attachments</h3>
                {selectedTicket.attachments?.length ? (
                  <ul className="ticket-meta-list">
                    {selectedTicket.attachments.map((item) => (
                      <li key={item.id || item.fileName}>
                        {item.fileName} ({Math.ceil((item.size || 0) / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No attachments available.</p>
                )}
              </div>

              <div className="ticket-subsection">
                <h3>Comments</h3>
                <div className="ticket-comments">
                  {(selectedTicket.comments || []).map((comment) => {
                    const canEdit = isAdmin || comment.authorId === actorId;
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <article key={comment.id} className="ticket-comment">
                        <header>
                          <strong>{comment.authorName}</strong>
                          <span>{comment.authorRole}</span>
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
                    rows="3"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add comment for this ticket..."
                  />
                  <button type="button" className="ticket-btn-primary" onClick={handleAddComment}>
                    Add Comment
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

export default AdminTicketsPage;
