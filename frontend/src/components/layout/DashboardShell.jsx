import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import NotificationBell from "../NotificationBell";

const navItems = {
  ADMIN: [
    { label: "Admin Dashboard", to: "/admin-dashboard", icon: "dashboard" },
    { label: "Resources Management", to: "/facilities", icon: "resources" },
    { label: "Booking Management", to: "/manage-bookings", icon: "booking" },
    { label: "Ticketing Management", to: "/tickets", icon: "ticketing" },
    { label: "Reports", to: "/admin-report", icon: "analytics" },
    { label: "Notifications", to: "/notifications", icon: "notifications" }
  ],
  TECHNICIAN: [
    { label: "Dashboard", to: "/tech-dashboard", icon: "dashboard" },
    { label: "Tickets", to: "/tech-tickets", icon: "ticketing" },

    { label: "Work Report", to: "/tech-work-report", icon: "analytics" }
  ],
  USER: [
    { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
    { label: "Resources", to: "/facilities", icon: "resources" },
    { label: "Create Booking", to: "/create-booking", icon: "booking" },
    { label: "My Bookings", to: "/my-bookings", icon: "booking" },
    { label: "Ticketing", to: "/user-tickets", icon: "ticketing" },
    { label: "Notifications", to: "/notifications", icon: "notifications" },
    { label: "Analytics", to: "/analytics", icon: "analytics" }
  ]
};

function navIcon(type) {
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
      <path d={icons[type]} fill="currentColor" />
    </svg>
  );
}

export default function DashboardShell({ children, searchPlaceholder = "Search system resources...", searchValue, onSearchChange }) {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = roles?.includes("ADMIN") ? "ADMIN" : roles?.includes("TECHNICIAN") ? "TECHNICIAN" : "USER";
  const items = navItems[userRole] || navItems.USER;

  const brandInfo = {
    ADMIN: { logo: "AD", title: "Admin Command", subtitle: "CONTROL AND COMPLIANCE" },
    TECHNICIAN: { logo: "TC", title: "Tech Console", subtitle: "MAINTENANCE & OPS" },
    USER: { logo: "SC", title: "Operations Hub", subtitle: "INTELLIGENT OBSERVATORIUM" }
  }[userRole];

  return (
    <section className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <div className="ops-logo">{brandInfo.logo}</div>
          <div>
            <h2>{brandInfo.title}</h2>
            <p>{brandInfo.subtitle}</p>
          </div>
        </div>

        <nav className="ops-menu" aria-label="Main navigation">
          {items.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === "/" || item.to === "/dashboard" || item.to === "/admin-dashboard" || item.to === "/tech-dashboard"}
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
            <span className="foot-icon">?</span> Support
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="foot-icon">&rarr;</span> Sign Out
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              if (typeof onSearchChange === "function") {
                // Support both direct value (setter) and event handler
                try {
                  onSearchChange(e.target.value);
                } catch {
                  onSearchChange(e);
                }
              }
            }}
          />
          <div className="ops-top-actions">
            <NotificationBell />
            <div className="ops-user">
              <div>
                <strong>{user?.displayName || user?.username || "Campus User"}</strong>
                <span>{userRole}</span>
              </div>
              <div className="avatar">{(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="ops-content">
          {children}
        </section>
      </div>
    </section>
  );
}
