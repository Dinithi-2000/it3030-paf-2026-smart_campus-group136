import TopNav from "./TopNav";
import { useLocation } from "react-router-dom";

function AppLayout({ children }) {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === "/" ||
    location.pathname === "/admin-dashboard" ||
    location.pathname === "/user-tickets" ||
    location.pathname === "/my-bookings";
  const hideTopNav = location.pathname === "/my-bookings";
  const showTopNav = !isDashboardRoute && !hideTopNav;

  return (
    <div className={`page${isDashboardRoute ? " dashboard-page" : ""}`}>
      <main className={`card${isDashboardRoute ? " full-bleed" : ""}`}>
        {showTopNav && <TopNav />}
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
