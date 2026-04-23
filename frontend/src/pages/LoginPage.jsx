import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AuthPages.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Extract username from email (email or username)
    const username = email.includes("@") ? email.split("@")[0] : email;
    
    const result = await login(username, password);
    if (result.success) {
      navigate(result.redirectTo || "/");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleCredentialResponse = async (response) => {
    setError("");
    setLoading(true);

    if (!response || !response.credential) {
      setError("Google sign-in was cancelled or no account was selected.");
      setLoading(false);
      return;
    }

    try {
      const result = await googleLogin(response.credential);
      if (result.success) {
        navigate(result.redirectTo || "/");
      } else {
        setError(result.error || "Google sign-in failed");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // This is now handled by the Google rendered button
    // But we keep the function to avoid errors if called, 
    // or we can use it to trigger prompt if needed.
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    if (document.getElementById("google-identity-script")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the official Google button
        window.google.accounts.id.renderButton(
          document.getElementById("google-button-container"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%",
            text: "signin_with",
            shape: "rectangular"
          }
        );
      }
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [GOOGLE_CLIENT_ID]);

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
          <h1 className="auth-left-title">Intelligent Observatorium</h1>
          <p className="auth-left-description">
            Unified command center for high-tech campus operations and resource management.
          </p>
          <div className="auth-left-features">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <span>Real-time monitoring</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <span>Secure access control</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Instant notifications</span>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          <p className="security-badge">SECURE ACCESS PROTOCOL V2.4.0</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Identity Access</h2>
            <p className="auth-form-subtitle">Sign in to initialize your campus session.</p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}

          <div id="google-button-container" className="google-signin-container">
            {/* Google button will be rendered here */}
          </div>

          <div className="form-divider">
            <span>OR USE ENTERPRISE ID</span>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">EMAIL PROTOCOL</label>
              <div className="form-input-wrapper">
                <svg className="form-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">ACCESS PHRASE</label>
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

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "INITIALIZING..." : "AUTHORIZE ACCESS"}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </form>

          <div className="auth-form-footer">
            <p className="auth-footer-text">
              <span>DON'T HAVE AN IDENTITY?</span>
              <Link to="/register" className="auth-footer-link">Create Profile</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
