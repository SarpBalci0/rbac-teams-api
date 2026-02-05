import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function CreateTeamPage() {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Team name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/teams", {
        method: "POST",
        body: { name: name.trim() },
        token
      });
      if (!data?.id) {
        throw new Error("Missing team id");
      }
      navigate(`/teams/${data.id}`);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      setError(err.message || "Unable to create team.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page auth-page">
      <div className="card">
        <form className="form" onSubmit={handleCreate}>
          <label className="field">
            <span>New team name:</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <div className="action-bar">
        <button type="button" className="ghost" onClick={() => window.history.back()}>
          Go back
        </button>
        <button type="button" className="danger" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
