import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./Dashboard.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToMyRoom?: () => void;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TenantDashboard({ user, onLogout, onGoToProfile, onGoToMyRoom, onGoToPayments, onGoToAnnouncements }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pays, ann] = await Promise.all([
          api.getPaymentsByTenant(user.id),
          api.getAllAnnouncements(),
        ]);

        const sortedPays = [...pays].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
        setPayments(sortedPays);

        const sortedAnn = [...ann].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAnnouncements(sortedAnn.slice(0, 4));
      } catch (e) {
        // silently fail
      }
      setLoading(false);
    };
    fetchAll();
  }, [user.id]);

  const pendingBalance = payments.filter(p => p.status.toLowerCase() !== "paid").reduce((s, p) => s + Number(p.amount), 0);
  const nextDue = payments.find(p => p.status.toLowerCase() !== "paid");
  const recentActivity = payments.length;

  const statCards = [
    { label: "Current Balance", value: `₱${pendingBalance.toLocaleString()}`,              icon: "💳", colorClass: "icon-red"   },
    { label: "Next Due Date",   value: nextDue ? formatDate(nextDue.due_date) : "None",    icon: "📅", colorClass: "icon-blue"  },
    { label: "Recent Activity", value: String(recentActivity),                              icon: "🕐", colorClass: "icon-amber" },
    { label: "Account Status",  value: pendingBalance === 0 ? "All Clear" : "Has Balance", icon: "⚡", colorClass: "icon-green" },
  ];

  const paymentStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === "paid") return { label: "Paid", cls: "action-green" };
    if (s === "overdue") return { label: "Overdue", cls: "action-red" };
    if (s === "for_verification") return { label: "For Verification", cls: "action-amber" };
    return { label: "Pending", cls: "action-blue" };
  };

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Dashboard"
      onGoToProfile={onGoToProfile}
      onGoToMyRoom={onGoToMyRoom}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
    >
      <div className="page-header fade-up">
        <h1 className="page-title">Tenant Dashboard</h1>
        <p className="page-sub">Welcome home, {user.name.split(" ")[0]}! Here's your current billing and unit status.</p>
      </div>

      {loading ? (
        <div className="dash-loading">Loading your data…</div>
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
                💳 My Payments
                <button className="card-head-action" onClick={onGoToPayments}>View All →</button>
              </div>
              {payments.length === 0 ? (
                <div className="empty-card">No payment records yet.</div>
              ) : (
                payments.slice(0, 5).map((p) => {
                  const { label, cls } = paymentStatusLabel(p.status);
                  return (
                    <div key={p.id} className="activity-item">
                      <div className="activity-avatar">₱</div>
                      <div className="activity-info">
                        <div className="activity-name">Due {formatDate(p.due_date)}</div>
                        <div className={`activity-action ${cls}`}>{label}</div>
                      </div>
                      <div className="activity-time">₱{Number(p.amount).toLocaleString()}</div>
                    </div>
                  );
                })
              )}
              <div className="card__footer">
                <button className="view-all-btn" onClick={onGoToPayments}>View Full Payment History</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default TenantDashboard;
