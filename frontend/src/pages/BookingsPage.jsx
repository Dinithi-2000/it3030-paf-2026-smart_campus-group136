// Author: Member 2 - Booking Management Module
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  createBooking,
  deleteBooking,
  fetchAllBookings,
  fetchMyBookings,
  updateBookingStatus
} from "../api/bookings";
import "./BookingsPage.css";

const INITIAL_FORM = {
  resourceId: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: ""
};

const RESOURCE_SUGGESTIONS = ["LAB-402", "HALL-2", "AUD-1", "LIB-1", "CSE-3"];

const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled"
};

const STATUS_ORDER = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return "-";
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startTime} - ${endTime}`;
  }
  return `${start.toLocaleString()} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function bookingStatusClass(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  return `status-pill booking-status booking-status-${normalized.toLowerCase()}`;
}

function BookingsPage() {
  const { user, roles } = useAuth();
  const isAdmin = roles?.includes("ADMIN");
  const currentUserId = user?.id || user?.username || "";
  const roleLabel = isAdmin
    ? "Admin"
    : roles?.[0]
    ? roles[0].toLowerCase().replace(/^./, (character) => character.toUpperCase())
    : "User";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const formRef = useRef(null);

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = isAdmin ? await fetchAllBookings() : await fetchMyBookings();
      const data = response.data || [];
      setBookings(data);
      if (!selectedBookingId && data.length > 0) {
        setSelectedBookingId(data[0].id);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (selectedBookingId) {
      const selected = bookings.find((booking) => String(booking.id) === String(selectedBookingId));
      if (selected && isAdmin) {
        setReviewReason(selected.rejectionReason || "");
      }
    }
  }, [bookings, selectedBookingId, isAdmin]);

  const visibleBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        const matchesSearch =
          !searchTerm.trim() ||
          [booking.id, booking.resourceId, booking.purpose, booking.userId, booking.status]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || String(booking.status || "").toUpperCase() === statusFilter;

        const matchesResource =
          !resourceFilter.trim() || normalize(booking.resourceId) === normalize(resourceFilter);

        return matchesSearch && matchesStatus && matchesResource;
      })
      .sort((left, right) => {
        const statusDelta = (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99);
        if (statusDelta !== 0) return statusDelta;
        return new Date(right.startTime) - new Date(left.startTime);
      });
  }, [bookings, searchTerm, statusFilter, resourceFilter]);

  const selectedBooking = useMemo(
    () => visibleBookings.find((booking) => String(booking.id) === String(selectedBookingId)) || null,
    [visibleBookings, selectedBookingId]
  );

  useEffect(() => {
    if (visibleBookings.length > 0 && !visibleBookings.some((booking) => String(booking.id) === String(selectedBookingId))) {
      setSelectedBookingId(visibleBookings[0].id);
    }
  }, [visibleBookings, selectedBookingId]);

  const draftConflicts = useMemo(() => {
    if (!form.resourceId.trim() || !form.startTime || !form.endTime) {
      return [];
    }

    const draftStart = new Date(form.startTime);
    const draftEnd = new Date(form.endTime);
    if (Number.isNaN(draftStart.getTime()) || Number.isNaN(draftEnd.getTime()) || draftEnd <= draftStart) {
      return [];
    }

    return bookings.filter(
      (booking) =>
        String(booking.status || "").toUpperCase() === "APPROVED" &&
        normalize(booking.resourceId) === normalize(form.resourceId) &&
        overlaps(form.startTime, form.endTime, booking.startTime, booking.endTime)
    );
  }, [bookings, form]);

  const visibleCount = visibleBookings.length;
  const pendingCount = bookings.filter((booking) => booking.status === "PENDING").length;
  const approvedCount = bookings.filter((booking) => booking.status === "APPROVED").length;

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleQuickPick = (resourceId) => {
    setForm((previous) => ({ ...previous, resourceId }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.resourceId.trim() || !form.startTime || !form.endTime || !form.purpose.trim()) {
      setError("Please complete all required booking fields.");
      return;
    }

    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError("End time must be after start time.");
      return;
    }

    if (draftConflicts.length > 0) {
      setError("This slot overlaps with an approved booking. Pick a different time.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        resourceId: form.resourceId.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null
      });

      setSuccess("Booking request submitted successfully.");
      setForm(INITIAL_FORM);
      await loadBookings();

      if (created?.data?.id) {
        setSelectedBookingId(created.data.id);
      }
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        setError("This resource is already booked for the selected time.");
      } else {
        setError(requestError?.response?.data?.message || "Failed to submit booking request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setBusyBookingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await updateBookingStatus(bookingId, { status: "APPROVED" });
      setSuccess("Booking approved.");
      await loadBookings();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to approve booking");
    } finally {
      setBusyBookingId("");
    }
  };

  const handleReject = async (bookingId) => {
    if (!reviewReason.trim()) {
      setError("Please enter a rejection reason before rejecting.");
      return;
    }

    setBusyBookingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await updateBookingStatus(bookingId, {
        status: "REJECTED",
        rejectionReason: reviewReason.trim()
      });
      setSuccess("Booking rejected.");
      setReviewReason("");
      await loadBookings();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to reject booking");
    } finally {
      setBusyBookingId("");
    }
  };

  const handleCancel = async (bookingId) => {
    setBusyBookingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await updateBookingStatus(bookingId, { status: "CANCELLED" });
      setSuccess("Booking cancelled.");
      await loadBookings();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setBusyBookingId("");
    }
  };

  const handleDelete = async (bookingId) => {
    setBusyBookingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await deleteBooking(bookingId);
      setSuccess("Booking deleted.");
      await loadBookings();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to delete booking");
    } finally {
      setBusyBookingId("");
    }
  };

  const handleResetDraft = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
    setReviewReason("");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submitDisabled =
    submitting || !form.resourceId.trim() || !form.startTime || !form.endTime || !form.purpose.trim() || draftConflicts.length > 0;

  const showSelectedAdminTools = isAdmin && selectedBooking && selectedBooking.status === "PENDING";
  const showSelectedCancel =
    !isAdmin && selectedBooking && selectedBooking.userId === currentUserId && selectedBooking.status === "APPROVED";

  return (
    <section className="booking-page">
      <header className="ops-panel booking-hero" ref={formRef}>
        <div className="booking-hero-copy">
          <p className="eyebrow">Module B</p>
          <h1>Booking Management Workspace</h1>
          <p className="booking-hero-text">
            Create reservations, preview overlap conflicts, and manage approvals or cancellations from one screen.
          </p>

          <div className="booking-chip-row">
            <span className="booking-chip booking-chip-strong">Role: {roleLabel}</span>
            <span className="booking-chip">Visible bookings: {visibleCount}</span>
            <span className="booking-chip">Pending: {pendingCount}</span>
            <span className="booking-chip">Approved: {approvedCount}</span>
          </div>
        </div>

        <div className="booking-hero-stats">
          <div className="booking-stat-card">
            <span className="booking-stat-label">Conflict preview</span>
            <strong>{draftConflicts.length}</strong>
            <span className="booking-stat-note">Approved overlaps detected in the current schedule snapshot</span>
          </div>
          <div className="booking-stat-card">
            <span className="booking-stat-label">Request status</span>
            <strong>Live</strong>
            <span className="booking-stat-note">Server-side validation still runs on submit</span>
          </div>
        </div>
      </header>

      {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}
      {success ? <div className="booking-alert booking-alert-success">{success}</div> : null}

      <div className="booking-grid">
        <article className="ops-panel booking-card booking-form-panel">
          <div className="ops-panel-head">
            <h2>Create Booking</h2>
            <button type="button" onClick={loadBookings} disabled={loading}>
              Refresh
            </button>
          </div>

          <form className="booking-form" onSubmit={handleCreateBooking}>
            <div className="booking-field">
              <label htmlFor="resourceId" className="booking-label">
                Resource ID
              </label>
              <input
                id="resourceId"
                name="resourceId"
                value={form.resourceId}
                onChange={handleFieldChange}
                className="booking-input"
                type="text"
                placeholder="e.g. LAB-402"
                list="booking-resources"
              />
              <datalist id="booking-resources">
                {RESOURCE_SUGGESTIONS.map((resourceId) => (
                  <option key={resourceId} value={resourceId} />
                ))}
              </datalist>
            </div>

            <div className="booking-chip-row booking-chip-row-wrap">
              {RESOURCE_SUGGESTIONS.map((resourceId) => (
                <button
                  key={resourceId}
                  type="button"
                  className={`booking-chip booking-resource-chip${normalize(form.resourceId) === normalize(resourceId) ? " booking-chip-active" : ""}`}
                  onClick={() => handleQuickPick(resourceId)}
                >
                  {resourceId}
                </button>
              ))}
            </div>

            <div className="booking-form-grid">
              <div className="booking-field">
                <label htmlFor="startTime" className="booking-label">
                  Start Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleFieldChange}
                  className="booking-input"
                  type="datetime-local"
                />
              </div>

              <div className="booking-field">
                <label htmlFor="endTime" className="booking-label">
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleFieldChange}
                  className="booking-input"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="booking-field">
              <label htmlFor="purpose" className="booking-label">
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleFieldChange}
                className="booking-textarea"
                rows={4}
                placeholder="Describe the event or use case"
              />
            </div>

            <div className="booking-field">
              <label htmlFor="expectedAttendees" className="booking-label">
                Expected Attendees
              </label>
              <input
                id="expectedAttendees"
                name="expectedAttendees"
                value={form.expectedAttendees}
                onChange={handleFieldChange}
                className="booking-input"
                type="number"
                min="1"
                placeholder="Optional"
              />
            </div>

            <div className="booking-conflict-box">
              <div className="booking-conflict-head">
                <h3>Conflict Checker</h3>
                <span>{draftConflicts.length > 0 ? `${draftConflicts.length} overlap(s)` : "No overlap detected"}</span>
              </div>

              {form.resourceId.trim() && form.startTime && form.endTime ? (
                draftConflicts.length > 0 ? (
                  <div className="booking-conflict-list">
                    {draftConflicts.map((booking) => (
                      <div key={booking.id} className="booking-conflict-item">
                        <strong>{booking.resourceId}</strong>
                        <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
                        <span>{booking.purpose}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="booking-summary-note">
                    No approved booking overlaps are visible in the current schedule snapshot.
                  </p>
                )
              ) : (
                <p className="booking-summary-note">
                  Fill the resource and time fields to preview conflicts before submitting.
                </p>
              )}
            </div>

            <div className="booking-actions">
              <button type="submit" className="booking-primary-btn" disabled={submitDisabled}>
                {submitting ? "Submitting..." : "Submit Booking"}
              </button>
              <button type="button" className="booking-secondary-btn" onClick={handleResetDraft}>
                Reset Draft
              </button>
            </div>
          </form>
        </article>

        <article className="ops-panel booking-card booking-list-panel">
          <div className="ops-panel-head">
            <h2>{isAdmin ? "All Bookings" : "My Bookings"}</h2>
            <button type="button" onClick={loadBookings} disabled={loading}>
              Reload
            </button>
          </div>

          <div className="booking-filter-bar">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="booking-input"
              placeholder="Search by resource, user, purpose, or status"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="booking-select"
            >
              <option value="ALL">All statuses</option>
              {Object.keys(STATUS_LABELS).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={resourceFilter}
              onChange={(event) => setResourceFilter(event.target.value)}
              className="booking-input"
              placeholder="Filter by resource"
            />
          </div>

          {loading ? (
            <div className="booking-empty booking-loading">
              <div className="booking-spinner" />
              <p>Loading bookings...</p>
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="booking-empty">
              <p className="booking-empty-title">No bookings found</p>
              <p className="booking-empty-text">Try changing the filters or create a new booking request.</p>
            </div>
          ) : (
            <div className="ops-table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    {isAdmin ? <th>User</th> : null}
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => {
                    const canCancel = !isAdmin && booking.userId === currentUserId && booking.status === "APPROVED";
                    const canApprove = isAdmin && booking.status === "PENDING";
                    const canDelete = isAdmin;

                    return (
                      <tr
                        key={booking.id}
                        className={String(selectedBookingId) === String(booking.id) ? "booking-row booking-row-active" : "booking-row"}
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <td>
                          <strong>{booking.resourceId}</strong>
                        </td>
                        <td>{formatTimeRange(booking.startTime, booking.endTime)}</td>
                        <td>
                          <div className="booking-purpose-cell">
                            <strong>{booking.purpose}</strong>
                            <span>{booking.expectedAttendees ?? "-"} attendees</span>
                          </div>
                        </td>
                        {isAdmin ? <td>{booking.userId}</td> : null}
                        <td>
                          <span className={bookingStatusClass(booking.status)}>{STATUS_LABELS[booking.status] || booking.status}</span>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="booking-table-actions">
                            <button type="button" className="booking-ghost-btn" onClick={() => setSelectedBookingId(booking.id)}>
                              View
                            </button>
                            {canApprove ? (
                              <button
                                type="button"
                                className="booking-success-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleApprove(booking.id)}
                              >
                                Approve
                              </button>
                            ) : null}
                            {canCancel ? (
                              <button
                                type="button"
                                className="booking-warn-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleCancel(booking.id)}
                              >
                                Cancel
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                className="booking-danger-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleDelete(booking.id)}
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <article className="ops-panel booking-card booking-detail-panel">
        <div className="ops-panel-head">
          <h2>Booking Details</h2>
          <button type="button" onClick={() => selectedBookingId && setSelectedBookingId(selectedBookingId)}>
            Focus
          </button>
        </div>

        {selectedBooking ? (
          <div className="booking-detail-grid">
            <div className="booking-detail-main">
              <div className="booking-detail-header">
                <div>
                  <p className="booking-detail-kicker">{selectedBooking.resourceId}</p>
                  <h3>{selectedBooking.purpose}</h3>
                </div>
                <span className={bookingStatusClass(selectedBooking.status)}>
                  {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>

              <div className="booking-detail-meta">
                <div>
                  <span>Requester</span>
                  <strong>{selectedBooking.userId}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{formatDateTime(selectedBooking.startTime)} - {formatDateTime(selectedBooking.endTime)}</strong>
                </div>
                <div>
                  <span>Attendees</span>
                  <strong>{selectedBooking.expectedAttendees ?? "-"}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatDateTime(selectedBooking.createdAt)}</strong>
                </div>
              </div>

              {selectedBooking.rejectionReason ? (
                <div className="booking-detail-note booking-detail-note-error">
                  <strong>Rejection reason:</strong> {selectedBooking.rejectionReason}
                </div>
              ) : null}
            </div>

            <div className="booking-detail-actions">
              {showSelectedAdminTools ? (
                <>
                  <label className="booking-field">
                    <span className="booking-label">Rejection reason</span>
                    <textarea
                      value={reviewReason}
                      onChange={(event) => setReviewReason(event.target.value)}
                      className="booking-textarea"
                      rows={4}
                      placeholder="Explain why this booking is being rejected"
                    />
                  </label>

                  <div className="booking-actions booking-actions-vertical">
                    <button
                      type="button"
                      className="booking-success-btn"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={() => handleApprove(selectedBooking.id)}
                    >
                      Approve booking
                    </button>
                    <button
                      type="button"
                      className="booking-danger-btn"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={() => handleReject(selectedBooking.id)}
                    >
                      Reject booking
                    </button>
                  </div>
                </>
              ) : null}

              {showSelectedCancel ? (
                <button
                  type="button"
                  className="booking-warn-btn"
                  disabled={busyBookingId === selectedBooking.id}
                  onClick={() => handleCancel(selectedBooking.id)}
                >
                  Cancel approved booking
                </button>
              ) : null}

              {isAdmin ? (
                <button
                  type="button"
                  className="booking-muted-btn"
                  disabled={busyBookingId === selectedBooking.id}
                  onClick={() => handleDelete(selectedBooking.id)}
                >
                  Delete booking
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="booking-empty booking-empty-compact">
            <p className="booking-empty-title">Select a booking</p>
            <p className="booking-empty-text">
              Choose a row from the list to inspect the booking details or run an approval action.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

export default BookingsPage;
