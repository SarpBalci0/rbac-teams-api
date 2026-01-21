import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request, mapApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

const ROLE_OPTIONS = ["admin", "member", "viewer"];

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [actionId, setActionId] = useState(null);

  const currentRole = useMemo(() => {
    if (!user) {
      return null;
    }
    return members.find((member) => member.user_id === user.id)?.role ?? null;
  }, [members, user]);

  const loadTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamData, membersData] = await Promise.all([
        request(`/api/v1/teams/${teamId}`),
        request(`/api/v1/teams/${teamId}/members`),
      ]);
      setTeam(teamData);
      setMembers(membersData ?? []);
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
        return;
      }
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
  }, [teamId]);

  const handleAddMember = async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await request(`/api/v1/teams/${teamId}/members`, {
        method: "POST",
        body: { email: memberEmail.trim(), role: memberRole },
      });
      setMemberEmail("");
      setMemberRole("member");
      await loadTeam();
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
        return;
      }
      setError(mapApiError(err));
    } finally {
      setPending(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setActionId(userId);
    setError(null);
    try {
      await request(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: "PATCH",
        body: { role },
      });
      await loadTeam();
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
        return;
      }
      setError(mapApiError(err));
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (userId) => {
    const confirmed = window.confirm("Remove this member?");
    if (!confirmed) {
      return;
    }
    setActionId(userId);
    setError(null);
    try {
      await request(`/api/v1/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });
      await loadTeam();
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
        return;
      }
      setError(mapApiError(err));
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <p className="muted">Loading team...</p>;
  }

  if (!team) {
    return (
      <div>
        <ErrorBanner message={error || "Team not found"} />
        <button type="button" onClick={() => navigate("/teams")}>
          Back to teams
        </button>
      </div>
    );
  }

  const isAdmin = currentRole === "admin";

  return (
    <div className="card">
      <div className="page-title">
        <div>
          <h2>{team.name}</h2>
          <p className="muted">
            Team ID: {team.id} · Your role: {currentRole ?? "unknown"}
          </p>
        </div>
        <button type="button" className="secondary" onClick={() => navigate("/teams")}
        >
          Back to teams
        </button>
      </div>

      <ErrorBanner message={error} />

      <h3>Members</h3>
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Role</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.user_id}>
              <td>{member.user_id}</td>
              <td>
                {isAdmin && member.user_id !== user?.id ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      handleRoleChange(member.user_id, event.target.value)
                    }
                    disabled={actionId === member.user_id}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="badge">{member.role}</span>
                )}
              </td>
              {isAdmin && (
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={actionId === member.user_id || member.user_id === user?.id}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <div style={{ marginTop: 24 }}>
          <h3>Add member</h3>
          <form className="form-grid" onSubmit={handleAddMember}>
            <div>
              <label htmlFor="member-email">User email</label>
              <input
                id="member-email"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="member-role">Role</label>
              <select
                id="member-role"
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add member"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
