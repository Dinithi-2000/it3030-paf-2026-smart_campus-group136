import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminPage from "./pages/AdminPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminTicketsPage from "./pages/AdminTicketsPage";
import BookingsPage from "./pages/BookingsPage";
import FacilitiesPage from "./pages/FacilitiesPage";
import NotificationsPage from "./pages/NotificationsPage";
import RoleBasedDashboardPage from "./pages/RoleBasedDashboardPage";
import RoleBasedTicketsPage from "./pages/RoleBasedTicketsPage";
import TicketsPage from "./pages/TicketsPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout><RoleBasedDashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/facilities" element={<ProtectedRoute><AppLayout><FacilitiesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><AppLayout><BookingsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />

      {/* Ticketing – self-contained full-shell pages, no AppLayout wrapper */}
      <Route path="/tickets" element={<ProtectedRoute><RoleBasedTicketsPage /></ProtectedRoute>} />
      <Route path="/user-tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />

      {/* Admin-only routes — AdminTicketsPage has its own full sidebar shell */}
      <Route path="/admin-tickets" element={<ProtectedRoute requiredRole="ADMIN"><AdminTicketsPage /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
