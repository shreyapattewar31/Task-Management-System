import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APIBASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://task-management-system-v5mx.onrender.com/api");

export default function GoogleSignIn({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function handleCredential(response) {
      fetch(`${APIBASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })
        .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) throw new Error(d.message || "Google sign-in failed");
          onSuccessRef.current(d);
        })
        .catch((err) => onErrorRef.current(err.message || "Google sign-in failed"));
    }

    function initGoogle() {
      if (!window.google?.accounts || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: btnRef.current.offsetWidth || 340,
        text: "continue_with",
        shape: "rectangular",
      });
    }

    const scriptId = "google-gsi";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = initGoogle;
      document.head.appendChild(s);
    } else if (window.google?.accounts) {
      initGoogle();
    }

    return () => { window.google?.accounts?.id?.cancel(); };
  }, []); // runs once — handleCredential closes over cbRef which is always current

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="google-btn-disabled">
        <span>🔒</span> Google Sign-In (not configured — add VITE_GOOGLE_CLIENT_ID)
      </div>
    );
  }

  return (
    <div className="google-btn-wrap">
      <div ref={btnRef} style={{ width: "100%" }} />
    </div>
  );
}
