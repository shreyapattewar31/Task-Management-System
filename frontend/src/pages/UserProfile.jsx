import { useState } from "react";
import PasswordInput from "../components/PasswordInput";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

function UserProfile({ user, token, onClose, onUserUpdate }) {
  const [name, setName] = useState(user.name || "");
  const [nameMsg, setNameMsg] = useState({ text: "", ok: false });
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });
  const [pwSaving, setPwSaving] = useState(false);

  const handleNameSave = async (e) => {
    e.preventDefault();
    setNameMsg({ text: "", ok: false });
    if (!name.trim()) {
      setNameMsg({ text: "Name cannot be empty", ok: false });
      return;
    }
    setNameSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setNameMsg({ text: "Name updated successfully!", ok: true });
      onUserUpdate({ ...user, name: data.user.name });
    } catch (err) {
      setNameMsg({ text: err.message, ok: false });
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", ok: false });

    if (newPw !== confirmPw) {
      setPwMsg({ text: "New passwords do not match", ok: false });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ text: "Password must be at least 6 characters", ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setPwMsg({ text: "Password changed successfully!", ok: true });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwMsg({ text: err.message, ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="User Profile"
      >
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {(user.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="profile-title">{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <span className={`profile-role-badge role-${user.role?.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
          <button className="profile-close" onClick={onClose} aria-label="Close profile">
            ✕
          </button>
        </div>

        {/* Edit Name */}
        <section className="profile-section">
          <h3 className="profile-section-title">Edit Profile</h3>
          <form onSubmit={handleNameSave} className="profile-form">
            <div className="profile-field">
              <label className="profile-label">Full Name</label>
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <input
                className="profile-input profile-input--disabled"
                type="email"
                value={user.email}
                disabled
                title="Email cannot be changed"
              />
            </div>
            {nameMsg.text && (
              <p className={`profile-msg ${nameMsg.ok ? "profile-msg--ok" : "profile-msg--err"}`}>
                {nameMsg.text}
              </p>
            )}
            <button type="submit" className="profile-btn" disabled={nameSaving}>
              {nameSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="profile-section">
          <h3 className="profile-section-title">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="profile-field">
              <label className="profile-label">Current Password</label>
              <PasswordInput
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                name="currentPassword"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">New Password</label>
              <PasswordInput
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                name="newPassword"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Confirm New Password</label>
              <PasswordInput
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                name="confirmPassword"
              />
            </div>
            {pwMsg.text && (
              <p className={`profile-msg ${pwMsg.ok ? "profile-msg--ok" : "profile-msg--err"}`}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" className="profile-btn" disabled={pwSaving}>
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default UserProfile;
