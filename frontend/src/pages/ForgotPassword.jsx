import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Request failed");

      setIsError(false);
      setMessage(data.message);
    } catch (err) {
      setIsError(true);
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-icon-wrap">
        <span className="auth-icon">🔑</span>
      </div>
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-subtitle">
        Enter your email address and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="fp-email" className="auth-label">Email</label>
          <input
            id="fp-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && (
          <p className={`auth-msg ${isError ? "auth-msg--error" : "auth-msg--success"}`}>
            {message}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="auth-switch">
        <button type="button" className="link-button" onClick={onBack}>
          ← Back to Login
        </button>
      </p>
    </div>
  );
}

export default ForgotPassword;
