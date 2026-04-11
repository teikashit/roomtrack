import { useState, useEffect } from "react";
import { User } from "../../App";
import supabase from "../../supabaseClient";
import "./Profile.css";

interface ProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void; 
}

function Profile({ user, onBack, onLogout, onUpdateUser }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "photo">("profile");

  // Profile fields
  const [fullName, setFullName]   = useState(user.name || "");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");

  // Password fields
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");

  // Photo
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl]     = useState<string | null>(null);

  // UI states
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");
  const [error, setError]       = useState("");

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || user.name);
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setPhotoUrl(data.photo_url || null);
      }
    };
    loadProfile();
  }, [user.id, user.name]);

  // ── Edit Profile ──
  const handleEditProfile = async () => {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    setLoading(true); setError(""); setMessage("");

    const { error: err } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: phone,
        address: address,
        role: user.role,
      });

    if (err) {
      setError(err.message);
    } else {
      setMessage("✅ Profile updated successfully!");
       onUpdateUser({
    ...user,
    name: fullName,
  });
    }
    setLoading(false);
  };

  // ── Edit Password ──
  const handleEditPassword = async () => {
    if (!newPassword)                     { setError("Please enter a new password."); return; }
    if (newPassword.length < 6)           { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword)  { setError("Passwords do not match."); return; }

    setLoading(true); setError(""); setMessage("");

    const { error: err } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (err) {
      setError(err.message);
    } else {
      setMessage("✅ Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  // ── Upload Photo ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) { setError("Please select a photo first."); return; }

    setLoading(true); setError(""); setMessage("");

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(fileName, photoFile, { upsert: true });

    if (uploadErr) {
      setError(uploadErr.message);
      setLoading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save URL to profiles table
    const { error: dbErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, photo_url: publicUrl, role: user.role });

    if (dbErr) {
      setError(dbErr.message);
    } else {
      setPhotoUrl(publicUrl);
      setMessage("✅ Photo uploaded successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="profile-page">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="profile-sidebar__brand">
          <span className="brand-icon">🏠</span>
          <span className="brand-name">RoomTrack</span>
        </div>

        <div className="profile-avatar">
          {photoUrl ? (
            <img src={photoUrl} alt="avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-name">{fullName}</div>
          <div className="profile-email">{user.email}</div>
          <div className={`role-badge role-badge--${user.role}`}>{user.role}</div>
        </div>

        <nav className="profile-nav">
          <button
            className={`profile-nav__item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setMessage(""); setError(""); }}
          >
            👤 Edit Profile
          </button>
          <button
            className={`profile-nav__item ${activeTab === "password" ? "active" : ""}`}
            onClick={() => { setActiveTab("password"); setMessage(""); setError(""); }}
          >
            🔒 Edit Password
          </button>
          <button
            className={`profile-nav__item ${activeTab === "photo" ? "active" : ""}`}
            onClick={() => { setActiveTab("photo"); setMessage(""); setError(""); }}
          >
            📷 Upload Photo
          </button>
        </nav>

        <div className="profile-sidebar__actions">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main">

        {/* ── Edit Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="profile-card fade-up">
            <h2>Edit Profile</h2>
            <p className="profile-card__sub">Update your personal information</p>

            <div className="form-group">
              <label>Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Theodore Narsico"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 900 000 0000"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Filipino St, Cebu City"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={user.email} disabled className="input-disabled" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={user.role} disabled className="input-disabled" />
            </div>

            {error   && <div className="form-error">⚠️ {error}</div>}
            {message && <div className="form-success">{message}</div>}

            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleEditProfile}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </div>
        )}

        {/* ── Edit Password Tab ── */}
        {activeTab === "password" && (
          <div className="profile-card fade-up">
            <h2>Edit Password</h2>
            <p className="profile-card__sub">Change your account password</p>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>

            {error   && <div className="form-error">⚠️ {error}</div>}
            {message && <div className="form-success">{message}</div>}

            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleEditPassword}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Update Password"}
            </button>
          </div>
        )}

        {/* ── Upload Photo Tab ── */}
        {activeTab === "photo" && (
          <div className="profile-card fade-up">
            <h2>Upload Photo</h2>
            <p className="profile-card__sub">Upload your profile picture</p>

            <div className="photo-upload-area">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="photo-preview" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="current" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <span>📷</span>
                  <p>No photo uploaded yet</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Select Photo (.jpg, .png)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handlePhotoChange}
                className="file-input"
              />
            </div>

            {error   && <div className="form-error">⚠️ {error}</div>}
            {message && <div className="form-success">{message}</div>}

            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleUploadPhoto}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Upload Photo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

