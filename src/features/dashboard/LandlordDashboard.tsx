import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./Dashboard.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement: () => void;
  onGoToPayments: () => void;
  onGoToAnnouncements: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function LandlordDashboard({ user, onLogout, onGoToProfile, onGoToRoomManagement, onGoToPayments, onGoToAnnouncements }: Props) {
  const [stats, setStats] = useState({ totalRooms: 0, occupiedRooms: 0, totalTenants: 0, totalRevenue: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rooms, ann, pays] = await Promise.all([
          api.getRooms(),
          api.getAllAnnouncements(),
          api.getAllPayments(),
        ]);

        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status.toLowerCase() === "occupied").length;
        const totalRevenue = rooms.filter(r => r.status.toLowerCase() === "occupied").reduce((s, r) => s + (r.monthly_rate || 0), 0);
        setStats({ totalRooms, occupiedRooms, totalTenants: occupiedRooms, totalRevenue });

        // Sort announcements newest first, show top 4
        const sorted = [...ann].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAnnouncements(sorted.slice(0, 4));

        // Sort payments by due_date desc, show top 5
        const sortedPays = [...pays].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
        setRecentPayments(sortedPays.slice(0, 5));
      } catch (e) {
        // silently fail — user stays on loading=false
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const vacancyRate = stats.totalRooms > 0
    ? (((stats.totalRooms - stats.occupiedRooms) / stats.totalRooms) * 100).toFixed(1)
    : "0.0";

  const statCards = [
    { label: "Total Revenue",  value: `₱${stats.totalRevenue.toLocaleString()}`, icon: "💵", colorClass: "icon-blue"   },
    { label: "Vacancy Rate",   value: `${vacancyRate}%`,                          icon: "🏠", colorClass: "icon-green"  },
    { label: "Total Rooms",    value: String(stats.totalRooms),                   icon: "🔔", colorClass: "icon-amber"  },
    { label: "Total Tenants",  value: String(stats.totalTenants),                 icon: "👥", colorClass: "icon-violet" },
  ];

  const paymentStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === "paid") return { label: "Paid", cls: "action-green" };
    if (s === "overdue") return { label: "Overdue", cls: "action-red" };
    if (s === "for_verification") return { label: "For Verification", cls: "action-amber" };
    return { label: status, cls: "action-blue" };
  };

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Dashboard"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
    >
      <div className="page-header fade-up">
        <h1 className="page-title">Landlord Dashboard</h1>
        <p className="page-sub">Welcome back, {user.name.split(" ")[0]}! Here's your property overview.</p>
      </div>

      {loading ? (
        <div className="dash-loading">Loading dashboard data…</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((s, i) => (
              <div key={s.label} className={`stat-card fade-up delay-${i + 1}`}>
                <div className="stat-card__header">
                  <span className="stat-card__label">{s.label}</span>
                  <div className={`stat-icon ${s.colorClass}`}>{s.icon}</div>
                </div>
                <div className="stat-card__value">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="dash-grid fade-up delay-5">
            <div className="card">
              <div className="card__head">
                🔔 News &amp; Announcements
                <button className="card-head-action" onClick={onGoToAnnouncements}>View All →</button>
              </div>
              {announcements.length === 0 ? (
                <div className="empty-card">No announcements yet.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="news-item">
                    <div>
                      <div className="news-title">{a.title}</div>
                      <div className="news-desc">{a.content}</div>
                    </div>
                    <div className="news-time time-past">{timeAgo(a.created_at)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card__head">
                💳 Recent Payments
                <button className="card-head-action" onClick={onGoToPayments}>View All →</button>
              </div>
              {recentPayments.length === 0 ? (
                <div className="empty-card">No payments recorded yet.</div>
              ) : (
                recentPayments.map((p) => {
                  const { label, cls } = paymentStatusLabel(p.status);
                  const name = p.tenant_name || "Unknown Tenant";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={p.id} className="activity-item">
                      <div className="activity-avatar">{initials}</div>
                      <div className="activity-info">
                        <div className="activity-name">{name}</div>
                        <div className={`activity-action ${cls}`}>{label}</div>
                      </div>
                      <div className="activity-time">₱{Number(p.amount).toLocaleString()}</div>
                    </div>
                  );
                })
              )}
              <div className="card__footer">
                <button className="view-all-btn" onClick={onGoToPayments}>View Full Activity</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default LandlordDashboard;
