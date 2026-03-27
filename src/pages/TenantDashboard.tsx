import { User } from "../App";
import AppLayout from "../components/AppLayout";
import "./Dashboard.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement?: () => void;
  onGoToMyRoom?: () => void;
}

const stats = [
  { label: "Current Balance", value: "$1,200.00",   icon: "💳", colorClass: "icon-red"   },
  { label: "Next Due Date",   value: "Feb 15, 2026", icon: "📅", colorClass: "icon-blue"  },
  { label: "Recent Activity", value: "2",            icon: "🕐", colorClass: "icon-amber" },
  { label: "Active Services", value: "3",            icon: "⚡", colorClass: "icon-green" },
];

const announcements = [
  { title: "Elevator Maintenance",  desc: "The main elevator will be under maintenance on Feb 10th from 9 AM to 2 PM.", time: "TODAY",      timeClass: "time-today" },
  { title: "New Payment Policy",    desc: "Starting next month, we only accept digital payments through the portal.",   time: "YESTERDAY",  timeClass: "time-past"  },
  { title: "Rooftop Garden Access", desc: "The rooftop garden is now open for all residents until 10 PM daily.",        time: "2 DAYS AGO", timeClass: "time-past"  },
];

const activity = [
  { initials: "AJ", name: "Alex Johnson", action: "Paid Rent",           time: "2 hours ago", cls: "action-green" },
  { initials: "SM", name: "Sarah Miller", action: "New Lease",           time: "5 hours ago", cls: "action-blue"  },
  { initials: "KL", name: "Kevin Lee",    action: "Maintenance Request", time: "1 day ago",   cls: "action-amber" },
  { initials: "ED", name: "Emma Davis",   action: "Payment Overdue",     time: "2 days ago",  cls: "action-red"   },
];

function TenantDashboard({ user, onLogout, onGoToProfile, onGoToRoomManagement, onGoToMyRoom }: Props) {
  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Dashboard"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
      onGoToMyRoom={onGoToMyRoom}
    >
      <div className="page-header fade-up">
        <h1 className="page-title">Tenant Dashboard</h1>
        <p className="page-sub">
          Welcome home, {user.name.split(" ")[0]}! Here's your current billing and unit status.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
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
          <div className="card__head">🔔 News & Announcements</div>
          {announcements.map((a, i) => (
            <div key={i} className="news-item">
              <div>
                <div className="news-title">{a.title}</div>
                <div className="news-desc">{a.desc}</div>
              </div>
              <div className={`news-time ${a.timeClass}`}>{a.time}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card__head">Recent Activity</div>
          {activity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-avatar">{a.initials}</div>
              <div className="activity-info">
                <div className="activity-name">{a.name}</div>
                <div className={`activity-action ${a.cls}`}>{a.action}</div>
              </div>
              <div className="activity-time">{a.time}</div>
            </div>
          ))}
          <div className="card__footer">
            <button className="view-all-btn">View Full Activity</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default TenantDashboard;