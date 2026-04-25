import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardShell from "../components/layout/DashboardShell";
import {
  createFacility,
  deleteFacility,
  fetchFacilities,
  updateFacility
} from "../api/facilities";

const FACILITY_TYPES = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const FACILITY_STATUSES = ["ACTIVE", "OUT_OF_SERVICE", "MAINTENANCE"];

const INITIAL_FORM = {
  code: "",
  name: "",
  type: "LAB",
  capacity: "",
  location: "",
  availabilityStart: "08:00",
  availabilityEnd: "17:00",
  status: "ACTIVE",
  description: ""
};

const INITIAL_FILTERS = {
  query: "",
  type: "ALL",
  status: "ALL",
  sortBy: "latest"
};

function splitStatus(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function statusLabel(value) {
  if (value === "ACTIVE") return "Available";
  if (value === "OUT_OF_SERVICE") return "Unavailable";
  return splitStatus(value || "");
}

function mapFormToPayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    type: form.type,
    capacity: Number(form.capacity),
    location: form.location.trim(),
    availabilityStart: form.availabilityStart,
    availabilityEnd: form.availabilityEnd,
    status: form.status,
    description: form.description.trim() || null
  };
}

function formatTime(value) {
  if (!value) return "-";
  const parts = value.split(":");
  if (parts.length < 2) return value;
  return `${parts[0]}:${parts[1]}`;
}

function FacilitiesPage() {
  const { roles } = useAuth();
  const isAdmin = roles?.includes("ADMIN");

  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayedFacilities = useMemo(() => {
    const copy = [...facilities];
    if (filters.sortBy === "name_asc") {
      copy.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      return copy;
    }
    if (filters.sortBy === "name_desc") {
      copy.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      return copy;
    }
    if (filters.sortBy === "capacity_desc") {
      copy.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      return copy;
    }
    if (filters.sortBy === "capacity_asc") {
      copy.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      return copy;
    }
    if (filters.sortBy === "status") {
      copy.sort((a, b) => statusLabel(a.status).localeCompare(statusLabel(b.status)));
      return copy;
    }
    copy.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    return copy;
  }, [facilities, filters.sortBy]);

  async function loadFacilities(activeFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFacilities(activeFilters);
      setFacilities(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load facilities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFacilities(); }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSearchChange = (val) => {
    setFilters(prev => ({ ...prev, query: val }));
  };

  useEffect(() => {
    loadFacilities(filters);
  }, [filters.query, filters.type, filters.status]);

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const selectForEdit = (facility) => {
    setForm({
      code: facility.code || "",
      name: facility.name || "",
      type: facility.type || "LAB",
      capacity: String(facility.capacity ?? ""),
      location: facility.location || "",
      availabilityStart: formatTime(facility.availabilityStart),
      availabilityEnd: formatTime(facility.availabilityEnd),
      status: facility.status || "ACTIVE",
      description: facility.description || ""
    });
    setEditingId(facility.id);
    setSuccess("");
    setError("");
    setShowModal(true);
  };

  const extractMessage = (requestError, fallback) => {
    const fieldErrors = requestError.response?.data?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstFieldError = Object.values(fieldErrors)[0];
      if (firstFieldError) return String(firstFieldError);
    }
    return requestError.response?.data?.message || fallback;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = mapFormToPayload(form);
      if (editingId) {
        await updateFacility(editingId, payload);
        setSuccess("Facility updated successfully");
      } else {
        await createFacility(payload);
        setSuccess("Facility created successfully");
      }
      setShowModal(false);
      resetForm();
      await loadFacilities(filters);
    } catch (requestError) {
      setError(extractMessage(requestError, "Unable to save facility"));
    } finally {
      setSaving(false);
    }
  };

  const removeFacility = async (facilityId) => {
    const confirmed = window.confirm("Delete this facility from the catalogue?");
    if (!confirmed) return;
    setError("");
    setSuccess("");
    try {
      await deleteFacility(facilityId);
      if (editingId === facilityId) resetForm();
      setSuccess("Facility deleted successfully");
      await loadFacilities(filters);
    } catch (requestError) {
      setError(extractMessage(requestError, "Unable to delete facility"));
    }
  };

  return (
    <DashboardShell
      searchPlaceholder="Search resources by name, code or location..."
      searchValue={filters.query}
      onSearchChange={handleSearchChange}
    >
      <section className="facility-page">
        <header className="facility-page-head facility-catalog-head">
          <div>
            <h1>Campus Resources</h1>
            <p>Manage all campus facilities and assets</p>
          </div>
          <span className="facility-resource-count">
            {displayedFacilities.length} of {facilities.length} resources
          </span>
        </header>

        {error && <div className="facility-alert facility-alert-error">{error}</div>}
        {success && <div className="facility-alert facility-alert-success">{success}</div>}

        <div className="facility-toolbar">
          <select name="type" value={filters.type} onChange={handleFilterChange} className="facility-type-filter">
            <option value="ALL">All Types</option>
            {FACILITY_TYPES.map((item) => (
              <option key={item} value={item}>{splitStatus(item)}</option>
            ))}
          </select>

          <select name="status" value={filters.status} onChange={handleFilterChange} className="facility-type-filter">
            <option value="ALL">All Status</option>
            {FACILITY_STATUSES.map((item) => (
              <option key={item} value={item}>{statusLabel(item)}</option>
            ))}
          </select>

          <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="facility-type-filter">
            <option value="latest">Sort: Latest Updated</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="name_desc">Sort: Name (Z-A)</option>
            <option value="capacity_desc">Sort: Capacity (High-Low)</option>
            <option value="capacity_asc">Sort: Capacity (Low-High)</option>
            <option value="status">Sort: Status</option>
          </select>

          <button type="button" className="facility-reset-btn" onClick={clearFilters}>Reset</button>

          {isAdmin && (
            <button type="button" className="facility-create-btn" onClick={openCreateModal}>+ Add Resource</button>
          )}
        </div>

        {loading ? (
          <p className="facility-empty">Loading facilities...</p>
        ) : displayedFacilities.length === 0 ? (
          <p className="facility-empty">No resources found for this filter.</p>
        ) : (
          <div className="facility-card-grid">
            {displayedFacilities.map((facility) => (
              <article key={facility.id} className="facility-resource-card">
                <div className="facility-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 21h16v-2H4v2Zm1-3h14V7l-4-4H5v15Zm8-13.5L16.5 8H13V4.5ZM7 10h10v2H7v-2Zm0 4h10v2H7v-2Z" />
                  </svg>
                </div>
                <div className="facility-card-body">
                  <div className="facility-card-title-row">
                    <h3>{facility.name}</h3>
                    <span className={`facility-status facility-status-${(facility.status || "").toLowerCase()}`}>
                      {statusLabel(facility.status)}
                    </span>
                  </div>
                  <p className="facility-card-meta">{facility.location}</p>
                  <p className="facility-card-meta">Capacity: {facility.capacity}</p>
                  <p className="facility-card-meta">
                    Window: {formatTime(facility.availabilityStart)} - {formatTime(facility.availabilityEnd)}
                  </p>
                  <p className="facility-card-description">{facility.description || "No description provided."}</p>
                </div>
                <footer className="facility-card-footer">
                  <span className="facility-type-chip">{splitStatus(facility.type || "")}</span>
                  {isAdmin && (
                    <div className="facility-row-actions">
                      <button className="ticket-btn-light" type="button" onClick={() => selectForEdit(facility)}>Edit</button>
                      <button className="ticket-btn-danger" type="button" onClick={() => removeFacility(facility.id)}>Delete</button>
                    </div>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}

        {isAdmin && showModal && (
          <div className="facility-modal-backdrop" onClick={closeModal}>
            <div className="facility-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <h2>{editingId ? "Edit Resource" : "Add Resource"}</h2>
              <form className="facility-form" onSubmit={submitForm}>
                <div className="facility-inline-fields">
                  <label>Resource Name *<input name="name" value={form.name} onChange={handleFormChange} required disabled={saving} /></label>
                  <label>Type *
                    <select name="type" value={form.type} onChange={handleFormChange} disabled={saving}>
                      {FACILITY_TYPES.map((item) => (
                        <option key={item} value={item}>{splitStatus(item)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="facility-inline-fields">
                  <label>Resource Code *<input name="code" value={form.code} onChange={handleFormChange} required disabled={saving} /></label>
                  <label>Capacity *<input name="capacity" type="number" min="1" value={form.capacity} onChange={handleFormChange} required disabled={saving} /></label>
                </div>
                <label>Location *<input name="location" value={form.location} onChange={handleFormChange} required disabled={saving} /></label>
                <div className="facility-inline-fields">
                  <label>Availability Start *<input name="availabilityStart" type="time" value={form.availabilityStart} onChange={handleFormChange} required disabled={saving} /></label>
                  <label>Availability End *<input name="availabilityEnd" type="time" value={form.availabilityEnd} onChange={handleFormChange} required disabled={saving} /></label>
                </div>
                <label>Status
                  <select name="status" value={form.status} onChange={handleFormChange} disabled={saving}>
                    {FACILITY_STATUSES.map((item) => (
                      <option key={item} value={item}>{statusLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label>Description<textarea name="description" rows="3" value={form.description} onChange={handleFormChange} placeholder="Optional description..." disabled={saving} /></label>
                <div className="facility-actions facility-modal-actions">
                  <button className="ticket-btn-light" type="button" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button className="ticket-btn-primary" type="submit" disabled={saving}>{editingId ? "Update Resource" : "Create Resource"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

export default FacilitiesPage;
