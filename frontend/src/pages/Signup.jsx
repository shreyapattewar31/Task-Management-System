import PasswordInput from "../components/PasswordInput";

function Signup({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  error,
  onSwitchToLogin,
}) {
  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="auth-field">
        <label htmlFor="signup-name" className="auth-label">Full Name</label>
        <input
          id="signup-name"
          type="text"
          className="auth-input"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-email" className="auth-label">Email</label>
        <input
          id="signup-email"
          type="email"
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password" className="auth-label">Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
      </div>

      {error && (
        <p className={`auth-msg ${error.startsWith("Account created") ? "auth-msg--success" : "auth-msg--error"}`} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </button>

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="link-button" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </form>
  );
}

export default Signup;
