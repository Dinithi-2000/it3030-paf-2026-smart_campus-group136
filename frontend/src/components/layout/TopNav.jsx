import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./TopNav.css";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/facilities", label: "Facilities" },
  { to: "/bookings", label: "Bookings" },
  { to: "/tickets", label: "Tickets" },
  { to: "/notifications", label: "Notifications" },
  { to: "/admin", label: "Analytics" }
];

function TopNav() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-nav-wrap">
      <div className="brand-block">
        <p className="brand-kicker">Smart Campus</p>
        <h2>Operations Hub</h2>
      </div>
      <nav className="top-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `top-nav-link${isActive ? " top-nav-link-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="user-menu">
        <div className="user-info">
          <span className="username">{user?.displayName || user?.username || "User"}</span>
          <span className="user-role">{roles?.[0] || "USER"}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default TopNav;
