import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function AdminDashboardPage() {
  return (
    <WorkspaceTemplate
      moduleId="A"
      title="Admin Command Dashboard"
      summary="Dedicated admin overview for role governance, approvals, and system-wide control tasks."
      checklist={[
        "Review pending role escalation and access requests.",
        "Approve or reject booking and ticket escalations.",
        "Audit user activity and enforce admin policy updates."
      ]}
    />
  );
}

export default AdminDashboardPage;
