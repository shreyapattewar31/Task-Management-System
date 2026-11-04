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
}) {
  return (
    <div className="auth-container">
      <h2>Login</h2>

      <form onSubmit={onSubmit}>
        <label>Email *</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password *</label>
        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
        />

        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToSignup}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default Login;