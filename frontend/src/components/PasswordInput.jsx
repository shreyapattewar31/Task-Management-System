
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      
    </div>
  );
}

export default PasswordInput;
