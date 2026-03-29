import WorkspaceTemplate from "../components/workspace/WorkspaceTemplate";

function FacilitiesPage() {
  return (
    <WorkspaceTemplate
      moduleId="A"
      title="Facilities & Assets Workspace"
      summary="Build resource catalogue features: metadata, availability windows, capacity, location, status, and search filters."
      checklist={[
        "Create facility and equipment CRUD endpoints.",
        "Add search by type, location, and capacity.",
        "Connect this page to facilities APIs and table-based UI."
      ]}
    />
  );
}

export default FacilitiesPage;
