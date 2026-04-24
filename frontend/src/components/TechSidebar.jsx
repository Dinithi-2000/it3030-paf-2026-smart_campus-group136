import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Shared sidebar for all Technician pages.
 * Nav: Dashboard · Tickets · Resources · Bookings · Work Report
 */
const navItems = [
  {
    label: "Dashboard",
    to: "/tech-dashboard",
    icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z"
  },
  {
    label: "Tickets",
    to: "/tech-tickets",
    icon: "M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Zm9 3h-2v2h2v-2Zm0 4h-2v2h2v-2Z"
  },
  {
    label: "Work Report",
    to: "/tech-work-report",
    icon: "M5 21h14v-2H5v2Zm1-4h2V9H6v8Zm5 0h2V5h-2v12Zm5 0h2v-6h-2v6Z"
  }
];

export default function TechSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const displayName = user?.displayName || user?.username || "Technician";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside className="ops-sidebar">
      {/* Brand */}
      <div className="ops-brand">
        <div className="ops-logo">TC</div>
        <div>
          <h2>Tech Console</h2>
          <p>MAINTENANCE &amp; OPS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="ops-menu" aria-label="Technician navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/tech-dashboard"}
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
        <button type="button" className="danger" onClick={handleLogout}>
          <span className="foot-icon">&rarr;</span>Sign Out
        </button>
      </div>
    </aside>
  );
}
