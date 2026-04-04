import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AuthPages.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Use email as username for login
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // OAuth 2.0 integration - to be implemented
    setError("Google sign-in coming soon");
  };

  return (
    <div className="auth-page-container">
      {/* Left Panel - Brand */}
      <div className="auth-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <span className="logo-icon">🏛️</span>
            <span className="logo-text">CAMPUS HUB</span>
          </div>
          <h1 className="brand-title">Intelligent Observatorium</h1>
          <p className="brand-description">
            Unified command center for high-tech campus operations and resource management.
          </p>
          <div className="brand-footer">
            <p className="access-protocol">SECURE ACCESS PROTOCOL V2.4.0</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="auth-form-panel">
        <div className="form-container">
          <h2 className="form-title">Identity Access</h2>
          <p className="form-subtitle">Sign in to initialize your campus session.</p>

          {error && <div className="form-error">{error}</div>}

          {/* Google OAuth */}
          <button 
            type="button"
            className="oauth-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" width="16" height="16">
              <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="14">G</text>
            </svg>
            SIGN IN WITH GOOGLE
          </button>

          <div className="divider">
            <span>OR USE ENTERPRISE ID</span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">EMAIL PROTOCOL</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">ACCESS PHRASE</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "AUTHORIZING..." : "AUTHORIZE ACCESS"}
            </button>
          </form>

          <div className="form-footer">
            <p>
              DON'T HAVE AN IDENTITY?{" "}
              <Link to="/register" className="footer-link">
                Create Profile
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="demo-info">
            <p className="demo-title">Demo Credentials:</p>
            <div className="demo-list">
              <p>Admin: <code>admin@smartcampus.edu</code> / <code>adminpass</code></p>
              <p>User: <code>user@smartcampus.edu</code> / <code>userpass</code></p>
              <p>Tech: <code>tech@smartcampus.edu</code> / <code>techpass</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
