import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function OperationsShell({ children, title, subtitle, navItems = [] }) {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navIcon = (type) => {
    const icons = {
      dashboard: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z",
      resources: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z",
      booking: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z",
      ticketing: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z",
      notifications: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z",
      analytics: "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z"
    };

    return (
      <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
        <path d={icons[type] || icons.dashboard} fill="currentColor" />
      </svg>
    );
  };

  const isAdmin = roles?.includes("ADMIN");
  const brandLogo = isAdmin ? "AD" : "SC";
  const brandName = isAdmin ? "Admin Command" : "Operations Hub";
  const brandTag = isAdmin ? "CONTROL AND COMPLIANCE" : "INTELLIGENT OBSERVATORIUM";

  return (
    <section className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">{brandLogo}</div>
          <div>
            <h2>{brandName}</h2>
            <p>{brandTag}</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/" || item.to === "/admin-dashboard"}
              className={({ isActive }) =>
                `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`
              }
            >
              <span className="menu-link-content">
                {navIcon(item.icon)}
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="ops-sidebar-foot">
          <button type="button">
            <span className="foot-icon">?</span>
            Support
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span>
            {isAdmin ? "Exit Console" : "Sign Out"}
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <input type="search" placeholder="Global system search..." />
          <div className="ops-top-actions">
            <button type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M12 3a6 6 0 0 0-6 6v3.6l-1.4 2.3a1 1 0 0 0 .86 1.51h13.08a1 1 0 0 0 .86-1.51L18 12.6V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Quick logout"
              className="logout-soft"
              onClick={handleLogout}
            >
              <svg viewBox="0 0 24 24" className="ops-icon" aria-hidden="true">
                <path
                  d="M10 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 1 1 0-2h7V5h-7a1 1 0 0 1-1-1ZM13.7 12.7a1 1 0 0 0 0-1.4l-2-2a1 1 0 1 0-1.4 1.4L10.59 11H4a1 1 0 1 0 0 2h6.59l-.29.29a1 1 0 1 0 1.4 1.42l2-2.01Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || (isAdmin ? "Admin" : "User")}</strong>
                <span>{roles?.[0] || "USER"}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || (isAdmin ? "A" : "U")).charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          {title && <h1>{title}</h1>}
          {subtitle && <p className="ops-subtitle">{subtitle}</p>}
          {children}
        </section>
      </div>
    </section>
  );
}

export default OperationsShell;
