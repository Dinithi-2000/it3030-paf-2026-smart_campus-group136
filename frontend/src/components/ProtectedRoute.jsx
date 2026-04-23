import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (isAuthenticated) {
    if (hasRole("ADMIN"))      return <Navigate to="/admin-dashboard" replace />;
    if (hasRole("TECHNICIAN")) return <Navigate to="/tech-dashboard"  replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
