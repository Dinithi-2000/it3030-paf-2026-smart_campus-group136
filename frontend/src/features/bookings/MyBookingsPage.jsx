// Author: Member 2 - Booking Management Module
import { useEffect, useState } from "react";
import { getMyBookings, updateBookingStatus } from "./bookingApi";

const STATUS_CLASSES = {
  PENDING: "status-pill status-in-progress",
  APPROVED: "status-pill status-approved",
  REJECTED: "status-pill status-delayed",
  CANCELLED: "status-pill status-cancelled"
};

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyBookings();
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

  const handleCancel = async (id) => {
    try {
      await updateBookingStatus(id, { status: "CANCELLED" });
      await loadBookings();
    } catch (err) {
      setError("Failed to cancel booking.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  return (
    <article className="ops-panel booking-card">
      <div className="ops-panel-head">
        <h2>My Bookings</h2>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : null}

      {bookings.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d2e3ef] bg-[#f7fafb] px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ddf4f0] text-[#0a6665]">
            <span className="text-lg font-bold">B</span>
          </div>
          <p className="text-base font-semibold text-[#27465f]">No bookings yet</p>
          <p className="mt-1 text-sm text-slate-500">Your upcoming reservations will appear here.</p>
        </div>
      ) : (
        <div className="ops-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource ID</th>
                <th>Purpose</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#f6fbfa]">
                  <td>{booking.resourceId}</td>
                  <td>{booking.purpose}</td>
                  <td>{formatDateTime(booking.startTime)}</td>
                  <td>{formatDateTime(booking.endTime)}</td>
                  <td>{booking.expectedAttendees ?? "-"}</td>
                  <td>
                    <span className={STATUS_CLASSES[booking.status] || "status-pill status-cancelled"}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === "APPROVED" ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                        className="booking-warn-btn"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
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

export default MyBookingsPage;
