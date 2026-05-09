import { useState } from "react";
import { User } from "../../App";
import { api, setToken } from "../../apiClient";
import "../login/Auth.css";

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToRegister: () => void;
}

function Login({ onLogin, onGoToRegister }: LoginProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    setError("");

    try {
      const data = await api.login(email, password);

      // Store JWT token
      setToken(`${data.access_token}`);

      const role = (data.user.user_metadata?.role as "landlord" | "tenant") || "landlord";

      onLogin({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.email || "User",
        email: data.user.email,
        role,
      });
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("A server error occurred. Please try again later.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left__brand">
          <div className="brand-icon">🏠</div>
          <span className="brand-name">RoomTrack</span>
        </div>
        <div className="auth-left__body">
          <h1 className="auth-left__headline">
            Manage properties<br />
            <em>effortlessly.</em>
          </h1>
          <p className="auth-left__sub">
            A unified platform for landlords and tenants to handle
            payments, maintenance, and communication.
          </p>
          <ul className="auth-features">
            <li>💰 Real-time payment tracking</li>
            <li>🏠 Room &amp; unit management</li>
            <li>🔔 Smart alerts &amp; announcements</li>
            <li>📊 Revenue &amp; occupancy insights</li>
          </ul>
        </div>
        <div className="deco-circle deco-circle--1" />
        <div className="deco-circle deco-circle--2" />
        <div className="deco-circle deco-circle--3" />
      </div>

      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-card__header">
            <h2>Welcome back</h2>
            <p>Sign in to your RoomTrack account</p>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass((p) => !p)}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}

          <button
            className={`btn-submit ${loading ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>

          <div className="auth-card__footer">
            Don't have an account?{" "}
            <span className="link" onClick={onGoToRegister}>
              Create one
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
