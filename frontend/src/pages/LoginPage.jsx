import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { mapApiError } from "../api/client.js";

export default function LoginPage() {
  const { login, register, token, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (token) {
      navigate("/teams", { replace: true });
    }
  }, [token, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await login(email, password);
      navigate("/teams", { replace: true });
    } catch (err) {
      setLocalError(mapApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await register(email, password);
      navigate("/teams", { replace: true });
    } catch (err) {
      setLocalError(mapApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Welcome back</h2>
        <p className="muted">Log in or create an account to manage teams.</p>
        <ErrorBanner message={localError || mapApiError(error)} />
        <form className="form-grid" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Login"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleRegister}
              disabled={submitting}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
