import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { ApiError, request } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const loadTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/v1/teams");
      setTeams(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setError(err.message || "Failed to load teams");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await request("/api/v1/teams", {
        method: "POST",
        body: { name: name.trim() },
      });
      setName("");
      await loadTeams();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setError(err.message || "Failed to create team");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Create team</h2>
        <ErrorBanner message={error} />
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <label htmlFor="team-name">Team name</label>
            <input
              id="team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New team name"
            />
          </div>
          <button type="submit" disabled={busy}>
            Create
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Your teams</h2>
        {loading ? (
          <p>Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="notice">No teams yet.</p>
        ) : (
          <ul>
            {teams.map((team) => (
              <li key={team.id} className="inline-actions" style={{ marginBottom: 8 }}>
                <span>{team.name}</span>
                <Link to={`/teams/${team.id}`}>Open</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
