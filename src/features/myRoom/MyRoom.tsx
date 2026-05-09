import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./MyRoom.css";

interface Props {
  onGoToMyRoom?: () => void;
  onGoToPayments?: () => void;
  onGoToAnnouncements?: () => void;
  onGoToDashboard?: () => void;
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement?: () => void;
}

const AMENITIES = [
  { icon: "📶", label: "WiFi" },
  { icon: "❄️", label: "AC" },
  { icon: "🔐", label: "Smart Lock" },
];

const RULES = [
  "No Pets",
  "No Smoking",
  "Quiet hours: 10PM - 6AM",
];

function MyRoom({ user, onLogout, onGoToProfile, onGoToMyRoom, onGoToPayments, onGoToAnnouncements, onGoToRoomManagement, onGoToDashboard }: Props) {
  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const rooms = await api.getRoomByTenantId(user.id);
        setRoom(rooms && rooms.length > 0 ? rooms[0] : null);
      } catch (e) {
        setRoom(null);
      }
      setLoading(false);
    };
    fetchRoom();
  }, [user.id]);

  const statusColors: Record<string, { bg: string; color: string }> = {
    vacant:      { bg: "#f0fdf4", color: "#16a34a" },
    occupied:    { bg: "#eff6ff", color: "#2563eb" },
    maintenance: { bg: "#fff7ed", color: "#ea580c" },
  };

  const status = room?.status?.toLowerCase() || "vacant";

  return (
    <AppLayout
      onGoToMyRoom={onGoToMyRoom}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
      onGoToDashboard={onGoToDashboard}
      user={user}
      onLogout={onLogout}
      activePage="My Room"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
    >
      <div className="myroom-header fade-up">
        <h1 className="myroom-title">My Room Details</h1>
        <p className="myroom-sub">View your assigned unit details and rules.</p>
      </div>

      {loading ? (
        <div className="myroom-empty">Loading your room...</div>
      ) : !room ? (
        <div className="myroom-empty">
          <div className="myroom-empty__icon">🏠</div>
          <h2>No Room Assigned</h2>
          <p>You haven't been assigned to a room yet. Please contact your landlord.</p>
        </div>
      ) : (
        <div className="myroom-card fade-up">
          <div className="myroom-photo">
            <img
              src={room.photo_url || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"}
              alt={room.unit_name}
            />
            <div
              className="myroom-badge"
              style={{ background: statusColors[status]?.bg, color: statusColors[status]?.color }}
            >
              ✅ {status.toUpperCase()}
            </div>
            <div className="myroom-unit">{room.unit_name}</div>
          </div>

          <div className="myroom-body">
            <div className="myroom-left">
              <div className="myroom-section">
                <div className="myroom-section__title">AMENITIES</div>
                <div className="myroom-amenities">
                  {AMENITIES.map(a => (
                    <div key={a.label} className="myroom-amenity">
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="myroom-section">
                <div className="myroom-section__title">MONTHLY RATE</div>
                <div className="myroom-rate">₱{room.monthly_rate.toLocaleString()}</div>
              </div>

              {(room.floor || room.size) && (
                <div className="myroom-section">
                  <div className="myroom-section__title">UNIT DETAILS</div>
                  <div className="myroom-details">
                    {room.floor && <div className="myroom-detail-item">🏢 Floor: {room.floor}</div>}
                    {room.size  && <div className="myroom-detail-item">📐 Size: {room.size}</div>}
                  </div>
                </div>
              )}

              {room.description && (
                <div className="myroom-section">
                  <div className="myroom-section__title">DESCRIPTION</div>
                  <p className="myroom-desc">{room.description}</p>
                </div>
              )}
            </div>

            <div className="myroom-right">
              <div className="myroom-section">
                <div className="myroom-section__title">PROPERTY RULES</div>
                <ul className="myroom-rules">
                  {RULES.map(r => (
                    <li key={r}>
                      <span className="myroom-rule-dot" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="myroom-lease-btn">
                📄 View Digital Lease Agreement
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default MyRoom;
