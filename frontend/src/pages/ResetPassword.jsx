import { useState } from "react";
import PasswordInput from "../components/PasswordInput";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

function ResetPassword({ token, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Reset failed");

      setIsError(false);
      setMessage(data.message);
      setDone(true);
    } catch (err) {
      setIsError(true);
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-card">
        <div className="auth-icon-wrap">
          <span className="auth-icon">✅</span>
        </div>
        <h2 className="auth-title">Password Reset!</h2>
        <p className="auth-subtitle">
          Your password has been reset successfully.
        </p>
        <button className="auth-btn" onClick={onSuccess}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-icon-wrap">
        <span className="auth-icon">🔒</span>
      </div>
      <h2 className="auth-title">Reset Password</h2>
      <p className="auth-subtitle">Enter your new password below.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label">New Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            name="confirm"
          />
        </div>

        {message && (
          <p className={`auth-msg ${isError ? "auth-msg--error" : "auth-msg--success"}`}>
            {message}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
