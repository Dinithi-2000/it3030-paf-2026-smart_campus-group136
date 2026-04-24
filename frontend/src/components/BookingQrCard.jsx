import { useMemo, useState } from "react";

function BookingQrCard({ booking }) {
  const [imageFailed, setImageFailed] = useState(false);

  const payload = useMemo(() => {
    if (!booking?.id) return "";
    return `BOOKING:${booking.id}:USER:${booking.userId}`;
  }, [booking]);

  const qrUrl = useMemo(() => {
    if (!payload) return "";
    return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(payload)}`;
  }, [payload]);

  if (!booking || String(booking.status || "").toUpperCase() !== "APPROVED") {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#f8fafc"
      }}
    >
      <h4 style={{ margin: "0 0 8px", fontSize: 16 }}>Check-In QR</h4>
      <p style={{ margin: "0 0 12px", color: "#475569", fontSize: 14 }}>
        Show this at entry for simple verification.
      </p>

      {!imageFailed && qrUrl ? (
        <img
          src={qrUrl}
          alt="Booking QR"
          width={220}
          height={220}
          style={{ display: "block", borderRadius: 8, background: "#fff" }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px dashed #94a3b8",
            background: "#fff",
            color: "#334155"
          }}
        >
          QR preview unavailable right now. Use this code instead:
          <div style={{ marginTop: 8, fontWeight: 600 }}>{payload}</div>
        </div>
      )}

      <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 12 }}>
        Booking ID: {booking.id}
      </p>
    </div>
  );
}

export default BookingQrCard;
