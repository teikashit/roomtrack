import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandlordDashboard from "./pages/LandlordDashboard";
import TenantDashboard from "./pages/TenantDashboard";

type Screen = "login" | "register" | "landlord-dashboard" | "tenant-dashboard";

export interface User {
  name: string;
  email: string;
  role: "landlord" | "tenant";
}

function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setScreen(loggedInUser.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleRegister = (newUser: User) => {
    setUser(newUser);
    setScreen(newUser.role === "landlord" ? "landlord-dashboard" : "tenant-dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setScreen("login");
  };

  if (screen === "login")
    return <Login onLogin={handleLogin} onGoToRegister={() => setScreen("register")} />;

  if (screen === "register")
    return <Register onRegister={handleRegister} onGoToLogin={() => setScreen("login")} />;

  if (screen === "landlord-dashboard" && user)
    return <LandlordDashboard user={user} onLogout={handleLogout} />;

  if (screen === "tenant-dashboard" && user)
    return <TenantDashboard user={user} onLogout={handleLogout} />;

  return <Login onLogin={handleLogin} onGoToRegister={() => setScreen("register")} />;
}

export default App;