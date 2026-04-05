import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AuthPages.css";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("USER");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Extract username from email
    const username = email.split("@")[0];

    const result = await register(username, fullName, email, selectedRole);
    if (result.success) {
      setSuccess("Profile created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const roles = [
    { value: "USER", label: "USER", icon: "👤" },
    { value: "ADMIN", label: "ADMIN", icon: "👨‍💼" },
    { value: "TECHNICIAN", label: "TECHNICIAN", icon: "🔧" }
  ];

  return (
    <div className="auth-container split-layout">
      {/* Left Side - Branding */}
      <div className="auth-left-panel">
        <div className="auth-branding">
          <div className="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 10v20M10 20h20" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="brand-name">CAMPUS HUB</h2>
        </div>

        <div className="auth-left-content">
          <h1 className="auth-left-title">Join the Network</h1>
          <p className="auth-left-description">
            Create your official account for the Smart Campus Operations Hub. Establish your operational profile and gain access to unified campus management.
          </p>
          <div className="auth-left-features">
            <div className="feature-item">
              <div className="feature-icon">🏫</div>
              <span>Campus-wide access</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <span>Resource management</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤝</div>
              <span>Team collaboration</span>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          <p className="stats-badge">JOIN 14,000+ PERSONNEL</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          <Link to="/login" className="back-to-login">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            BACK TO LOGIN
          </Link>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">Establish your operational profile.</p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}
          {success && <div className="auth-success-alert">{success}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">FULL NAME</label>
              <div className="form-input-wrapper">
                <svg className="form-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <div className="form-input-wrapper">
                <svg className="form-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smartcampus.com"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">ACCESS PASSWORD</label>
              <div className="form-input-wrapper">
                <svg className="form-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="role-label">REQUESTED ROLE</label>
              <div className="role-selector">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    className={`role-btn ${selectedRole === role.value ? "active" : ""}`}
                    onClick={() => setSelectedRole(role.value)}
                    disabled={loading}
                  >
                    <span className="role-icon">{role.icon}</span>
                    <span className="role-name">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "REGISTERING..." : "REGISTER PROFILE"}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </form>

          <div className="auth-form-footer">
            <p className="auth-footer-text">
              <span>ALREADY HAVE AN ACCOUNT?</span>
              <Link to="/login" className="auth-footer-link">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
