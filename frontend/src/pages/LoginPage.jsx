import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { ApiError } from "../api/client.js";

export default function LoginPage() {
  const { login, register, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (token) {
      navigate("/teams", { replace: true });
    }
  }, [navigate, token]);

  const handleAuth = async (action) => {
    setBusy(true);
    setError("");
    try {
      if (action === "register") {
        await register(email, password);
      } else {
        await login(email, password);
      }
      const from = location.state?.from?.pathname || "/teams";
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Welcome</h2>
      <p className="notice">Sign in or create an account to manage your teams.</p>
      <ErrorBanner message={error} />
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="form-row">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
        />
      </div>
      <div className="inline-actions">
        <button type="button" onClick={() => handleAuth("login")} disabled={busy}>
          Login
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => handleAuth("register")}
          disabled={busy}
        >
          Register
        </button>
      </div>
    </div>
  );
}
