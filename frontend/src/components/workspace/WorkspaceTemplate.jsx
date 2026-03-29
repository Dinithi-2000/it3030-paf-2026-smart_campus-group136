import { Link } from "react-router-dom";

function WorkspaceTemplate({ moduleId, title, summary, checklist }) {
  return (
    <section className="workspace-page module-theme">
      <div className="workspace-head">
        <p className="workspace-tag">Module {moduleId}</p>
        <h1>{title}</h1>
      </div>
      <p className="workspace-summary">{summary}</p>
      <article className="workspace-panel">
        <h3>Starter Checklist</h3>
        <ul>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <div className="workspace-footer">
        <Link className="back-link" to="/">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}

export default WorkspaceTemplate;
