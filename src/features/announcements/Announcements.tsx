import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./Announcements.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToRoomManagement?: () => void;
  onGoToMyRoom?: () => void;
  onGoToPayments: () => void;
  onGoToAnnouncements: () => void;
  onGoToDashboard?: () => void;
}

const ICONS = ["📣", "🔔", "📌", "🏠", "💡", "⚠️", "🛠️", "🎉"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Announcements({
  user, onLogout, onGoToProfile, onGoToRoomManagement, onGoToMyRoom, onGoToPayments, onGoToAnnouncements, onGoToDashboard
}: Props) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const isLandlord = user.role === "landlord";

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAllAnnouncements();
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAnnouncements(sorted);
    } catch (e) { /* silently fail */ }
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openPost = () => {
    setTitle(""); setContent(""); setFormError("");
    setShowModal(true);
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) { setFormError("Please fill in all fields."); return; }
    setFormLoading(true);
    setFormError("");
    try {
      await api.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        landlord_id: user.id,
        landlord_name: user.name,
      });
      setShowModal(false);
      fetchAnnouncements();
    } catch (e) {
      setFormError("Failed to post announcement. Please try again.");
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (e) { /* silently fail */ }
  };

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Announcements"
      onGoToProfile={onGoToProfile}
      onGoToRoomManagement={onGoToRoomManagement}
      onGoToMyRoom={onGoToMyRoom}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
      onGoToDashboard={onGoToDashboard}
    >
      <div className="ann-header fade-up">
        <div>
          <h1 className="ann-title">Announcements</h1>
          <p className="ann-sub">
            {isLandlord
              ? "Post and manage announcements for all tenants."
              : "Stay updated with the latest news from your landlord."}
          </p>
        </div>
        {isLandlord && (
          <button className="btn-primary" onClick={openPost}>+ New Announcement</button>
        )}
      </div>

      {loading ? (
        <div className="ann-loading">Loading announcements…</div>
      ) : (
        <div className="ann-grid fade-up delay-1">
          {announcements.length === 0 ? (
            <div className="ann-empty">
              <div className="ann-empty-icon">📭</div>
              <div>No announcements yet.</div>
              {isLandlord && (
                <div style={{ marginTop: "10px", fontSize: "13px" }}>Click "New Announcement" to post one.</div>
              )}
            </div>
          ) : (
            announcements.map((a, i) => (
              <div key={a.id} className={`ann-card fade-up delay-${Math.min(i + 1, 5)}`}>
                <div className="ann-card__top">
                  <div className="ann-card__icon">{ICONS[i % ICONS.length]}</div>
                  <div className="ann-card__meta">
                    <div className="ann-card__title">{a.title}</div>
                    <div className="ann-card__time">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
                <div className="ann-card__content">{a.content}</div>
                {isLandlord && (
                  <div className="ann-card__footer">
                    <button className="ann-delete-btn" onClick={() => handleDelete(a.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__title">📣 New Announcement</span>
              <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water Interruption Notice" />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement here…" />
              </div>
              {formError && <div className="form-error">{formError}</div>}
            </div>
            <div className="modal__foot">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePost} disabled={formLoading}>
                {formLoading ? "Posting…" : "Post Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
