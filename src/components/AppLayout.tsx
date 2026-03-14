import { User } from "../App";
import "./AppLayout.css";

interface NavItem {
  emoji: string;
  label: string;
  action?: () => void;
}

const landlordNav: NavItem[] = [
  { emoji: "📊", label: "Dashboard" },
  { emoji: "🏠", label: "Room Management" },
  { emoji: "📒", label: "Master Ledger" },
  { emoji: "👤", label: "My Profile" },
  { emoji: "⚙️", label: "Settings" },
];

const tenantNav: NavItem[] = [
  { emoji: "📊", label: "Dashboard" },
  { emoji: "🏠", label: "My Room" },
  { emoji: "💳", label: "Payments" },
  { emoji: "👤", label: "My Profile" },
  { emoji: "⚙️", label: "Settings" },
];

interface AppLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activePage?: string;
  onGoToProfile?: () => void;
}

function AppLayout({ user, onLogout, children, activePage = "Dashboard", onGoToProfile }: AppLayoutProps) {
  const navItems = user.role === "landlord" ? landlordNav : tenantNav;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleNavClick = (label: string) => {
    if (label === "My Profile" && onGoToProfile) {
      onGoToProfile();
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-icon">🏠</span>
          <span className="topbar__brand-name">RoomTrack</span>
        </div>

        <div className="topbar__search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search dashboard, payments, or rooms..." />
        </div>

        <div className="topbar__right">
          <div className={`role-badge ${user.role === "landlord" ? "role-badge--landlord" : "role-badge--tenant"}`}>
            {user.role === "landlord" ? "Landlord Portal" : "Tenant Portal"}
          </div>

          <button className="notif-btn" title="Notifications">
            🔔
            <span className="notif-dot" />
          </button>

          <div className="user-chip" onClick={onGoToProfile} style={{ cursor: "pointer" }}>
            <div className="user-chip__info">
              <span className="user-chip__name">{user.name}</span>
              <span className="user-chip__role">
                {user.role === "landlord" ? "Property Manager" : "Resident"}
              </span>
            </div>
            <div className="user-chip__avatar">{initials}</div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`nav-item ${activePage === item.label ? "nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.label)}
                style={{ cursor: item.label === "My Profile" ? "pointer" : "default" }}
              >
                <span className="nav-item__icon">{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="sidebar__bottom">
            <div className="sidebar__role-label">Current Role</div>
            <div className={`sidebar__role-value ${user.role === "landlord" ? "role--landlord" : "role--tenant"}`}>
              {user.role.toUpperCase()}
            </div>
            <button className="sidebar__logout" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;