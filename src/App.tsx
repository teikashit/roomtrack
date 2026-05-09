import { useState, useEffect } from "react";
import Login from "./features/login/Login";
import Register from "./features/register/Register";
import LandlordDashboard from "./features/dashboard/LandlordDashboard";
import TenantDashboard from "./features/dashboard/TenantDashboard";
import Profile from "./features/profile/Profile";
import RoomManagement from "./features/roomManagement/RoomManagement";
import MyRoom from "./features/myRoom/MyRoom";
import LandlordPayments from "./features/payments/LandlordPayments";
import TenantPayments from "./features/payments/TenantPayments";
import Announcements from "./features/announcements/Announcements";
import { clearToken, getToken } from "./apiClient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "landlord" | "tenant";
}

type Screen =
  | "login"
  | "register"
  | "landlord-dashboard"
  | "tenant-dashboard"
  | "profile"
  | "room-management"
  | "my-room"
  | "payments"
  | "announcements";

function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    return (localStorage.getItem("screen") as Screen) || "login";
  });
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("rt_user");
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("screen", screen);
  }, [screen]);

  useEffect(() => {
    // On mount: if there is no JWT token, force back to login
    if (!getToken()) {
      setUser(null);
      setScreen("login");
      localStorage.removeItem("screen");
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("rt_user", JSON.stringify(u));
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setScreen("login");
    localStorage.removeItem("screen");
    localStorage.removeItem("rt_user");
  };

  const handleRegister = (u: User) => {
    setUser(u);
    localStorage.setItem("rt_user", JSON.stringify(u));
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("rt_user", JSON.stringify(updatedUser));
  };

  const goToDashboard = () => {
    if (!user) return;
    setScreen(user.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "18px", color: "#64748b" }}>
        Loading...
      </div>
    );

  return (
    <>
      {screen === "login" && (
        <Login onLogin={handleLogin} onGoToRegister={() => setScreen("register")} />
      )}
      {screen === "register" && (
        <Register onRegister={handleRegister} onGoToLogin={() => setScreen("login")} />
      )}
      {screen === "landlord-dashboard" && user && (
        <LandlordDashboard
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
        />
      )}
      {screen === "tenant-dashboard" && user && (
        <TenantDashboard
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToMyRoom={() => setScreen("my-room")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
        />
      )}
      {screen === "profile" && user && (
        <Profile
          user={user}
          onBack={goToDashboard}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      )}
      {screen === "room-management" && user && (
        <RoomManagement
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
          onGoToDashboard={() => setScreen("landlord-dashboard")}
        />
      )}
      {screen === "my-room" && user && (
        <MyRoom
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToMyRoom={() => setScreen("my-room")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
          onGoToDashboard={goToDashboard}
        />
      )}
      {screen === "payments" && user && user.role === "landlord" && (
        <LandlordPayments
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
          onGoToDashboard={goToDashboard}
        />
      )}
      {screen === "payments" && user && user.role === "tenant" && (
        <TenantPayments
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToMyRoom={() => setScreen("my-room")}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
          onGoToDashboard={goToDashboard}
        />
      )}
      {screen === "announcements" && user && (
        <Announcements
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={user.role === "landlord" ? () => setScreen("room-management") : undefined}
          onGoToMyRoom={user.role === "tenant" ? () => setScreen("my-room") : undefined}
          onGoToPayments={() => setScreen("payments")}
          onGoToAnnouncements={() => setScreen("announcements")}
          onGoToDashboard={goToDashboard}
        />
      )}
    </>
  );
}

export default App;
