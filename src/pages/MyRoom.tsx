import { useState, useEffect } from "react";
import { User } from "../App";
import supabase from "../supabaseClient";
import AppLayout from "../components/AppLayout";
import "./MyRoom.css";

interface Room {
  id: string;
  unit_name: string;
  monthly_rate: number;
  status: "vacant" | "occupied" | "maintenance";
  floor: string;
  size: string;
  description: string;
  tenant_name: string | null;
  photo_url: string | null;
}

interface Props {
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

function MyRoom({ user, onLogout, onGoToProfile, onGoToRoomManagement }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);

      // Fetch profile to get full_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const fullName = profile?.full_name || user.name;

      // Find room matching tenant name
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .ilike("tenant_name", fullName)
        .single();

      setRoom(data as Room || null);
      setLoading(false);
    };

    fetchRoom();
  }, [user.id, user.name]);

  const statusColors: Record<string, { bg: string; color: string }> = {
    vacant:      { bg: "#f0fdf4", color: "#16a34a" },
    occupied:    { bg: "#eff6ff", color: "#2563eb" },
    maintenance: { bg: "#fff7ed", color: "#ea580c" },
  };

  return (
    <AppLayout
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
          {/* Photo */}
          <div className="myroom-photo">
            <img
              src={room.photo_url || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"}
              alt={room.unit_name}
            />
            <div
              className="myroom-badge"
              style={{ background: statusColors[room.status]?.bg, color: statusColors[room.status]?.color }}
            >
              ✅ {room.status.toUpperCase()}
            </div>
            <div className="myroom-unit">{room.unit_name}</div>
          </div>

          {/* Details */}
          <div className="myroom-body">
            <div className="myroom-left">
              {/* Amenities */}
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

              {/* Monthly Rate */}
              <div className="myroom-section">
                <div className="myroom-section__title">MONTHLY RATE</div>
                <div className="myroom-rate">${room.monthly_rate.toLocaleString()}</div>
              </div>

              {/* Extra Details */}
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
              {/* Property Rules */}
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

              {/* Lease Agreement */}
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