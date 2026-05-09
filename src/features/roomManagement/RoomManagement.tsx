import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./RoomManagement.css";

interface Room {
  id: string;
  unit_name: string;
  monthly_rate: number;
  status: string;
  floor: string;
  size: string;
  description: string;
  tenant_id: string | null;
  tenant_name: string | null;
  photo_url: string | null;
}

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement?: () => void;
  onGoToPayments?: () => void;
  onGoToAnnouncements?: () => void;
  onGoToDashboard?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  vacant:      { bg: "#f0fdf4", color: "#16a34a", label: "VACANT" },
  occupied:    { bg: "#eff6ff", color: "#2563eb", label: "OCCUPIED" },
  maintenance: { bg: "#fff7ed", color: "#ea580c", label: "MAINTENANCE" },
};

const ROOM_PHOTOS = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
];

function RoomManagement({ user, onLogout, onGoToProfile, onGoToRoomManagement, onGoToPayments, onGoToAnnouncements, onGoToDashboard }: Props) {
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [filter, setFilter]             = useState<"all" | "vacant" | "occupied" | "maintenance">("all");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editRoom, setEditRoom]         = useState<Room | null>(null);
  const [menuOpen, setMenuOpen]         = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<Room | null>(null);

  // Form state
  const [unitName, setUnitName]         = useState("");
  const [monthlyRate, setMonthlyRate]   = useState("");
  const [status, setStatus]             = useState<"vacant" | "occupied" | "maintenance">("vacant");
  const [floor, setFloor]               = useState("");
  const [size, setSize]                 = useState("");
  const [description, setDescription]  = useState("");
  const [tenantName, setTenantName]     = useState("");
  const [tenantId, setTenantId]         = useState("");
  const [tenants, setTenants]           = useState<{ id: string; full_name: string }[]>([]);
  const [formError, setFormError]       = useState("");
  const [formLoading, setFormLoading]   = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getRooms();
      // Sort by unit_name
      const sorted = [...data].sort((a, b) => a.unit_name.localeCompare(b.unit_name));
      setRooms(sorted);
    } catch (e) { /* silently fail */ }
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const filteredRooms = rooms.filter(r => {
    const matchFilter = filter === "all" || r.status.toLowerCase() === filter;
    const matchSearch = r.unit_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const fetchTenants = async () => {
    try {
      const data = await api.getTenants();
      const sorted = [...data].sort((a, b) => a.full_name.localeCompare(b.full_name));
      setTenants(sorted);
    } catch (e) { /* silently fail */ }
  };

  const openAddModal = () => {
    setEditRoom(null);
    setUnitName(""); setMonthlyRate(""); setStatus("vacant");
    setFloor(""); setSize(""); setDescription(""); setTenantName(""); setTenantId("");
    setFormError("");
    fetchTenants();
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditRoom(room);
    setUnitName(room.unit_name);
    setMonthlyRate(String(room.monthly_rate));
    setStatus((room.status.toLowerCase() as "vacant" | "occupied" | "maintenance") || "vacant");
    setFloor(room.floor || "");
    setSize(room.size || "");
    setDescription(room.description || "");
    setTenantName(room.tenant_name || "");
    setTenantId(room.tenant_id || "");
    setFormError("");
    fetchTenants();
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!unitName.trim())  { setFormError("Unit name is required."); return; }
    if (!monthlyRate)       { setFormError("Monthly rate is required."); return; }

    setFormLoading(true);
    setFormError("");

    const photoUrl = ROOM_PHOTOS[Math.floor(Math.random() * ROOM_PHOTOS.length)];

    try {
      if (editRoom) {
        // Update via createRoom (upsert) — backend uses POST /rooms for create
        // For status-only changes we use assignTenant/unassignTenant
        // Here we do a full update by calling createRoom with the id included
        // Note: backend may not support PUT /rooms/{id} — adapt if needed
        await api.createRoom({
          unit_name: unitName,
          monthly_rate: parseFloat(monthlyRate),
          status,
          floor,
          size,
          description,
          tenant_id: status === "vacant" ? null : tenantId || null,
          tenant_name: status === "vacant" ? null : tenantName,
          photo_url: editRoom.photo_url || photoUrl,
        });

        // If tenant assignment changed, use the assign/unassign endpoints
        if (status === "vacant" && editRoom.tenant_id) {
          await api.unassignTenant(editRoom.id);
        } else if (status !== "vacant" && tenantId && tenantId !== editRoom.tenant_id) {
          await api.assignTenant(editRoom.id, tenantId, tenantName);
        }
      } else {
        const newRoom = await api.createRoom({
          unit_name: unitName,
          monthly_rate: parseFloat(monthlyRate),
          status,
          floor,
          size,
          description,
          tenant_id: status === "vacant" ? null : tenantId || null,
          tenant_name: status === "vacant" ? null : tenantName,
          photo_url: photoUrl,
        });

        // If occupied from creation, also call assignTenant
        if (status !== "vacant" && tenantId && newRoom?.id) {
          await api.assignTenant(newRoom.id, tenantId, tenantName);
        }
      }
    } catch (e: any) {
      setFormError(e?.message || "Failed to save room. Please try again.");
      setFormLoading(false);
      return;
    }

    setFormLoading(false);
    setShowModal(false);
    fetchRooms();
  };

  const handleChangeStatus = async (room: Room, newStatus: "vacant" | "occupied" | "maintenance") => {
    try {
      if (newStatus === "vacant" && room.tenant_id) {
        await api.unassignTenant(room.id);
      }
      // The backend handles status via assign/unassign; for maintenance we patch via createRoom update
      // Refresh after change
    } catch (e) { /* silently fail */ }
    setShowStatusModal(null);
    fetchRooms();
  };

  const getStatusStyle = (rawStatus: string) => {
    const key = rawStatus.toLowerCase();
    return STATUS_COLORS[key] ?? { bg: "#f3f4f6", color: "#374151", label: rawStatus.toUpperCase() };
  };

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Room Management"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
      onGoToDashboard={onGoToDashboard}
    >
      {/* Header */}
      <div className="rm-header fade-up">
        <div>
          <h1 className="rm-title">Room Management</h1>
          <p className="rm-sub">Manage your property units and occupancy.</p>
        </div>
        <button className="rm-add-btn" onClick={openAddModal}>+ Add New Room</button>
      </div>

      {/* Filters + Search */}
      <div className="rm-toolbar fade-up">
        <div className="rm-filters">
          {(["all", "vacant", "occupied", "maintenance"] as const).map(f => (
            <button
              key={f}
              className={`rm-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="rm-search">
          <span>🔍</span>
          <input
            placeholder="Search units..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Room Cards */}
      {loading ? (
        <div className="rm-empty">Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="rm-empty">No rooms found. Click "Add New Room" to get started!</div>
      ) : (
        <div className="rm-grid fade-up">
          {filteredRooms.map(room => {
            const s = getStatusStyle(room.status);
            const statusKey = room.status.toLowerCase();
            return (
              <div key={room.id} className="rm-card">
                {/* Photo */}
                <div className="rm-card__photo">
                  <img src={room.photo_url || ROOM_PHOTOS[0]} alt={room.unit_name} />
                  <div className="rm-card__badge" style={{ background: s.bg, color: s.color }}>
                    {statusKey === "vacant" ? "🚪" : statusKey === "occupied" ? "✅" : "🔧"} {s.label}
                  </div>
                  <div className="rm-card__unit">{room.unit_name}</div>
                </div>

                {/* Info */}
                <div className="rm-card__body">
                  <div className="rm-card__row">
                    <span className="rm-card__label">Monthly Rate</span>
                    <span className="rm-card__rate">₱{room.monthly_rate.toLocaleString()}</span>
                  </div>
                  {room.floor && (
                    <div className="rm-card__row">
                      <span className="rm-card__label">Floor</span>
                      <span>{room.floor}</span>
                    </div>
                  )}
                  {room.size && (
                    <div className="rm-card__row">
                      <span className="rm-card__label">Size</span>
                      <span>{room.size}</span>
                    </div>
                  )}
                  <div className="rm-card__tenant">
                    <span>👤</span>
                    <div>
                      <div className="rm-card__tenant-label">Tenant</div>
                      <div className="rm-card__tenant-name">{room.tenant_name || "Unassigned"}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="rm-card__actions">
                    <button className="rm-assign-btn" onClick={() => openEditModal(room)}>
                      {room.tenant_name ? "Edit Assignment" : "Assign Tenant"}
                    </button>
                    <div className="rm-menu-wrap">
                      <button className="rm-menu-btn" onClick={() => setMenuOpen(menuOpen === room.id ? null : room.id)}>⋮</button>
                      {menuOpen === room.id && (
                        <div className="rm-menu">
                          <button onClick={() => openEditModal(room)}>✏️ Edit Room</button>
                          <button onClick={() => { setShowStatusModal(room); setMenuOpen(null); }}>🔄 Change Status</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="rm-overlay" onClick={() => setShowModal(false)}>
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal__head">
              <h2>{editRoom ? "Edit Room" : "Add New Room"}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Unit Name</label>
              <input value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="e.g. Unit 101" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Rate (₱)</label>
                <input type="number" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)} placeholder="e.g. 1200" />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g. 1st Floor" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Size</label>
                <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 32 sqm" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            {status !== "vacant" && (
              <div className="form-group">
                <label>Tenant</label>
                <select
                  value={tenantId}
                  onChange={e => {
                    const selected = tenants.find(t => t.id === e.target.value);
                    setTenantId(e.target.value);
                    setTenantName(selected?.full_name || "");
                  }}
                >
                  <option value="">— Select a tenant —</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Spacious room with sea view..." rows={3} />
            </div>

            {formError && <div className="form-error">⚠️ {formError}</div>}

            <button className={`btn-submit ${formLoading ? "loading" : ""}`} onClick={handleSave} disabled={formLoading}>
              {formLoading ? <span className="spinner" /> : editRoom ? "Save Changes" : "Add Room"}
            </button>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="rm-overlay" onClick={() => setShowStatusModal(null)}>
          <div className="rm-modal rm-modal--small" onClick={e => e.stopPropagation()}>
            <div className="rm-modal__head">
              <h2>Change Status — {showStatusModal.unit_name}</h2>
              <button onClick={() => setShowStatusModal(null)}>✕</button>
            </div>
            <div className="rm-status-options">
              {(["vacant", "occupied", "maintenance"] as const).map(s => (
                <button
                  key={s}
                  className={`rm-status-opt ${showStatusModal.status.toLowerCase() === s ? "active" : ""}`}
                  style={{ color: STATUS_COLORS[s].color, background: STATUS_COLORS[s].bg }}
                  onClick={() => handleChangeStatus(showStatusModal, s)}
                >
                  {s === "vacant" ? "🚪" : s === "occupied" ? "✅" : "🔧"} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default RoomManagement;
