import { useState, useEffect, useRef } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./Payments.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement?: () => void;
  onGoToPayments?: () => void;
  onGoToAnnouncements?: () => void;
  onGoToDashboard?: () => void;
}

interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "for_verification";
  due_date: string;
  paid_date: string | null;
  description: string | null;
  created_at: string;
}

type FilterType = "all" | "pending" | "paid" | "overdue" | "for_verification";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  paid:              { label: "Paid",             cls: "status-paid"         },
  pending:           { label: "Pending",          cls: "status-pending"      },
  overdue:           { label: "Overdue",          cls: "status-overdue"      },
  for_verification:  { label: "For Verification", cls: "status-verification" },
};

export default function LandlordPayments({ user, onLogout, onGoToProfile, onGoToRoomManagement, onGoToPayments, onGoToAnnouncements, onGoToDashboard }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Form
  const [tenantName, setTenantName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenants, setTenants] = useState<{ id: string; full_name: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Payment["status"]>("pending");
  const [dueDate, setDueDate] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const data = await api.getAllPayments();
    const sorted = [...data].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    setPayments(sorted as Payment[]);
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchTenants = async () => {
    const data = await api.getTenants();
    const sorted = [...data].sort((a, b) => a.full_name.localeCompare(b.full_name));
    setTenants(sorted);
  };

  const openAdd = () => {
    setEditPayment(null);
    setTenantName(""); setTenantId(""); setAmount(""); setDescription(""); setStatus("pending"); setDueDate(""); setFormError("");
    fetchTenants();
    setShowModal(true);
  };

  const openEdit = (p: Payment) => {
    setEditPayment(p);
    setTenantName(p.tenant_name || ""); setTenantId(p.tenant_id || ""); setAmount(String(p.amount)); setStatus(p.status);
    setDueDate(p.due_date?.split("T")[0] || ""); setDescription(p.description || ""); setFormError("");
    fetchTenants();
    setMenuOpen(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!tenantName.trim() || !amount || !dueDate) { setFormError("Please fill in all fields."); return; }
    setFormLoading(true);
    setFormError("");
    const payload = { tenant_id: tenantId, tenant_name: tenantName.trim(), amount: parseFloat(amount), status, due_date: dueDate, description: description.trim() || null };
    if (editPayment) {
      await api.updatePaymentStatus(editPayment.id, payload.status);
    } else {
      await api.createPayment(payload as any);
    }
    setFormLoading(false);
    setShowModal(false);
    fetchPayments();
  };

  const handleMarkPaid = async (id: string) => {
    await api.updatePaymentStatus(id, "paid");
    setMenuOpen(null);
    fetchPayments();
  };

  const handleStatusChange = async (id: string, newStatus: Payment["status"]) => {
    await api.updatePaymentStatus(id, newStatus);
    setMenuOpen(null);
    fetchPayments();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this payment record?")) return;
    // Note: backend does not expose DELETE /payments — remove from local state only
    setPayments(prev => prev.filter(p => p.id !== id));
    return;
    setMenuOpen(null);
    fetchPayments();
  };

  const filtered = payments.filter(p => {
    const matchFilter = filter === "all" || p.status.toLowerCase() === filter;
    const matchSearch = (p.tenant_name || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalRevenue = payments.filter(p => p.status.toLowerCase() === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status.toLowerCase() === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const overdueCount = payments.filter(p => p.status.toLowerCase() === "overdue").length;
  const forVerif = payments.filter(p => p.status.toLowerCase() === "for_verification").length;

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Payments"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
      onGoToDashboard={onGoToDashboard}
    >
      <div className="pay-header fade-up">
        <div className="pay-header__left">
          <h1 className="pay-title">Payments</h1>
          <p className="pay-sub">Manage rent payments, track balances, and record transactions.</p>
        </div>
        <div className="pay-header__actions">
          <button className="btn-primary" onClick={openAdd}>+ Add Payment</button>
        </div>
      </div>

      {/* Stats */}
      <div className="pay-stats fade-up delay-1">
        {[
          { label: "Total Collected",    value: `₱${totalRevenue.toLocaleString()}`,  icon: "💵", cls: "icon-green"  },
          { label: "Pending Amount",     value: `₱${totalPending.toLocaleString()}`,  icon: "⏳", cls: "icon-amber"  },
          { label: "Overdue Records",    value: String(overdueCount),                  icon: "🚨", cls: "icon-red"    },
          { label: "For Verification",   value: String(forVerif),                      icon: "🔍", cls: "icon-violet" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">{s.label}</span>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            </div>
            <div className="stat-card__value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="pay-filter-bar fade-up delay-2">
        <div className="filter-tabs">
          {(["all", "pending", "paid", "overdue", "for_verification"] as FilterType[]).map(f => (
            <button key={f} className={`filter-tab ${filter === f ? "filter-tab--active" : ""}`} onClick={() => setFilter(f)}>
              {f === "for_verification" ? "For Verification" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="pay-search">
          <span className="pay-search-icon">🔍</span>
          <input placeholder="Search tenant…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="pay-table-wrap fade-up delay-3">
        {loading ? (
          <div className="pay-empty">Loading payments…</div>
        ) : filtered.length === 0 ? (
          <div className="pay-empty">No payment records found.</div>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const si = STATUS_INFO[p.status] || { label: p.status, cls: "status-pending" };
                return (
                  <tr key={p.id}>
                    <td><div className="pay-name">{p.tenant_name || "Unknown"}</div></td>
                    <td>{formatDate(p.due_date)}</td>
                    <td><div className="pay-amount">₱{Number(p.amount).toLocaleString()}</div></td>
                    <td><span className={`status-badge ${si.cls}`}>{si.label}</span></td>
                    <td>{p.paid_date ? formatDate(p.paid_date) : "—"}</td>
                    <td>{p.description || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {p.status === "pending" && (
                          <button className="btn-confirm btn-confirm--green" onClick={() => handleMarkPaid(p.id)}>✅ Mark as Paid</button>
                        )}
                        {p.status === "for_verification" && (
                          <button className="btn-confirm btn-confirm--violet" onClick={() => handleMarkPaid(p.id)}>🔍 Confirm Cash</button>
                        )}
                        <div className="action-menu-wrap" ref={menuOpen === p.id ? menuRef : null}>
                          <button className="action-menu-btn" onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}>⋯</button>
                          {menuOpen === p.id && (
                            <div className="action-menu">
                              <button onClick={() => openEdit(p)}>✏️ Edit</button>
                              {p.status !== "paid" && <button onClick={() => handleStatusChange(p.id, "paid")}>✅ Mark as Paid</button>}
                              {p.status !== "for_verification" && <button onClick={() => handleStatusChange(p.id, "for_verification")}>🔍 For Verification</button>}
                              {p.status !== "overdue" && <button onClick={() => handleStatusChange(p.id, "overdue")}>🚨 Mark Overdue</button>}
                              <button className="danger" onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__title">{editPayment ? "Edit Payment" : "Add Payment"}</span>
              <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Tenant</label>
                <select
                  className="form-select"
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
              <div className="form-group">
                <label className="form-label">Amount (₱)</label>
                <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Payment["status"])}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="for_verification">For Verification</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. May 2025 Rent" />
              </div>
              {formError && <div className="form-error">{formError}</div>}
            </div>
            <div className="modal__foot">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={formLoading}>
                {formLoading ? "Saving…" : editPayment ? "Save Changes" : "Add Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
