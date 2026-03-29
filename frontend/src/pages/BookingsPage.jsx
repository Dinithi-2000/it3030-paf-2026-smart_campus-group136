import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function BookingsPage() {
  return (
    <WorkspaceTemplate
      moduleId="B"
      title="Booking Management Workspace"
      summary="Implement booking request workflow with overlap conflict prevention and admin approve/reject actions."
      checklist={[
        "Implement booking create, view, and cancel flows.",
        "Add overlap validation for same resource/time range.",
        "Build admin controls for approve/reject with reason capture."
      ]}
    />
  );
}

export default BookingsPage;
