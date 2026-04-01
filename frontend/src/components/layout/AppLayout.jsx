import TopNav from "./TopNav";
import { useLocation } from "react-router-dom";

function AppLayout({ children }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname === "/";
  const isShellRoute = location.pathname === "/tickets" || isDashboardRoute;
  const showTopNav = !isShellRoute;

  return (
    <div className={`page${isShellRoute ? " dashboard-page" : ""}`}>
      <main className={`card${isShellRoute ? " full-bleed" : ""}`}>
        {showTopNav && <TopNav />}
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
