// Author: Member 2
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";
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

function bookingStatusTone(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  const tones = {
    PENDING: {
      badge: "bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
      border: "border-l-4 border-amber-500"
    },
    APPROVED: {
      badge: "bg-green-100 text-green-800",
      dot: "bg-green-500",
      border: "border-l-4 border-green-500"
    },
    REJECTED: {
      badge: "bg-red-100 text-red-800",
      dot: "bg-red-500",
      border: "border-l-4 border-red-500"
    },
    CANCELLED: {
      badge: "bg-gray-200 text-gray-700",
      dot: "bg-gray-500",
      border: "border-l-4 border-gray-400"
    }
  };

  return tones[normalized] || tones.PENDING;
}

function adminStatusTone(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  const tones = {
    PENDING: {
      badge: "bg-amber-50 text-amber-700",
      dot: "bg-amber-400"
    },
    APPROVED: {
      badge: "bg-green-50 text-green-700",
      dot: "bg-green-400"
    },
    REJECTED: {
      badge: "bg-red-50 text-red-600",
      dot: "bg-red-400"
    },
    CANCELLED: {
      badge: "bg-gray-100 text-gray-500",
      dot: "bg-gray-400"
    }
  };

  return tones[normalized] || tones.PENDING;
}

function truncateText(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text || "-";
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function formatBookingModalDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function isRecentlyCreatedBooking(booking) {
  if (!booking || String(booking.status || "").toUpperCase() !== "PENDING" || !booking.createdAt) return false;

  const timestamp = new Date(booking.createdAt).getTime();
  if (Number.isNaN(timestamp)) return false;

  const recentWindowMs = 24 * 60 * 60 * 1000;
  return Date.now() - timestamp <= recentWindowMs;
}

function BookingsPage({ mode = "my" }) {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles?.includes("ADMIN");
  const isMyView = mode === "my" || mode === "student-my";
  const isAdminView = isAdmin && mode === "admin-all";
  const isCreateView = (isAdmin && mode === "create") || (!isAdmin && mode === "student-create");
  const isAdminReviewView = isAdminView || (isAdmin && isMyView);
  const isLegacyStudentMyView = !isAdmin && mode === "my";
  const showCreatePanel = isCreateView || isLegacyStudentMyView;
  const useSingleColumnGrid = showCreatePanel || isAdminReviewView;

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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [inlineRejectBookingId, setInlineRejectBookingId] = useState("");
  const [inlineRejectReason, setInlineRejectReason] = useState("");
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

  useEffect(() => {
    if (!selectedBooking) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedBooking(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBooking]);

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
  const rejectedCount = bookings.filter((booking) => booking.status === "REJECTED").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "CANCELLED").length;
  const isStudentBookingsView = !isAdmin && isMyView && !showCreatePanel;

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

  const handleDeleteFromModal = async () => {
    if (!selectedBooking) {
      return;
    }

    const confirmed = window.confirm(`Delete booking ${selectedBooking.id}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    await handleDelete(selectedBooking.id);
    setSelectedBooking(null);
  };

  const handleViewBooking = (booking) => {
    if (isAdminReviewView) {
      setSelectedBooking(booking);
      setRejectionReasonInput(booking.rejectionReason || "");
      return;
    }

    if (isMyView) {
      setSelectedBooking(booking);
      return;
    }

    navigate(`/booking/${booking.id}`);
  };

  const closeBookingModal = () => {
    setSelectedBooking(null);
    setRejectionReasonInput("");
    setInlineRejectBookingId("");
    setInlineRejectReason("");
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
    <DashboardShell
      searchPlaceholder="Global booking search..."
      searchValue={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
    >
        <section
          className={`ops-content booking-page${isAdminReviewView || isCreateView ? " booking-page-admin" : ""} ${isStudentBookingsView ? "min-h-screen rounded-3xl bg-slate-50 p-4 md:p-6" : ""} ${isAdminReviewView ? "min-h-screen bg-[#f9fafb] px-6 py-8" : ""}`}
        >
          {isStudentBookingsView ? (
            <header ref={formRef} className="mb-6 space-y-4">
              <div className="rounded-2xl bg-linear-to-r from-violet-300 to-purple-300 p-6 shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-50">Bookings</p>
                    <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">My Bookings</h1>
                    <p className="mt-2 text-sm text-violet-50 md:text-base">Manage your facility and resource reservations</p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/40">
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-2 h-2 w-8 rounded-full bg-violet-300" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Bookings</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{visibleCount}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-2 h-2 w-8 rounded-full bg-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-2 h-2 w-8 rounded-full bg-green-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-2 h-2 w-8 rounded-full bg-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cancelled</p>
                  <p className="mt-1 text-2xl font-bold text-slate-600">{cancelledCount}</p>
                </div>
              </div>
            </header>
          ) : isAdminReviewView ? (
            <header className="border-b border-[#e5e7eb] pb-6" ref={formRef}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6b7280]">Admin / Booking Management</p>
                  <h1 className="mt-2 text-2xl font-semibold text-[#111827]">Booking Management</h1>
                  <p className="mt-1 text-sm text-[#6b7280]">Review and manage all booking requests</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#111827] shadow-sm">
                    Total {visibleCount}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-[#6366f1]/40 px-4 py-2 text-sm font-medium text-[#6366f1] transition hover:bg-[#f3f4f6]"
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border-l-4 border-[#6366f1] bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#6b7280]">Total Bookings</p>
                  <p className="mt-2 text-2xl font-bold text-[#6366f1]">{visibleCount}</p>
                </div>
                <div className="rounded-xl border-l-4 border-[#854d0e] bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#6b7280]">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-[#854d0e]">{pendingCount}</p>
                </div>
                <div className="rounded-xl border-l-4 border-[#166534] bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#6b7280]">Approved</p>
                  <p className="mt-2 text-2xl font-bold text-[#166534]">{approvedCount}</p>
                </div>
                <div className="rounded-xl border-l-4 border-[#991b1b] bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#6b7280]">Rejected</p>
                  <p className="mt-2 text-2xl font-bold text-[#991b1b]">{rejectedCount}</p>
                </div>
              </div>
            </header>
          ) : (
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
                    : "Track status updates and manage your submitted booking requests from your personal bookings workspace."}
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
          )}

      {error ? <div className="booking-alert booking-alert-error">{error}</div> : null}
      {success ? <div className="booking-alert booking-alert-success">{success}</div> : null}

      <div className={`booking-grid${useSingleColumnGrid || isStudentBookingsView ? " booking-grid-single" : ""}`}>
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
        <article
          className={`booking-list-panel ${isAdminReviewView ? "space-y-6" : `ops-panel booking-card booking-list-panel${isAdminReviewView ? " booking-list-panel-admin" : ""}`} ${isStudentBookingsView ? "rounded-2xl border border-slate-200 bg-white p-4 shadow-md md:p-6" : ""}`}
        >
          {isAdminReviewView ? (
            <>
              <div className="relative rounded-xl bg-white p-6 shadow-sm">
                <button
                  type="button"
                  onClick={loadBookings}
                  disabled={loading}
                  className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Reload bookings"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M3 10a7 7 0 0 1 12-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 2v4h-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 10a7 7 0 0 1-12 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 18v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-center">
                  <div className="relative">
                    <svg
                      viewBox="0 0 20 20"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="9" r="6" />
                      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white pl-10 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
                      placeholder="Search by resource, user, purpose, or status"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
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
                    className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
                    placeholder="Filter by resource"
                  />

                  <button
                    type="button"
                    onClick={loadBookings}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[#0d9488]/40 bg-[#0d9488] px-5 text-sm font-medium text-white transition hover:bg-[#0b7f77] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Search
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="ops-panel-head">
                <h2 className={isStudentBookingsView ? "text-xl font-semibold text-slate-800" : ""}>{isAdminReviewView ? "All Bookings" : "My Bookings"}</h2>
                <button
                  type="button"
                  onClick={loadBookings}
                  disabled={loading}
                  className={
                    isStudentBookingsView
                      ? "rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      : ""
                  }
                >
                  Reload
                </button>
              </div>

              <div className={isStudentBookingsView ? "mb-4 flex flex-col gap-3 rounded-2xl bg-slate-100 p-4 md:flex-row md:items-center" : "booking-filter-bar"}>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={
                    isStudentBookingsView
                      ? "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none ring-0 transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 md:flex-2"
                      : "booking-input"
                  }
                  placeholder="Search by resource, user, purpose, or status"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={
                    isStudentBookingsView
                      ? "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 md:flex-1"
                      : "booking-select"
                  }
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
                  className={
                    isStudentBookingsView
                      ? "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 md:flex-1"
                      : "booking-input"
                  }
                  placeholder="Filter by resource"
                />

                {isStudentBookingsView ? (
                  <button
                    type="button"
                    onClick={loadBookings}
                    disabled={loading}
                    className="w-full rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                  >
                    Filter
                  </button>
                ) : null}
              </div>
            </>
          )}

          {loading ? (
            <div className="booking-empty booking-loading">
              <div className="booking-spinner" />
              <p>Loading bookings...</p>
            </div>
          ) : visibleBookings.length === 0 ? (
            isStudentBookingsView ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-500">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                    <path
                      d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h3V2Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-800">No bookings yet</p>
                <p className="mt-2 text-sm text-slate-500">Your booking requests will appear here</p>
                <button
                  type="button"
                  onClick={() => navigate("/create-booking")}
                  className="mt-5 rounded-xl bg-violet-300 px-5 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-400"
                >
                  Make a Booking
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-sm">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gray-50 text-gray-400">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                    <path
                      d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h3V2Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-600">No bookings found</p>
                <p className="mt-1 text-sm text-gray-400">Try adjusting your search filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setResourceFilter("");
                  }}
                  className="mt-5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700"
                >
                  Clear Filters
                </button>
              </div>
            )
          ) : (
            <div className={isAdminReviewView ? "overflow-x-auto rounded-xl bg-white shadow-sm" : isStudentBookingsView ? "overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm" : "ops-table-wrap"}>
              <table className={`${isAdminReviewView ? "min-w-full border-separate border-spacing-0" : isStudentBookingsView ? "min-w-195 w-full border-separate border-spacing-0" : `booking-table${isAdminReviewView ? " booking-table-admin" : ""}`}`}>
                <thead>
                  <tr>
                    <th className={isAdminReviewView ? "border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500" : isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Resource</th>
                    <th className={isAdminReviewView ? "border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500" : isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Purpose</th>
                    {isAdminReviewView ? <th className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th> : <th className={isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Date</th>}
                    {!isAdminReviewView ? <th className={isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Time</th> : null}
                    {isAdminReviewView ? <th className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th> : null}
                    <th className={isAdminReviewView ? "border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500" : isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Status</th>
                    <th className={isAdminReviewView ? "border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500" : isStudentBookingsView ? "bg-violet-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white" : ""}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => {
                    const canCancel = !isAdmin && booking.userId === currentUserId && booking.status === "APPROVED";
                    const canApprove = isAdminReviewView && booking.status === "PENDING";
                    const statusTone = bookingStatusTone(booking.status);
                    const adminTone = adminStatusTone(booking.status);
                    const isNewBooking = isAdminReviewView && isRecentlyCreatedBooking(booking);
                    const isInlineRejectOpen = isAdminReviewView && inlineRejectBookingId === booking.id;

                    return (
                      <tr
                        key={booking.id}
                        onClick={isAdminReviewView ? () => handleViewBooking(booking) : undefined}
                        className={
                          isAdminReviewView
                            ? "cursor-pointer border-b border-gray-100 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                            : isStudentBookingsView
                            ? `${statusTone.border} ${booking.id % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-violet-50`
                            : `booking-row${isNewBooking ? " booking-row-new" : ""}`
                        }
                      >
                        <td className={isAdminReviewView ? "px-6 py-5" : isStudentBookingsView ? "px-4 py-3 text-sm text-slate-700" : ""}>
                          <div className={isAdminReviewView ? "flex flex-col" : "booking-resource-cell"}>
                            <strong className={isAdminReviewView ? "text-sm font-semibold text-gray-900" : ""}>{booking.resourceId}</strong>
                            {isAdminReviewView ? <span className="mt-1 text-xs text-gray-400">{booking.expectedAttendees ?? "-"} attendees</span> : null}
                            {!isAdminReviewView && isNewBooking ? <span className="booking-new-badge">NEW</span> : null}
                          </div>
                        </td>
                        <td className={isAdminReviewView ? "max-w-88 px-6 py-5" : isStudentBookingsView ? "px-4 py-3 text-sm text-slate-700" : ""}>
                          <div className={isAdminReviewView ? "space-y-1 text-sm text-gray-600" : isStudentBookingsView ? "flex flex-col gap-1" : "booking-purpose-cell"} title={booking.purpose}>
                            {isAdminReviewView ? <span className="block truncate">{truncateText(booking.purpose, 40)}</span> : <strong>{booking.purpose}</strong>}
                            {!isAdminReviewView ? <span className={isStudentBookingsView ? "text-xs text-slate-500" : ""}>{booking.expectedAttendees ?? "-"} attendees</span> : null}
                            {isAdminReviewView && String(booking.status || "").toUpperCase() === "REJECTED" && booking.rejectionReason ? (
                              <span className="text-xs italic text-red-400">Reason: {truncateText(booking.rejectionReason, 40)}</span>
                            ) : booking.rejectionReason ? (
                              <span className={isStudentBookingsView ? "text-xs text-red-600" : ""}>Reason: {booking.rejectionReason}</span>
                            ) : null}
                          </div>
                        </td>
                        {isAdminReviewView ? (
                          <td className="px-6 py-5 text-sm text-gray-600">
                            <div className="flex flex-col">
                              <span>{formatDateOnly(booking.startTime)}</span>
                              <span className="mt-1 text-xs text-gray-400">{formatTimeWindow(booking.startTime, booking.endTime)}</span>
                            </div>
                          </td>
                        ) : (
                          <td className={isStudentBookingsView ? "px-4 py-3 text-sm text-slate-700" : ""}>{formatDateOnly(booking.startTime)}</td>
                        )}
                        {!isAdminReviewView ? <td className={isStudentBookingsView ? "px-4 py-3 text-sm text-slate-700" : ""}>{formatTimeWindow(booking.startTime, booking.endTime)}</td> : null}
                        {isAdminReviewView ? (
                          <td className="px-6 py-5 text-sm text-gray-700">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold uppercase text-indigo-700">
                                {String(booking.userId || "U").charAt(0)}
                              </span>
                              <span className="text-sm text-gray-700">{booking.userId}</span>
                            </div>
                          </td>
                        ) : null}
                        <td className={isAdminReviewView ? "px-6 py-5" : isStudentBookingsView ? "px-4 py-3" : ""}>
                          <span
                            className={
                              isAdminReviewView
                                ? `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${adminTone.badge}`
                                : isStudentBookingsView
                                ? `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusTone.badge}`
                                : `${bookingStatusClass(booking.status)}${isNewBooking ? " booking-status-new" : ""}`
                            }
                          >
                            {isAdminReviewView ? <span className={`h-1.5 w-1.5 rounded-full ${adminTone.dot}`} /> : isStudentBookingsView ? <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} /> : null}
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className={isAdminReviewView ? "px-6 py-5" : isStudentBookingsView ? "px-4 py-3" : ""} onClick={(event) => event.stopPropagation()}>
                          <div className={isAdminReviewView ? "flex flex-col gap-2" : isStudentBookingsView ? "flex flex-wrap items-center gap-2" : `booking-table-actions${isAdminReviewView ? " booking-table-actions-admin" : ""}`}>
                            {isAdminReviewView && canApprove ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors duration-150 hover:bg-green-100"
                                  disabled={busyBookingId === booking.id}
                                  onClick={() => handleApprove(booking.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:bg-red-100"
                                  disabled={busyBookingId === booking.id}
                                  onClick={() => {
                                    setInlineRejectBookingId((previous) => (previous === booking.id ? "" : booking.id));
                                    setInlineRejectReason(booking.rejectionReason || "");
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : null}

                            {isAdminReviewView && isInlineRejectOpen ? (
                              <div className="w-full">
                                <input
                                  type="text"
                                  value={inlineRejectReason}
                                  onChange={(event) => setInlineRejectReason(event.target.value)}
                                  placeholder="Enter rejection reason..."
                                  className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-gray-700 outline-none"
                                />
                                <button
                                  type="button"
                                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:bg-red-100"
                                  disabled={busyBookingId === booking.id}
                                  onClick={() => handleReject(booking.id, inlineRejectReason)}
                                >
                                  Confirm Reject
                                </button>
                              </div>
                            ) : null}

                            {isAdminReviewView && !canApprove ? (
                              <button
                                type="button"
                                className="w-fit rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                                onClick={() => handleViewBooking(booking)}
                              >
                                View
                              </button>
                            ) : null}

                            {!isAdminReviewView && canApprove ? (
                              <button
                                type="button"
                                className="booking-success-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleApprove(booking.id)}
                              >
                                Approve
                              </button>
                            ) : null}
                            {!isAdminReviewView && canApprove ? (
                              <button
                                type="button"
                                className="booking-danger-btn"
                                disabled={busyBookingId === booking.id}
                                onClick={() => {
                                  setInlineRejectBookingId((previous) => (previous === booking.id ? "" : booking.id));
                                  setInlineRejectReason(booking.rejectionReason || "");
                                }}
                              >
                                Reject
                              </button>
                            ) : null}
                            {canCancel ? (
                              <button
                                type="button"
                                className={
                                  isStudentBookingsView
                                    ? "rounded-lg border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500 hover:text-white"
                                    : "booking-warn-btn"
                                }
                                disabled={busyBookingId === booking.id}
                                onClick={() => handleCancel(booking.id)}
                              >
                                Cancel
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

      {selectedBooking && isAdminReviewView ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full justify-end bg-black/10">
          <div className="h-full w-full max-w-md transform overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 translate-x-0">
            <div className="flex items-start justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-500">Booking Details</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">#{selectedBooking.id}</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50"
                onClick={closeBookingModal}
                aria-label="Close booking details"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 5 15 15" strokeLinecap="round" />
                  <path d="M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-0 text-sm text-gray-600">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-400">Resource</p>
                <p className="mt-1 font-medium text-gray-900">{selectedBooking.resourceId}</p>
              </div>
              <div className="border-b border-gray-100 py-3">
                <p className="text-xs text-gray-400">Requester</p>
                <p className="mt-1 font-medium text-gray-900">{selectedBooking.userId}</p>
              </div>
              <div className="border-b border-gray-100 py-3">
                <p className="text-xs text-gray-400">Purpose</p>
                <p className="mt-1 text-gray-700">{selectedBooking.purpose}</p>
              </div>
              <div className="border-b border-gray-100 py-3">
                <p className="text-xs text-gray-400">Time</p>
                <p className="mt-1 text-gray-700">{formatTimeRange(selectedBooking.startTime, selectedBooking.endTime)}</p>
              </div>
              <div className="border-b border-gray-100 py-3">
                <p className="text-xs text-gray-400">Expected Attendees</p>
                <p className="mt-1 text-gray-700">{selectedBooking.expectedAttendees ?? "-"}</p>
              </div>
              <div className="py-3">
                <p className="text-xs text-gray-400">Current Status</p>
                <span className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${adminStatusTone(selectedBooking.status).badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${adminStatusTone(selectedBooking.status).dot}`} />
                  {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>

              <div>
                <label htmlFor="admin-rejection-reason" className="text-xs font-medium text-gray-500">
                  Rejection Reason
                </label>
                <textarea
                  id="admin-rejection-reason"
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(event) => setRejectionReasonInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-gray-700 outline-none"
                  placeholder="Enter reason if rejecting this booking"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                className="rounded-lg border border-[#bbf7d0] px-3 py-2 text-xs font-medium text-[#166534] transition hover:bg-[#dcfce7] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyBookingId === selectedBooking.id || selectedBooking.status !== "PENDING"}
                onClick={() => handleApprove(selectedBooking.id)}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#fecaca] px-3 py-2 text-xs font-medium text-[#991b1b] transition hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyBookingId === selectedBooking.id}
                onClick={() => handleReject(selectedBooking.id, rejectionReasonInput)}
              >
                Reject
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#d1d5db] px-3 py-2 text-xs font-medium text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyBookingId === selectedBooking.id}
                onClick={handleDeleteFromModal}
              >
                Delete
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {selectedBooking && !isAdminReviewView ? (
        <div className="booking-modal-backdrop" onClick={closeBookingModal} role="presentation">
          <article
            className="booking-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >
            <div className="booking-modal-head">
              <div>
                <p className="booking-detail-kicker">{selectedBooking.resourceId}</p>
                <h2 id="booking-modal-title">Booking Details</h2>
              </div>
              <button type="button" className="booking-modal-close" onClick={closeBookingModal} aria-label="Close booking details">
                ×
              </button>
            </div>

            <div className="booking-detail-grid booking-modal-grid">
              <div className="booking-detail-main">
                <div className="booking-detail-header">
                  <div>
                    <p className="booking-detail-kicker">Booking ID {selectedBooking.id}</p>
                    <h3>{selectedBooking.purpose}</h3>
                  </div>
                  <span className={bookingStatusClass(selectedBooking.status)}>
                    {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
                  </span>
                </div>

                <div className="booking-detail-meta booking-modal-meta">
                  <div>
                    <span>Requester</span>
                    <strong>{selectedBooking.userId}</strong>
                  </div>
                  <div>
                    <span>Resource</span>
                    <strong>{selectedBooking.resourceId}</strong>
                  </div>
                  <div>
                    <span>Start Time</span>
                    <strong>{formatBookingModalDateTime(selectedBooking.startTime)}</strong>
                  </div>
                  <div>
                    <span>End Time</span>
                    <strong>{formatBookingModalDateTime(selectedBooking.endTime)}</strong>
                  </div>
                  <div>
                    <span>Expected Attendees</span>
                    <strong>{selectedBooking.expectedAttendees ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatBookingModalDateTime(selectedBooking.createdAt)}</strong>
                  </div>
                </div>

                {isRecentlyCreatedBooking(selectedBooking) ? (
                  <div className="booking-detail-note booking-detail-note-new">
                    <strong>New booking:</strong> This reservation was just entered and is being highlighted for admin review.
                  </div>
                ) : null}

                <div className="booking-detail-note">
                  <strong>Purpose:</strong> {selectedBooking.purpose}
                </div>

                {selectedBooking.rejectionReason ? (
                  <div className="booking-detail-note booking-detail-note-error">
                    <strong>Rejection reason:</strong> {selectedBooking.rejectionReason}
                  </div>
                ) : null}

                {!isAdmin && selectedBooking.status !== "APPROVED" ? (
                  <div className="booking-modal-actions">
                    <button
                      type="button"
                      className="booking-danger-btn"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={handleDeleteFromModal}
                    >
                      {busyBookingId === selectedBooking.id ? "Deleting..." : "Delete Booking"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      ) : null}
        </section>
    </DashboardShell>
  );
}

export default BookingsPage;
