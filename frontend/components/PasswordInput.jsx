import { useState } from "react";

function PasswordInput({
  value,
  onChange,
  placeholder = "Enter your password",
  required = true,
  name = "password",
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />

      <button
        type="button"
        className="password-toggle"
        onClick={() => setShowPassword((previous) => !previous)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
      >
        {showPassword ? "🙈" : "👁"}
      </button>
    </div>
  );
}

export default PasswordInput;