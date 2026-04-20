// Author: Member 2 - Booking Management Module
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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

const baseNavItems = [
  { label: "Dashboard", to: "/", icon: "dashboard" },
  { label: "Resources", to: "/facilities", icon: "resources" },
  { label: "My Bookings", to: "/my-bookings", icon: "booking" },
  { label: "Ticketing", to: "/user-tickets", icon: "ticketing" },
  { label: "Notifications", to: "/notifications", icon: "notifications" },
  { label: "Analytics", to: "/admin", icon: "analytics" }
];

function navIcon(type) {
  const icons = {
    dashboard: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z",
    resources: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
    booking: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z",
    ledger: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 3v2h10V7H7Zm0 4v2h10v-2H7Zm0 4v2h6v-2H7Z",
    create: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
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

function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTimeWindow(startTime, endTime) {
  if (!startTime || !endTime) return "-";
  return `${formatTimeOnly(startTime)} - ${formatTimeOnly(endTime)}`;
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function bookingStatusClass(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  return `status-pill booking-status booking-status-${normalized.toLowerCase()}`;
}

function BookingsPage({ mode = "my" }) {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles?.includes("ADMIN");
  const isMyView = mode === "my";
  const isAdminView = isAdmin && mode === "admin-all";
  const isCreateView = isAdmin && mode === "create";
  const isAdminReviewView = isAdminView || (isAdmin && isMyView);
  const showCreatePanel = isCreateView || (isMyView && !isAdmin);
  const useSingleColumnGrid = showCreatePanel || isAdminReviewView;
  const navItems = baseNavItems;
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
  const [form, setForm] = useState(INITIAL_FORM);
  const formRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = isAdminReviewView || isCreateView ? await fetchAllBookings() : await fetchMyBookings();
      setBookings(response.data || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminReviewView, isCreateView]);

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
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        setError("Resource is already booked during the requested time.");
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

  const handleReject = async (bookingId, reasonOverride = "") => {
    const reason = reasonOverride.trim();

    if (!reason) {
      setError("Please enter a rejection reason before rejecting.");
      return;
    }

    setBusyBookingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await updateBookingStatus(bookingId, {
        status: "REJECTED",
        rejectionReason: reason
      });
      setSuccess("Booking rejected.");
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

  const handleQuickReject = async (booking) => {
    const reason = window.prompt(`Enter a rejection reason for booking ${booking.id}:`, booking.rejectionReason || "");
    if (reason === null) {
      return;
    }
    await handleReject(booking.id, reason);
  };

  const handleViewBooking = (bookingId) => {
    if (isAdminReviewView) {
      navigate(`/admin-booking/${bookingId}`);
      return;
    }
    navigate(`/booking/${bookingId}`);
  };

  const handleResetDraft = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submitDisabled =
    submitting || !form.resourceId.trim() || !form.startTime || !form.endTime || !form.purpose.trim() || draftConflicts.length > 0;

  return (
    <section className="ops-shell booking-shell">
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
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Global booking search..."
          />
          <div className="ops-top-actions">
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Campus User"}</strong>
                <span>{roles?.[0] || "USER"}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className={`ops-content booking-page${isAdminReviewView || isCreateView ? " booking-page-admin" : ""}`}>
          <header className="ops-panel booking-hero" ref={formRef}>
        <div className="booking-hero-copy">
          <p className="eyebrow">Module B</p>
          <h1>
            {isCreateView
              ? "Create Booking Workspace"
              : isAdminReviewView
              ? "All Bookings Command View"
              : "My Bookings Workspace"}
          </h1>
          <p className="booking-hero-text">
            {isCreateView
              ? "Create new booking requests with conflict checks and operational guardrails."
              : isAdminReviewView
              ? "Review all reservation traffic, inspect requests, and process approvals from one consolidated admin view."
              : "Create new booking requests and track status updates from your personal bookings workspace."}
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

      <div className={`booking-grid${useSingleColumnGrid ? " booking-grid-single" : ""}`}>
        {showCreatePanel ? (
          <article className="ops-panel booking-card booking-form-panel">
            <div className="ops-panel-head">
              <h2>{isCreateView ? "Create Booking" : "Create Booking Request"}</h2>
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
        ) : null}

        {!isCreateView ? (
        <article className={`ops-panel booking-card booking-list-panel${isAdminReviewView ? " booking-list-panel-admin" : ""}`}>
          <div className="ops-panel-head">
            <h2>{isAdminReviewView ? "All Bookings" : "My Bookings"}</h2>
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
              <table className={`booking-table${isAdminReviewView ? " booking-table-admin" : ""}`}>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Purpose</th>
                    {isAdminReviewView ? <th>Time</th> : <th>Date</th>}
                    {!isAdminReviewView ? <th>Time</th> : null}
                    {isAdminReviewView ? <th>User</th> : null}
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => {
                    const canCancel = !isAdmin && booking.userId === currentUserId && booking.status === "APPROVED";
                    const canApprove = isAdminReviewView && booking.status === "PENDING";
                    const canDelete = isAdminReviewView;

                    return (
                      <tr
                        key={booking.id}
                        className="booking-row"
                      >
                        <td>
                          <strong>{booking.resourceId}</strong>
                        </td>
                        <td>
                          <div className="booking-purpose-cell">
                            <strong>{booking.purpose}</strong>
                            <span>{booking.expectedAttendees ?? "-"} attendees</span>
                            {booking.rejectionReason ? <span>Reason: {booking.rejectionReason}</span> : null}
                          </div>
                        </td>
                        {isAdminReviewView ? <td>{formatTimeRange(booking.startTime, booking.endTime)}</td> : <td>{formatDateOnly(booking.startTime)}</td>}
                        {!isAdminReviewView ? <td>{formatTimeWindow(booking.startTime, booking.endTime)}</td> : null}
                        {isAdminReviewView ? <td>{booking.userId}</td> : null}
                        <td>
                          <span className={bookingStatusClass(booking.status)}>{STATUS_LABELS[booking.status] || booking.status}</span>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className={`booking-table-actions${isAdminReviewView ? " booking-table-actions-admin" : ""}`}>
                            <button type="button" className="booking-ghost-btn" onClick={() => handleViewBooking(booking.id)}>
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
                            {canApprove ? (
                              <button
                                type="button"
                                className="booking-danger-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleQuickReject(booking)}
                              >
                                Reject
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
        ) : null}
      </div>
        </section>
      </div>
    </section>
  );
}

export default BookingsPage;
