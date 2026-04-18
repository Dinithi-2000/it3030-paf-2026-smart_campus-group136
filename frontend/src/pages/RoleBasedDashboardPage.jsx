import { useAuth } from "../auth/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage";
import TechnicianDashboardPage from "./TechnicianDashboardPage";
import DashboardPage from "./DashboardPage";
import AppLayout from "../components/layout/AppLayout";

function RoleBasedDashboardPage() {
  const { hasRole } = useAuth();

  // Admin & Technician have their own full-shell pages (no AppLayout needed)
  if (hasRole("ADMIN"))       return <AdminDashboardPage />;
  if (hasRole("TECHNICIAN"))  return <TechnicianDashboardPage />;

  // Regular users get the standard dashboard wrapped in AppLayout
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
}

export default RoleBasedDashboardPage;
