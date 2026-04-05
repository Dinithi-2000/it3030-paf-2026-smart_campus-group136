import { useAuth } from "../auth/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage";
import DashboardPage from "./DashboardPage";

function RoleBasedDashboardPage() {
  const { hasRole } = useAuth();

  if (hasRole("ADMIN")) {
    return <AdminDashboardPage />;
  }

  return <DashboardPage />;
}

export default RoleBasedDashboardPage;
