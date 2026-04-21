import { useState, useCallback } from "react";

// ─── ALLOWED USERS ──────────────────────────────────────────────
// Add or remove real company emails here. Only these people can access the app.
const ALLOWED_EMAILS = [
  "amritpal@aghotels.co.uk",
  "girish@aghotels.co.uk",
  // "john.smith@aghotels.co.uk",
];
// ─────────────────────────────────────────────────────────────────

const USERS_KEY = "ag_registered_users";
const SESSION_KEY = "ag_session";

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (s && s.email && ALLOWED_EMAILS.includes(s.email)) return s;
  } catch {}
  return null;
}

function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("email"); // "email" | "password" | "setup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError("");
      const trimmed = email.trim().toLowerCase();
      if (!ALLOWED_EMAILS.includes(trimmed)) {
        setError("This email is not authorised. Contact your administrator.");
        return;
      }
      setEmail(trimmed);
      const users = getUsers();
      setStep(users[trimmed] ? "password" : "setup");
    },
    [email]
  );

  const handlePasswordSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);
      const hashed = await hashPassword(password);
      const users = getUsers();

      if (step === "setup") {
        if (password !== confirm) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        users[email] = { hash: hashed, createdAt: Date.now() };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } else {
        if (!users[email] || users[email].hash !== hashed) {
          setError("Incorrect password.");
          setLoading(false);
          return;
        }
      }

      const session = { email, loggedInAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setLoading(false);
      onLogin(session);
    },
    [email, password, confirm, step, onLogin]
  );

  const s = {
    wrapper: {
      fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      background: "#0f1117",
      color: "#e0e0e0",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    card: {
      background: "#1a1d27",
      border: "1px solid #262a36",
      borderRadius: 12,
      padding: "36px 32px 28px",
      width: "100%",
      maxWidth: 380,
    },
    logo: {
      fontSize: 22,
      fontWeight: 700,
      color: "#f0f0f0",
      margin: 0,
      textAlign: "center",
    },
    sub: {
      fontSize: 12,
      color: "#555",
      textAlign: "center",
      margin: "6px 0 24px",
    },
    label: {
      display: "block",
      fontSize: 11,
      color: "#888",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: 14,
      borderRadius: 6,
      border: "1px solid #333",
      background: "#0f1117",
      color: "#f0f0f0",
      marginBottom: 14,
      boxSizing: "border-box",
      outline: "none",
    },
    btn: {
      width: "100%",
      padding: "11px 0",
      fontSize: 14,
      fontWeight: 600,
      borderRadius: 6,
      border: "none",
      background: "#2d6a4f",
      color: "#fff",
      cursor: "pointer",
      marginTop: 4,
    },
    back: {
      marginTop: 16,
      fontSize: 12,
      color: "#555",
      textAlign: "center",
    },
    link: {
      color: "#4a9",
      cursor: "pointer",
      textDecoration: "underline",
      background: "none",
      border: "none",
      fontSize: 12,
      padding: 0,
    },
    error: {
      background: "#2a1e10",
      border: "1px solid #4a3520",
      borderRadius: 6,
      padding: "8px 12px",
      fontSize: 12,
      color: "#e8c080",
      marginBottom: 14,
    },
    info: {
      fontSize: 10,
      color: "#444",
      textAlign: "center",
      marginTop: 18,
    },
    emailBadge: {
      display: "inline-block",
      background: "#0f1117",
      border: "1px solid #333",
      borderRadius: 4,
      padding: "4px 10px",
      fontSize: 12,
      color: "#4a9",
      marginBottom: 16,
      textAlign: "center",
      width: "100%",
      boxSizing: "border-box",
    },
  };

  if (step === "email") {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <h1 style={s.logo}>AG Hotels</h1>
          <p style={s.sub}>Enter your company email to continue</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleEmailSubmit}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@aghotels.co.uk"
              style={s.input}
              required
              autoFocus
            />
            <button type="submit" style={s.btn}>
              Continue
            </button>
          </form>
          <div style={s.info}>
            Restricted to authorised <strong style={{ color: "#666" }}>@aghotels.co.uk</strong> accounts only
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <h1 style={s.logo}>AG Hotels</h1>
        <p style={s.sub}>
          {step === "setup" ? "Set up your password" : "Enter your password"}
        </p>
        <div style={s.emailBadge}>{email}</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handlePasswordSubmit}>
          <label style={s.label}>
            {step === "setup" ? "Create Password" : "Password"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            style={s.input}
            required
            autoFocus
          />
          {step === "setup" && (
            <>
              <label style={s.label}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                style={s.input}
                required
              />
            </>
          )}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading
              ? "Please wait..."
              : step === "setup"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>
        <div style={s.back}>
          <button
            style={s.link}
            onClick={() => {
              setStep("email");
              setPassword("");
              setConfirm("");
              setError("");
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(getSession);

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "6px 20px 0",
          fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
          background: "#0f1117",
        }}
      >
        <span style={{ fontSize: 11, color: "#555" }}>{session.email}</span>
        <button
          onClick={() => {
            localStorage.removeItem(SESSION_KEY);
            setSession(null);
          }}
          style={{
            fontSize: 11,
            color: "#c1121f",
            background: "none",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "3px 10px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
      {children}
    </div>
  );
}
