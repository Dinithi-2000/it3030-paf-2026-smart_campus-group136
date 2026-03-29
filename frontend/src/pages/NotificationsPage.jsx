import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function NotificationsPage() {
  return (
    <WorkspaceTemplate
      moduleId="D"
      title="Notifications Workspace"
      summary="Implement a notification center for booking decisions, ticket updates, and new ticket comments."
      checklist={[
        "Design notification feed with unread/read state.",
        "Wire booking and ticket event notifications.",
        "Apply role-aware notification visibility rules."
      ]}
    />
  );
}

export default NotificationsPage;
