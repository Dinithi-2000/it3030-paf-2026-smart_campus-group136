import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/facilities", label: "Facilities" },
  { to: "/bookings", label: "Bookings" },
  { to: "/tickets", label: "Tickets" },
  { to: "/notifications", label: "Notifications" },
  { to: "/admin", label: "Analytics" }
];

function TopNav() {
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
    </header>
  );
}

export default TopNav;
