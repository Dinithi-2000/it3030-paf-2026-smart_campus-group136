import DashboardShell from "../components/layout/DashboardShell";
import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function AdminPage() {
  return (
    <DashboardShell>
      <WorkspaceTemplate
        moduleId="E"
        title="Admin, Auth & Roles Workspace"
        summary="Use this workspace for OAuth integration, role management, protected routes, and admin-only actions."
        checklist={[
          "Integrate OAuth sign-in and user profile mapping.",
          "Apply role-based guards for frontend routes and actions.",
          "Build admin controls for booking and ticket moderation."
        ]}
      />
    </DashboardShell>
  );
}

export default AdminPage;
