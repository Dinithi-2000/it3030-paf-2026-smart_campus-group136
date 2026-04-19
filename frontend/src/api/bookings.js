// Author: Member 2 - Booking Management Module
import client from "./client";

const MOCK_KEY = "smartcampus.mockBookings.v1";

function createHttpError(status, message) {
  const error = new Error(message);
  error.response = {
    status,
    data: { message }
  };
  return error;
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function currentActor() {
  const user = safeParse(localStorage.getItem("user"), null);
  const roles = safeParse(localStorage.getItem("roles"), []);

  const userId = user?.id || user?.username || "student001";
  const userName = user?.displayName || user?.username || "Campus User";
  const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : "USER";

  return { userId, userName, role };
}

function nowIso() {
  return new Date().toISOString();
}

function makeBookingId() {
  return `BK-${Date.now()}`;
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function seedBookings() {
  const { userId, userName } = currentActor();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setMinutes(0, 0, 0);

  const slot1Start = new Date(tomorrow);
  slot1Start.setHours(10, 0, 0, 0);
  const slot1End = new Date(tomorrow);
  slot1End.setHours(11, 0, 0, 0);

  const slot2Start = new Date(tomorrow);
  slot2Start.setHours(10, 30, 0, 0);
  const slot2End = new Date(tomorrow);
  slot2End.setHours(11, 30, 0, 0);

  return [
    {
      id: makeBookingId(),
      resourceId: "LAB-402",
      userId,
      startTime: slot1Start.toISOString(),
      endTime: slot1End.toISOString(),
      purpose: "Project demo rehearsal",
      expectedAttendees: 18,
      status: "APPROVED",
      rejectionReason: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: makeBookingId(),
      resourceId: "LAB-402",
      userId: "student002",
      startTime: slot2Start.toISOString(),
      endTime: slot2End.toISOString(),
      purpose: "Group consultation",
      expectedAttendees: 12,
      status: "APPROVED",
      rejectionReason: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: makeBookingId(),
      resourceId: "HALL-2",
      userId,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0, 0, 0).toISOString(),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30, 0, 0).toISOString(),
      purpose: "Guest lecture",
      expectedAttendees: 64,
      status: "PENDING",
      rejectionReason: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ];
}

function readMockBookings() {
  const raw = localStorage.getItem(MOCK_KEY);
  if (!raw) {
    const seeded = seedBookings();
    localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const seeded = seedBookings();
      localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = seedBookings();
    localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeMockBookings(bookings) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(bookings));
}

function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

function applyFilters(bookings, filters = {}, role = currentActor().role) {
  const resourceId = String(filters.resourceId || "").trim().toLowerCase();
  const status = normalizeStatus(filters.status);
  const query = String(filters.query || "").trim().toLowerCase();
  const { userId } = currentActor();

  return bookings
    .filter((booking) => {
      if (role !== "ADMIN" && booking.userId !== userId) {
        return false;
      }

      if (status && status !== "ALL" && booking.status !== status) {
        return false;
      }

      if (resourceId && String(booking.resourceId || "").toLowerCase() !== resourceId) {
        return false;
      }

      if (query) {
        const haystack = [booking.id, booking.resourceId, booking.userId, booking.purpose, booking.status]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function toQueryParams(filters = {}) {
  const params = {};

  if (filters.status && String(filters.status).trim() && String(filters.status).trim().toUpperCase() !== "ALL") {
    params.status = String(filters.status).trim();
  }

  if (filters.resourceId && String(filters.resourceId).trim()) {
    params.resourceId = String(filters.resourceId).trim();
  }

  return params;
}

async function requestWithFallback(requestFn, fallbackFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error?.response) {
      throw error;
    }
    return fallbackFn();
  }
}

export async function fetchMyBookings() {
  return requestWithFallback(
    () => client.get("/bookings"),
    () => ({ data: applyFilters(readMockBookings(), {}, currentActor().role) })
  );
}

export async function fetchAllBookings(filters = {}) {
  return requestWithFallback(
    () => client.get("/bookings", { params: toQueryParams(filters) }),
    () => ({ data: applyFilters(readMockBookings(), filters, "ADMIN") })
  );
}

export async function createBooking(payload) {
  const requestBody = {
    resourceId: String(payload.resourceId || "").trim(),
    startTime: payload.startTime,
    endTime: payload.endTime,
    purpose: String(payload.purpose || "").trim(),
    expectedAttendees: payload.expectedAttendees ?? null
  };

  return requestWithFallback(
    () => client.post("/bookings", requestBody),
    () => {
      const { userId } = currentActor();
      const bookings = readMockBookings();
      const conflictExists = bookings.some(
        (booking) =>
          booking.resourceId === requestBody.resourceId &&
          booking.status === "APPROVED" &&
          overlaps(requestBody.startTime, requestBody.endTime, booking.startTime, booking.endTime)
      );

      if (conflictExists) {
        throw createHttpError(409, "Resource is already booked during the requested time.");
      }

      const created = {
        id: makeBookingId(),
        resourceId: requestBody.resourceId,
        userId,
        startTime: requestBody.startTime,
        endTime: requestBody.endTime,
        purpose: requestBody.purpose,
        expectedAttendees: requestBody.expectedAttendees,
        status: "PENDING",
        rejectionReason: null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      writeMockBookings([created, ...bookings]);
      return { data: created };
    }
  );
}

export async function updateBookingStatus(bookingId, payload) {
  const requestBody = {
    status: normalizeStatus(payload.status),
    rejectionReason: String(payload.rejectionReason || "").trim() || null
  };

  return requestWithFallback(
    () => client.patch(`/bookings/${bookingId}/status`, payload),
    () => {
      const { userId, role } = currentActor();
      const bookings = readMockBookings();
      const index = bookings.findIndex((booking) => String(booking.id) === String(bookingId));

      if (index === -1) {
        throw createHttpError(404, "Booking not found");
      }

      const booking = bookings[index];

      if (role === "ADMIN") {
        if (requestBody.status === "APPROVED") {
          booking.status = "APPROVED";
          booking.rejectionReason = null;
        } else if (requestBody.status === "REJECTED") {
          if (!requestBody.rejectionReason) {
            throw createHttpError(400, "Rejection reason is required when rejecting a booking.");
          }
          booking.status = "REJECTED";
          booking.rejectionReason = requestBody.rejectionReason;
        } else {
          throw createHttpError(403, "Not allowed");
        }
      } else if (role === "USER") {
        if (booking.userId !== userId || booking.status !== "APPROVED" || requestBody.status !== "CANCELLED") {
          throw createHttpError(403, "Not allowed");
        }
        booking.status = "CANCELLED";
      } else {
        throw createHttpError(403, "Not allowed");
      }

      booking.updatedAt = nowIso();
      bookings[index] = booking;
      writeMockBookings(bookings);
      return { data: booking };
    }
  );
}

export async function deleteBooking(bookingId) {
  return requestWithFallback(
    () => client.delete(`/bookings/${bookingId}`),
    () => {
      const { role } = currentActor();
      if (role !== "ADMIN") {
        throw createHttpError(403, "Not allowed");
      }

      const bookings = readMockBookings();
      const nextBookings = bookings.filter((booking) => String(booking.id) !== String(bookingId));
      if (nextBookings.length === bookings.length) {
        throw createHttpError(404, "Booking not found");
      }

      writeMockBookings(nextBookings);
      return { data: null };
    }
  );
}