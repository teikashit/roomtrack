import { useState, useEffect } from "react";
import Login from "./features/login/Login";
import Register from "./features/register/Register";
import LandlordDashboard from "./features/dashboard/LandlordDashboard";
import TenantDashboard from "./features/dashboard/TenantDashboard";
import Profile from "./features/profile/Profile";
import RoomManagement from "./features/roomManagement/RoomManagement";
import MyRoom from "./features/myRoom/MyRoom";
import supabase from "./supabaseClient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "landlord" | "tenant";
}

type Screen = "login" | "register" | "landlord-dashboard" | "tenant-dashboard" | "profile" | "room-management" | "my-room";

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
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email || "User",
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

  if (loading) return (
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
        />
      )}
      {screen === "tenant-dashboard" && user && (
        <TenantDashboard
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
        />
      )}
      {screen === "profile" && user && (
        <Profile
          user={user}
          onBack={() => setScreen(user.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard")}
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
        />
      )}
      {screen === "my-room" && user && (
        <MyRoom
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
  />
      )}
      {screen === "tenant-dashboard" && user && (
        <TenantDashboard
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
          onGoToRoomManagement={() => setScreen("room-management")}
          onGoToMyRoom={() => setScreen("my-room")}
  />
)}

    </>
  );
}

export default App;