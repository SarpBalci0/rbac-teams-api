import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { ApiError, request } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const roleOptions = ["admin", "member", "viewer"];

const statusMessages = {
  401: "Session expired",
  403: "You don't have permission",
  404: "Team not found",
  409: "User already a member",
};

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("member");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentRole = useMemo(() => {
    if (!user) {
      return null;
    }
    const record = members.find((member) => member.user_id === user.id);
    return record?.role || null;
  }, [members, user]);

  const handleError = (err, fallback) => {
    if (err instanceof ApiError && err.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return;
    }
    const message =
      (err instanceof ApiError && statusMessages[err.status]) ||
      err.message ||
      fallback;
    setError(message);
  };

  const loadTeam = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamData, memberData] = await Promise.all([
        request(`/api/v1/teams/${teamId}`),
        request(`/api/v1/teams/${teamId}/members`),
      ]);
      setTeam(teamData);
      setMembers(memberData);
    } catch (err) {
      handleError(err, "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!addEmail.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request(`/api/v1/teams/${teamId}/members`, {
        method: "POST",
        body: { email: addEmail.trim(), role: addRole },
      });
      setAddEmail("");
      setAddRole("member");
      await loadTeam();
    } catch (err) {
      handleError(err, "Failed to add member");
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (member, role) => {
    setBusy(true);
    setError("");
    try {
      await request(`/api/v1/teams/${teamId}/members/${member.user_id}`, {
        method: "PATCH",
        body: { role },
      });
      await loadTeam();
    } catch (err) {
      handleError(err, "Failed to change role");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (member) => {
    const confirmed = window.confirm(`Remove ${member.email} from this team?`);
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request(`/api/v1/teams/${teamId}/members/${member.user_id}`, {
        method: "DELETE",
      });
      await loadTeam();
    } catch (err) {
      handleError(err, "Failed to remove member");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="card">Loading team...</div>;
  }

  if (!team) {
    return (
      <div className="card">
        <ErrorBanner message={error || "Team not found"} />
        <Link to="/teams">Back to teams</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <Link to="/teams">← Back to teams</Link>
        <h2>{team.name}</h2>
        <p className="notice">Your role: {currentRole || "unknown"}</p>
      </div>

      <div className="card">
        <h3>Members</h3>
        <ErrorBanner message={error} />
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = user?.id === member.user_id;
              return (
                <tr key={member.user_id}>
                  <td>{member.email}</td>
                  <td>
                    {currentRole === "admin" ? (
                      <select
                        value={member.role}
                        disabled={busy || isSelf}
                        onChange={(event) => handleRoleChange(member, event.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      member.role
                    )}
                  </td>
                  <td>
                    {currentRole === "admin" && !isSelf ? (
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() => handleRemove(member)}
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="notice">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {currentRole === "admin" && (
        <div className="card">
          <h3>Add member</h3>
          <form onSubmit={handleAddMember}>
            <div className="form-row">
              <label htmlFor="member-email">User email</label>
              <input
                id="member-email"
                type="email"
                value={addEmail}
                onChange={(event) => setAddEmail(event.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-row">
              <label htmlFor="member-role">Role</label>
              <select
                id="member-role"
                value={addRole}
                onChange={(event) => setAddRole(event.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={busy}>
              Add member
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
