import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request, mapApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function TeamsPage() {
  const { logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request("/api/v1/teams");
      setTeams(data ?? []);
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
      }
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await request("/api/v1/teams", {
        method: "POST",
        body: { name: name.trim() },
      });
      setName("");
      await loadTeams();
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
      }
      setError(mapApiError(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="card">
      <div className="page-title">
        <div>
          <h2>Teams</h2>
          <p className="muted">Create a team or open an existing one.</p>
        </div>
      </div>
      <ErrorBanner message={error} />
      <form className="form-grid" onSubmit={handleCreate}>
        <div>
          <label htmlFor="team-name">Team name</label>
          <input
            id="team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme Inc"
            minLength={2}
            required
          />
        </div>
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create team"}
        </button>
      </form>

      <hr style={{ margin: "24px 0" }} />

      {loading ? (
        <p className="muted">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p className="muted">No teams yet.</p>
      ) : (
        <ul className="list">
          {teams.map((team) => (
            <li key={team.id} className="list-item">
              <div>
                <strong>{team.name}</strong>
                <div className="muted">ID: {team.id}</div>
              </div>
              <Link to={`/teams/${team.id}`}>
                <button type="button">Open</button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
