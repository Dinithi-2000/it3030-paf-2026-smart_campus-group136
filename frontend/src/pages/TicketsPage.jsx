import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function TicketsPage() {
  return (
    <WorkspaceTemplate
      moduleId="C"
      title="Incident Ticketing Workspace"
      summary="Build incident tickets with attachments, assignment workflow, status transitions, and secure comment ownership handling."
      checklist={[
        "Create ticket workflow from OPEN to CLOSED/REJECTED.",
        "Add upload flow with a strict 3-image cap per ticket.",
        "Implement comments with ownership-based edit/delete rules."
      ]}
    />
  );
}

export default TicketsPage;
