import { useState, useRef } from "react";
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

  // Profile picture
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || "");
  const [avatarMsg, setAvatarMsg] = useState({ text: "", ok: false });
  const [avatarSaving, setAvatarSaving] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ text: "Please select an image file", ok: false });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ text: "Image must be less than 2MB", ok: false });
      return;
    }
    setAvatarFile(file);
    setAvatarMsg({ text: "", ok: false });
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value.trim();
    setAvatarUrl(url);
    setAvatarMsg({ text: "", ok: false });
    if (url) setAvatarPreview(url);
  };

  const handleAvatarSave = async (e) => {
    e.preventDefault();
    setAvatarMsg({ text: "", ok: false });
    setAvatarSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const res = await fetch(`${API_URL}/auth/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        finalAvatarUrl = data.avatarUrl;
      } else if (avatarUrl && avatarUrl !== user.avatarUrl) {
        const res = await fetch(`${API_URL}/auth/avatar-url`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Update failed");
        finalAvatarUrl = data.avatarUrl;
      } else {
        setAvatarMsg({ text: "No changes to save", ok: false });
        return;
      }

      setAvatarMsg({ text: "Profile picture updated!", ok: true });
      setAvatarPreview(finalAvatarUrl);
      onUserUpdate({ ...user, avatarUrl: finalAvatarUrl });
    } catch (err) {
      setAvatarMsg({ text: err.message, ok: false });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async (e) => {
    e.preventDefault();
    if (!window.confirm("Remove your profile picture?")) return;
    setAvatarSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove avatar");
      setAvatarMsg({ text: "Profile picture removed", ok: true });
      setAvatarUrl("");
      setAvatarFile(null);
      setAvatarPreview("");
      onUserUpdate({ ...user, avatarUrl: "" });
    } catch (err) {
      setAvatarMsg({ text: err.message, ok: false });
    } finally {
      setAvatarSaving(false);
    }
  };

  const initials = (user.name || "U").slice(0, 2).toUpperCase();

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
            {avatarPreview ? (
              <img src={avatarPreview} alt={`${user.name}'s avatar`} />
            ) : (
              initials
            )}
            <label className="profile-avatar-edit" title="Change avatar">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: "none" }}
              />
              📷
            </label>
          </div>
          <div className="profile-header-content">
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

        {/* Edit Profile Picture */}
        <section className="profile-section">
          <h3 className="profile-section-title">Profile Picture</h3>
          <form onSubmit={handleAvatarSave} className="profile-form profile-image-upload">
            <div className="profile-field">
              <label className="profile-label">Upload Image</label>
              <div className="profile-avatar-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="profile-input"
                  style={{ display: "none" }}
                  id="avatar-file-input"
                  ref={fileInputRef}
                />
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="profile-image-preview" />
                ) : (
                  <div className="profile-image-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--admin-bg)", color: "var(--admin-text-muted)", fontSize: "24px" }}>
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  className="profile-upload-btn profile-upload-btn--primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarSaving}
                >
                  📁 Upload Image
                </button>
              </div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Or Image URL</label>
              <input
                type="url"
                className="profile-input"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={handleAvatarUrlChange}
              />
            </div>
            <div className="profile-upload-btns">
              <button type="submit" className="profile-btn profile-btn--primary" disabled={avatarSaving}>
                {avatarSaving ? "Saving..." : "Save Picture"}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="profile-upload-btn"
                  onClick={handleRemoveAvatar}
                  disabled={avatarSaving}
                >
                  Remove
                </button>
              )}
            </div>
            {avatarMsg.text && (
              <p className={`profile-msg ${avatarMsg.ok ? "profile-msg--ok" : "profile-msg--err"}`}>
                {avatarMsg.text}
              </p>
            )}
          </form>
        </section>

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