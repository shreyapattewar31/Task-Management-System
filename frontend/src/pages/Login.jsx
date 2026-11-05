import PasswordInput from "../components/PasswordInput";

function Login({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  error,
  onSwitchToSignup,
  onForgotPassword,
}) {
  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="auth-field">
        <label htmlFor="login-email" className="auth-label">Email</label>
        <input
          id="login-email"
          type="email"
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label htmlFor="login-password" className="auth-label">Password</label>
          {onForgotPassword && (
            <button
              type="button"
              className="link-button auth-forgot"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          )}
        </div>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <p className="auth-msg auth-msg--error" role="alert">{error}</p>
      )}

      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" className="link-button" onClick={onSwitchToSignup}>
          Create account
        </button>
      </p>
    </form>
  );
}

export default Login;
