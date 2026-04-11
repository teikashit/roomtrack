import { useState } from "react";
import { User } from "../../App";
import supabase from "../../supabaseClient";
import "../login/Auth.css";

interface RegisterProps {
  onRegister: (user: User) => void;
  onGoToLogin: () => void;
}

function Register({ onRegister, onGoToLogin }: RegisterProps) {
  const [firstName, setFirstName]             = useState("");
  const [lastName, setLastName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState("");
  const [role, setRole]                       = useState<"landlord" | "tenant">("landlord");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [generalError, setGeneralError]       = useState("");
  const [loading, setLoading]                 = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim())            e.firstName       = "First name is required.";
    if (!lastName.trim())             e.lastName        = "Last name is required.";
    if (!email.trim())                e.email           = "Email is required.";
    else if (!email.includes("@"))    e.email           = "Please enter a valid email.";
    if (!phone.trim())                e.phone           = "Phone number is required.";
    if (!password)                    e.password        = "Password is required.";
    else if (password.length < 6)     e.password        = "Password must be at least 6 characters.";
    if (!confirmPassword)             e.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            phone: phone,
            role: role,
          },
        },
      });

      if (supabaseError) {
        if (supabaseError.message.includes("already registered") ||
            supabaseError.message.includes("User already registered")) {
          setGeneralError("This email is already registered. Please log in instead.");
        } else if (supabaseError.message.includes("Password should be")) {
          setGeneralError("Password must be at least 6 characters long.");
        } else if (supabaseError.message.includes("Unable to validate email")) {
          setGeneralError("Please enter a valid email address.");
        } else if (supabaseError.message.includes("Too many requests")) {
          setGeneralError("Too many attempts. Please wait a moment and try again.");
        } else {
          setGeneralError(supabaseError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setGeneralError("This email is already registered. Please log in instead.");
          setLoading(false);
          return;
        }

        // Save phone, role, full_name to profiles table immediately
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: `${firstName} ${lastName}`,
          phone: phone,
          role: role,
        });

        onRegister({
          id: data.user.id,
          name: `${firstName} ${lastName}`,
          email: email,
          role: role,
        });
      }

    } catch (err) {
      setGeneralError("A server error occurred. Please try again later.");
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
            Join thousands<br />of <em>property</em><br />managers.
          </h1>
          <p className="auth-left__sub">
            Set up your account in under 2 minutes and get full
            access to all RoomTrack features.
          </p>
        </div>
        <div className="deco-circle deco-circle--1" />
        <div className="deco-circle deco-circle--2" />
        <div className="deco-circle deco-circle--3" />
      </div>

      <div className="auth-right">
        <div className="auth-card auth-card--wide fade-up">
          <div className="auth-card__header">
            <h2>Create your account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {/* Role */}
          <div className="form-group">
            <label>I am a</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${role === "landlord" ? "active" : ""}`}
                onClick={() => setRole("landlord")}
              >
                🏢 Landlord
              </button>
              <button
                type="button"
                className={`role-btn ${role === "tenant" ? "active" : ""}`}
                onClick={() => setRole("tenant")}
              >
                🏠 Tenant
              </button>
            </div>
          </div>

          {/* Name Row */}
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input
                placeholder="First Name"
                value={firstName}
                className={errors.firstName ? "has-error" : ""}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <span className="field-err">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                placeholder="Last Name"
                value={lastName}
                className={errors.lastName ? "has-error" : ""}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <span className="field-err">{errors.lastName}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              className={errors.email ? "has-error" : ""}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="field-err">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone number</label>
            <input
              type="tel"
              placeholder="+63 900 000 0000"
              value={phone}
              className={errors.phone ? "has-error" : ""}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && <span className="field-err">{errors.phone}</span>}
          </div>

          {/* Passwords */}
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                className={errors.password ? "has-error" : ""}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <span className="field-err">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                className={errors.confirmPassword ? "has-error" : ""}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <span className="field-err">{errors.confirmPassword}</span>}
            </div>
          </div>

          {generalError && (
            <div className="form-error">
              ⚠️ {generalError}
            </div>
          )}

          <button
            className={`btn-submit ${loading ? "loading" : ""}`}
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>

          <div className="auth-card__footer">
            Already have an account?{" "}
            <span className="link" onClick={onGoToLogin}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

