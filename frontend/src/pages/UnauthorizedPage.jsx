import { Link } from "react-router-dom";
import "./AuthPages.css";

export default function UnauthorizedPage() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Access Denied</h1>
          <p>403 Unauthorized</p>
        </div>

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            You do not have the required permissions to access this page.
          </p>
          <Link to="/" style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#667eea",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            fontWeight: "600"
          }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
