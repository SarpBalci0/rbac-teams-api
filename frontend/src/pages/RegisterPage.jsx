import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: { email, password },
        token: null
      });
      navigate("/login");
    } catch (err) {
      if (err?.status === 409) {
        setError("Email already registered.");
      } else if (err?.status === 400 || err?.status === 422) {
        setError(err.message || "Please check the form fields.");
      } else if (err?.isNetworkError) {
        setError(err.message);
      } else if (err?.status >= 500) {
        setError("Server error while signing up. Check backend logs.");
      } else {
        setError(err?.message || "Unable to sign up.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="card">
        <div className="auth-switch">
          <button
            className="tab"
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
          <button className="tab active" type="button">
            Sign up
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
