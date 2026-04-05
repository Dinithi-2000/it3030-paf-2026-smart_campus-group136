import { useMemo, useState } from "react";
import BookingForm from "../features/bookings/BookingForm";
import AdminBookingsPage from "../features/bookings/AdminBookingsPage";
import MyBookingsPage from "../features/bookings/MyBookingsPage";
import { useAuth } from "../auth/AuthContext";

function BookingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-bookings");

  const isAdmin = useMemo(() => {
    if (!user) {
      return false;
    }

    const directRole = user.role || user.userRole;
    if (typeof directRole === "string") {
      return ["ADMIN", "ROLE_ADMIN"].includes(directRole.toUpperCase());
    }

    const roles = Array.isArray(user.roles)
      ? user.roles
      : Array.isArray(user.authorities)
        ? user.authorities
        : [];

    return roles.some((role) => {
      if (typeof role === "string") {
        return ["ADMIN", "ROLE_ADMIN"].includes(role.toUpperCase());
      }
      if (role && typeof role.authority === "string") {
        return ["ADMIN", "ROLE_ADMIN"].includes(role.authority.toUpperCase());
      }
      return false;
    });
  }, [user]);

  const tabs = [
    { key: "my-bookings", label: "My Bookings" },
    { key: "new-booking", label: "New Booking" },
    ...(isAdmin ? [{ key: "admin-panel", label: "Admin Panel" }] : [])
  ];

  const renderActiveTab = () => {
    if (activeTab === "new-booking") {
      return <BookingForm />;
    }

    if (activeTab === "admin-panel" && isAdmin) {
      return <AdminBookingsPage />;
    }

    return <MyBookingsPage />;
  };

  return (
    <section className="workspace-page module-theme booking-page">
      <header className="workspace-head">
        <div>
          <p className="workspace-tag">Module B</p>
          <h1>Booking Management</h1>
        </div>
      </header>

      <div className="workspace-panel space-y-6">
        <div className="top-nav-wrap booking-tabs">
          <div className="brand-block">
            <p className="brand-kicker">Bookings</p>
            <h2>Booking Workspace</h2>
          </div>
          <div className="top-nav booking-tabs-list">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`top-nav-link booking-tab ${isActive ? "top-nav-link-active" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>{renderActiveTab()}</div>
      </div>
    </section>
  );
}

export default BookingsPage;
