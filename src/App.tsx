import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandlordDashboard from "./pages/LandlordDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import Profile from "./pages/Profile";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "landlord" | "tenant";
}

type Screen = "login" | "register" | "landlord-dashboard" | "tenant-dashboard" | "profile";

function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (u: User) => {
    setUser(u);
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setScreen("login");
  };

  const handleRegister = (u: User) => {
    setUser(u);
    setScreen(u.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

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
        />
      )}
      {screen === "tenant-dashboard" && user && (
        <TenantDashboard
          user={user}
          onLogout={handleLogout}
          onGoToProfile={() => setScreen("profile")}
        />
      )}
      {screen === "profile" && user && (
        <Profile
          user={user}
          onBack={() => setScreen(user.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard")}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;