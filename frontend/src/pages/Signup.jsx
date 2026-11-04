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
    <div className="auth-container">
      <h2>Create Account</h2>

      <form onSubmit={onSubmit}>
        <label>Name *</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          placeholder="Create a password"
        />

        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Sign Up"}
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToLogin}
        >
          Login
        </button>
      </p>
    </div>
  );
}

export default Signup;