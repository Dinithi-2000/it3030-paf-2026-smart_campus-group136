import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Shared sidebar for all Technician pages.
 * Mirrors the admin sidebar style exactly, with technician-relevant nav items.
 */
const navItems = [
  {
    label: "Dashboard",
    to: "/tech-dashboard",
    icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z"
  },
  {
    label: "My Tickets",
    to: "/tech-tickets",
    icon: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z"
  },
  {
    label: "Resources",
    to: "/facilities",
    icon: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8.8V16L12 21l7.5-5v-4.2L12 16l-7.5-4.2Z"
  },
  {
    label: "My Bookings",
    to: "/my-bookings",
    icon: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z"
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: "M12 3a6 6 0 0 0-6 6v3.7L4.7 15a1 1 0 0 0 .86 1.5h12.88a1 1 0 0 0 .86-1.5L18 12.7V9a6 6 0 0 0-6-6Zm0 18a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 21Z"
  },
  {
    label: "Work Report",
    to: "/tech-dashboard",   // placeholder — links back to dashboard analytics section
    icon: "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z"
  }
];

export default function TechSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = (user?.displayName || user?.username || "T").charAt(0).toUpperCase();

  return (
    <aside className="ops-sidebar">
      {/* Brand */}
      <div className="ops-brand">
        <div className="ops-logo">{initials}C</div>
        <div>
          <h2>Operations Hub</h2>
          <p>TECHNICIAN CONSOLE</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="ops-menu" aria-label="Technician navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) =>
              `ops-menu-link${isActive ? " ops-menu-link-active" : ""}`
            }
          >
            <span className="menu-link-content">
              <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                <path d={item.icon} fill="currentColor" />
              </svg>
              <span>{item.label}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="ops-sidebar-foot">
        <button type="button">
          <span className="foot-icon">?</span>Support
        </button>
        <button type="button">
          <span className="foot-icon">*</span>Settings
        </button>
        <button type="button" className="danger" onClick={handleLogout}>
          <span className="foot-icon">&rarr;</span>Sign Out
        </button>
      </div>
    </aside>
  );
}
