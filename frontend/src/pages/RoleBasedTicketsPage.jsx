import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AdminTicketsPage from "./AdminTicketsPage";
import TicketsPage from "./TicketsPage";

function RoleBasedTicketsPage() {
  const { hasRole } = useAuth();

  if (hasRole("ADMIN") || hasRole("TECHNICIAN")) {
    return <AdminTicketsPage />;
  }

  return <TicketsPage />;
}

export default RoleBasedTicketsPage;
