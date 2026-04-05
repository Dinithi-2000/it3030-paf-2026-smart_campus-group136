// Author: Member 2 - Booking Management Module
import axios from "axios";

const bookingApi = axios.create({
  baseURL: "http://localhost:8090/api"
});

export function createBooking(data) {
  return bookingApi.post("/bookings", data);
}

export function getMyBookings() {
  return bookingApi.get("/bookings");
}

export function getAllBookings(filters = {}) {
  const params = {};
  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.resourceId) {
    params.resourceId = filters.resourceId;
  }

  return bookingApi.get("/bookings", { params });
}

export function updateBookingStatus(id, data) {
  return bookingApi.patch(`/bookings/${id}/status`, data);
}

export function deleteBooking(id) {
  return bookingApi.delete(`/bookings/${id}`);
}
