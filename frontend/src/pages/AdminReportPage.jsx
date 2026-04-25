import { useEffect, useMemo, useState } from "react";
import { fetchTickets } from "../api/tickets";
import { fetchAllBookings } from "../api/bookings";
import { fetchFacilities } from "../api/facilities";
import DashboardShell from "../components/layout/DashboardShell";
import "./AdminReportPage.css";

const TONES = {
  blue: "tone-blue",
  green: "tone-green",
  amber: "tone-amber",
  rose: "tone-rose"
};

export default function AdminReportPage() {
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [tData, bData, fData] = await Promise.all([
          fetchTickets(),
          fetchAllBookings(),
          fetchFacilities()
        ]);
        setTickets(tData || []);
        setBookings(bData.data || []);
        setFacilities(fData || []);
      } catch (err) {
        setError("System aggregate failure. Could not synchronize report streams.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
    const pendingBookings = bookings.filter(b => b.status === "PENDING").length;
    const activeFacilities = facilities.filter(f => f.status === "ACTIVE").length;
    
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
    const bookingApprovalRate = bookings.length > 0 
      ? Math.round((bookings.filter(b => b.status === "APPROVED").length / bookings.length) * 100) 
      : 0;

    return { 
      totalTickets, 
      resolvedTickets, 
      pendingBookings, 
      activeFacilities, 
      resolutionRate,
      bookingApprovalRate,
      totalFacilities: facilities.length
    };
  }, [tickets, bookings, facilities]);

  const handleExportCSV = (type) => {
    let data = [];
    let filename = "report.csv";
    
    if (type === "TICKETS") {
      data = [
        ["ID", "Category", "Priority", "Status", "Created At"],
        ...tickets.map(t => [t.id, t.category, t.priority, t.status, t.createdAt])
      ];
      filename = `tickets_audit_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === "BOOKINGS") {
      data = [
        ["ID", "User", "Resource", "Status", "Start Time"],
        ...bookings.map(b => [b.id, b.userId, b.resourceId, b.status, b.startTime])
      ];
      filename = `bookings_audit_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderProgress = (label, value, total, color) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="report-bar-item">
        <div className="report-bar-label">
          <span>{label}</span>
          <span>{percentage}% ({value}/{total})</span>
        </div>
        <div className="report-bar-track">
          <div 
            className="report-bar-fill" 
            style={{ width: `${percentage}%`, background: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <DashboardShell>
      <section className="ops-content">
        <div className="report-container">
          <header className="ticket-page-head">
            <div>
              <h1>Operational Intelligence <span className="admin-badge-label">LIVE</span></h1>
              <p>Real-time telemetry and auditing for Smart Campus resources.</p>
            </div>
            <div className="ticket-toolbar-actions">
              <span className="facility-resource-count">System status: {error ? "Offline" : "Optimal"}</span>
            </div>
          </header>

          {error && <div className="ticket-alert ticket-alert-error">{error}</div>}

          <div className="report-grid">
            <article className="report-stat-card">
              <div className="report-stat-header">Ticket Resolution</div>
              <div className="report-stat-value">{stats.resolutionRate}%</div>
              <div className="report-stat-footer">
                <span>↑ 4.2%</span> from last week
              </div>
            </article>

            <article className="report-stat-card tone-green">
              <div className="report-stat-header">Resource Capacity</div>
              <div className="report-stat-value">{stats.activeFacilities}</div>
              <div className="report-stat-footer">
                Of {stats.totalFacilities} active nodes
              </div>
            </article>

            <article className="report-stat-card tone-amber">
              <div className="report-stat-header">Pending Requests</div>
              <div className="report-stat-value">{stats.pendingBookings}</div>
              <div className="report-stat-footer down">
                Requires administrative action
              </div>
            </article>

            <article className="report-stat-card tone-rose">
              <div className="report-stat-header">Total Incidents</div>
              <div className="report-stat-value">{stats.totalTickets}</div>
              <div className="report-stat-footer">
                Total tickets in database
              </div>
            </article>
          </div>

          <div className="report-visual-section">
            <div className="report-chart-box">
              <div className="report-chart-header">
                <h3>System Utilization Pulse</h3>
                <div className="report-legend">
                  <div className="legend-item"><span className="legend-dot" style={{background: '#3b82f6'}}/> Tickets</div>
                  <div className="legend-item"><span className="legend-dot" style={{background: '#10b981'}}/> Facilities</div>
                  <div className="legend-item"><span className="legend-dot" style={{background: '#f59e0b'}}/> Bookings</div>
                </div>
              </div>
              <div className="report-bar-group">
                {renderProgress("Ticket Clearance Rate", stats.resolvedTickets, stats.totalTickets, "#3b82f6")}
                {renderProgress("Facility Uptime Status", stats.activeFacilities, stats.totalFacilities, "#10b981")}
                {renderProgress("Booking Approval Velocity", bookings.filter(b => b.status === "APPROVED").length, bookings.length, "#f59e0b")}
              </div>
            </div>

            <div className="report-chart-box">
              <div className="report-chart-header">
                <h3>Data Extraction</h3>
              </div>
              <div className="report-export-grid">
                <div className="report-export-card" onClick={() => handleExportCSV("TICKETS")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <h4>Ticketing Audit</h4>
                  <p>CSV export of all historical incidents</p>
                </div>
                <div className="report-export-card" onClick={() => handleExportCSV("BOOKINGS")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <h4>Booking Registry</h4>
                  <p>Comprehensive list of resource allocations</p>
                </div>
              </div>
            </div>
          </div>

          <article className="ops-panel">
            <div className="ops-panel-head">
              <h2>Recent System Anomalies</h2>
              <button className="ticket-btn-light">View All Alerts</button>
            </div>
            <div className="ops-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Stream ID</th>
                    <th>Subsystem</th>
                    <th>Severity</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.slice(0, 5).map(t => (
                    <tr key={t.id}>
                      <td><code style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>#{String(t.id).slice(-8)}</code></td>
                      <td>{t.category}</td>
                      <td><span className="ticket-priority-chip">{t.priority}</span></td>
                      <td><span className={`status-pill status-${t.status?.toLowerCase().replace('_', '-')}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </DashboardShell>
  );
}
