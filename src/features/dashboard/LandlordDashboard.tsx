import { useState, useEffect } from "react";
import { User } from "../../App";
import supabase from "../../supabaseClient";
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Payment {
  id: string;
  tenant_name?: string;
  amount: number;
  status: string;
  due_date: string;
  profiles?: { full_name: string };
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // Rooms stats
      const { data: rooms } = await supabase.from("rooms").select("status, monthly_rate");
      if (rooms) {
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
        const totalRevenue = rooms.filter(r => r.status === "occupied").reduce((s, r) => s + (r.monthly_rate || 0), 0);
        const totalTenants = occupiedRooms;
        setStats({ totalRooms, occupiedRooms, totalTenants, totalRevenue });
      }

      // Announcements
      const { data: ann } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (ann) setAnnouncements(ann);

      // Recent payments
      const { data: pays } = await supabase
        .from("payments")
        .select("*")
        .order("due_date", { ascending: false })
        .limit(5);
      if (pays) setRecentPayments(pays);

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
    if (status === "paid") return { label: "Paid", cls: "action-green" };
    if (status === "overdue") return { label: "Overdue", cls: "action-red" };
    if (status === "for_verification") return { label: "For Verification", cls: "action-amber" };
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
