import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TeamsPage() {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rolesByTeamId, setRolesByTeamId] = useState({});
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  useEffect(() => {
    let active = true;
    const loadTeams = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/teams", { token });
        if (active) {
          setTeams(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          if (err.status === 401) {
            logout();
            navigate("/login");
            return;
          }
          setError(err.message || "Unable to load teams.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadTeams();
    return () => {
      active = false;
    };
  }, [token, logout, navigate]);

  useEffect(() => {
    let active = true;
    const loadRoles = async () => {
      if (teams.length === 0) {
        if (active) {
          setRolesByTeamId({});
          setRolesError("");
          setRolesLoading(false);
        }
        return;
      }

      setRolesLoading(true);
      setRolesError("");

      try {
        const me = await apiRequest("/auth/me", { token });
        const entries = await Promise.all(
          teams.map(async (team) => {
            try {
              const members = await apiRequest(`/teams/${team.id}/members`, { token });
              const match = Array.isArray(members)
                ? members.find((member) => member.user_id === me.id)
                : null;
              return [team.id, match?.role || "member"];
            } catch (err) {
              if (err.status === 401) {
                throw err;
              }
              return [team.id, "member"];
            }
          })
        );

        if (active) {
          setRolesByTeamId(Object.fromEntries(entries));
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setRolesError(err.message || "Unable to load roles.");
      } finally {
        if (active) {
          setRolesLoading(false);
        }
      }
    };

    if (!loading && !error) {
      loadRoles();
    }

    return () => {
      active = false;
    };
  }, [teams, loading, error, token, logout, navigate]);

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page">
      <div className="panel">
        <div className="column">
          <h2>Your teams</h2>
          {loading && <div className="muted">Loading teams...</div>}
          {!loading && error && <div className="error">{error}</div>}
          {!loading && !error && teams.length === 0 && (
            <div className="muted">You are not on any teams yet.</div>
          )}
          {!loading && !error && teams.length > 0 && (
            <ul className="list">
              {teams.map((team) => (
                <li key={team.id} className="list-item">
                  <span>{team.name}</span>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => navigate(`/teams/${team.id}`)}
                    disabled={loading}
                  >
                    open team
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="column">
          <h2>Your roles</h2>
          {rolesLoading && <div className="muted">Loading roles...</div>}
          {!rolesLoading && (rolesError || error) && (
            <div className="error">{rolesError || error}</div>
          )}
          {!rolesLoading && !rolesError && !error && teams.length === 0 && (
            <div className="muted">No roles to show.</div>
          )}
          {!rolesLoading && !rolesError && !error && teams.length > 0 && (
            <ul className="list">
              {teams.map((team) => (
                <li key={team.id} className="list-item compact">
                  <span>{team.name}</span>
                  <span className="pill">{rolesByTeamId[team.id] || "member"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="action-bar">
        <button
          type="button"
          className="primary"
          onClick={() => navigate("/teams/new")}
          disabled={loading}
        >
          Create a new team
        </button>
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
