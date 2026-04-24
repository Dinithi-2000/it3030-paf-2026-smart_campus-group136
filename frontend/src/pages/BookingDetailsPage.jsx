import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMyBookings } from "../api/bookings";
import DashboardShell from "../components/layout/DashboardShell";
import "./BookingsPage.css";

const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled"
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function bookingStatusClass(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  return `status-pill booking-status booking-status-${normalized.toLowerCase()}`;
}

function BookingDetailsPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchMyBookings();
        setBookings(response.data || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const booking = useMemo(
    () => bookings.find((item) => String(item.id) === String(bookingId)) || null,
    [bookings, bookingId]
  );

  return (
    <DashboardShell>
      <section className="booking-page">
        <article className="ops-panel booking-card booking-detail-panel">
          <div className="ops-panel-head">
            <h2>Booking Details</h2>
            <button type="button" onClick={() => navigate("/my-bookings")}>
              Back to My Bookings
            </button>
          </div>

          {loading ? (
            <div className="booking-empty booking-empty-compact booking-loading">
              <div className="booking-spinner" />
              <p>Loading booking details...</p>
            </div>
          ) : error ? (
            <div className="booking-alert booking-alert-error">{error}</div>
          ) : !booking ? (
            <div className="booking-empty booking-empty-compact">
              <p className="booking-empty-title">Booking not found</p>
              <p className="booking-empty-text">This booking may have been removed or is unavailable.</p>
            </div>
          ) : (
            <div className="booking-detail-grid booking-grid-single">
              <div className="booking-detail-main">
                <div className="booking-detail-header">
                  <div>
                    <p className="booking-detail-kicker">{booking.resourceId}</p>
                    <h3>{booking.purpose}</h3>
                  </div>
                  <span className={bookingStatusClass(booking.status)}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>

                <div className="booking-detail-meta">
                  <div>
                    <span>Booking ID</span>
                    <strong>{booking.id}</strong>
                  </div>
                  <div>
                    <span>Time</span>
                    <strong>{formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}</strong>
                  </div>
                  <div>
                    <span>Attendees</span>
                    <strong>{booking.expectedAttendees ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatDateTime(booking.createdAt)}</strong>
                  </div>
                </div>

                {booking.rejectionReason ? (
                  <div className="booking-detail-note booking-detail-note-error">
                    <strong>Rejection reason:</strong> {booking.rejectionReason}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </article>
      </section>
    </DashboardShell>
  );
}

export default BookingDetailsPage;
