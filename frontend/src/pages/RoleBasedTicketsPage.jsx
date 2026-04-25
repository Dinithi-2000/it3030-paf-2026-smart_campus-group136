import { useAuth } from "../auth/AuthContext";
import AdminTicketsPage from "./AdminTicketsPage";
import TechnicianTicketsPage from "./TechnicianTicketsPage";
import TicketsPage from "./TicketsPage";

function RoleBasedTicketsPage() {
  const { hasRole } = useAuth();

  if (hasRole("ADMIN")) return <AdminTicketsPage />;
  if (hasRole("TECHNICIAN")) return <TechnicianTicketsPage />;
  return <TicketsPage />;
}

export default RoleBasedTicketsPage;
