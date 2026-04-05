// Author: Member 2 - Booking Management Module
import { useEffect, useState } from "react";
import { deleteBooking, getAllBookings, updateBookingStatus } from "./bookingApi";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", resourceId: "" });
  const [rejectReasonById, setRejectReasonById] = useState({});

  const loadBookings = async (currentFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllBookings(currentFilters);
      setBookings(response.data ?? []);
    } catch (err) {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleApprove = async (id) => {
    await updateBookingStatus(id, { status: "APPROVED" });
    await loadBookings();
  };

  const handleReject = async (id) => {
    const reason = rejectReasonById[id] || "";
    await updateBookingStatus(id, { status: "REJECTED", rejectionReason: reason });
    setRejectReasonById((prev) => ({ ...prev, [id]: "" }));
    await loadBookings();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this booking?");
    if (!confirmed) {
      return;
    }
    await deleteBooking(id);
    await loadBookings();
  };

  const handleAction = async (action) => {
    setError("");
    try {
      await action();
    } catch (err) {
      setError("Action failed. Please try again.");
    }
  };

  const handleSearch = async () => {
    await loadBookings(filters);
  };

  return (
    <article className="ops-panel booking-card">
      <div className="ops-panel-head">
        <h2>Admin Bookings</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="booking-input !px-3 !py-2 !text-sm"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.filter((value) => value).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filters.resourceId}
          onChange={(event) => setFilters((prev) => ({ ...prev, resourceId: event.target.value }))}
          placeholder="Filter by Resource ID"
          className="booking-input !px-3 !py-2 !text-sm"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="booking-primary-btn !px-4 !py-2 !text-sm"
        >
          Search
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0a6665]" />
        </div>
      ) : (
        <div className="ops-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Resource ID</th>
                <th>User ID</th>
                <th>Purpose</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#f6fbfa]">
                  <td>{booking.id}</td>
                  <td>{booking.resourceId}</td>
                  <td>{booking.userId}</td>
                  <td>{booking.purpose}</td>
                  <td>{formatDateTime(booking.startTime)}</td>
                  <td>{formatDateTime(booking.endTime)}</td>
                  <td>{booking.status}</td>
                  <td>
                    <div className="booking-row-actions">
                      <button
                        type="button"
                        onClick={() => handleAction(() => handleApprove(booking.id))}
                        className="booking-success-btn"
                      >
                        Approve
                      </button>

                      <input
                        type="text"
                        value={rejectReasonById[booking.id] || ""}
                        onChange={(event) =>
                          setRejectReasonById((prev) => ({ ...prev, [booking.id]: event.target.value }))
                        }
                        placeholder="Reason"
                        className="booking-input !px-2 !py-1 !text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleAction(() => handleReject(booking.id))}
                        className="booking-danger-btn"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(() => handleDelete(booking.id))}
                        className="booking-muted-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default AdminBookingsPage;
