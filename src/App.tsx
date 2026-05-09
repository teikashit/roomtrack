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
import supabase from "./supabaseClient";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("screen", screen);
  }, [screen]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();

        const role = (profile?.role as "landlord" | "tenant") || "landlord";

        setUser({
          id: session.user.id,
          name:
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email ||
            "User",
          email: session.user.email || "",
          role: role,
        });
      } else {
        setScreen("login");
        localStorage.removeItem("screen");
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen("login");
    localStorage.removeItem("screen");
  };

  const handleRegister = (u: User) => {
    setUser(u);
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
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
