import { Navigate, Route, Routes } from "react-router-dom";
import DashboardShell from "./components/layout/DashboardShell";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminBookingDetailsPage from "./pages/AdminBookingDetailsPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";
import AdminPage from "./pages/AdminPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminTicketsPage from "./pages/AdminTicketsPage";
import CreateBookingPage from "./pages/CreateBookingPage";
import FacilitiesPage from "./pages/FacilitiesPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import RoleBasedDashboardPage from "./pages/RoleBasedDashboardPage";
import RoleBasedTicketsPage from "./pages/RoleBasedTicketsPage";
import TechnicianDashboardPage from "./pages/TechnicianDashboardPage";
import TechnicianTicketsPage from "./pages/TechnicianTicketsPage";
import TechWorkReportPage from "./pages/TechWorkReportPage";
import TicketsPage from "./pages/TicketsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminReportPage from "./pages/AdminReportPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Root always redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Role-based home – handled without AppLayout (each page has its own shell) ── */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboardPage /></ProtectedRoute>} />

      {/* ── General protected routes (need AppLayout top-nav) ── */}
      <Route path="/facilities"    element={<ProtectedRoute><FacilitiesPage /></ProtectedRoute>} />
      <Route path="/create-booking" element={<ProtectedRoute><CreateBookingPage /></ProtectedRoute>} />
      <Route path="/my-bookings"   element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
      <Route path="/manage-bookings" element={<ProtectedRoute requiredRole="ADMIN"><MyBookingsPage /></ProtectedRoute>} />
      <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
      <Route path="/bookings"      element={<ProtectedRoute><Navigate to="/create-booking" replace /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/analytics"     element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      {/* ── Ticketing – self-contained full-shell pages ── */}
      <Route path="/tickets"      element={<ProtectedRoute><RoleBasedTicketsPage /></ProtectedRoute>} />
      <Route path="/user-tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
      <Route path="/tech-tickets" element={<ProtectedRoute><TechnicianTicketsPage /></ProtectedRoute>} />

      {/* ── Technician dedicated pages ── */}
      <Route path="/tech-dashboard"    element={<ProtectedRoute><TechnicianDashboardPage /></ProtectedRoute>} />
      <Route path="/tech-work-report"  element={<ProtectedRoute><TechWorkReportPage /></ProtectedRoute>} />

      {/* ── Admin-only routes ── */}
      <Route path="/admin-booking/:bookingId" element={<ProtectedRoute requiredRole="ADMIN"><AdminBookingDetailsPage /></ProtectedRoute>} />
      <Route path="/admin-tickets"   element={<ProtectedRoute requiredRole="ADMIN"><AdminTicketsPage /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin-report"    element={<ProtectedRoute requiredRole="ADMIN"><AdminReportPage /></ProtectedRoute>} />
      <Route path="/admin"           element={<ProtectedRoute requiredRole="ADMIN"><AdminPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
