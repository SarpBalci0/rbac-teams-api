import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    let active = true;
    const loadMembers = async () => {
      setLoading(true);
      setError("");
      setPermissionError("");
      try {
        const data = await apiRequest(`/teams/${teamId}/members`, { token });
        if (active) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          if (err.status === 401) {
            logout();
            navigate("/login");
            return;
          }
          if (err.status === 403) {
            setPermissionError("You do not have permission to view members.");
            return;
          }
          setError(err.message || "Unable to load members.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadMembers();
    return () => {
      active = false;
    };
  }, [teamId, token, logout, navigate]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    const found = members.find((member) => String(member.user_id) === String(selectedId));
    if (!found) {
      setSelectedId(null);
      setSelectedRole("member");
      setSaveError("");
    }
  }, [members, selectedId]);

  const selectedMember = useMemo(
    () => members.find((member) => String(member.user_id) === String(selectedId)),
    [members, selectedId]
  );

  const handleSelect = (member) => {
    setSelectedId(member.user_id);
    setSelectedRole(member.role || "member");
    setSaveError("");
  };

  const handleSave = async () => {
    if (!selectedMember) return;
    setSaving(true);
    setSaveError("");
    setPermissionError("");
    try {
      await apiRequest(`/teams/${teamId}/members/${selectedMember.user_id}`, {
        method: "PATCH",
        body: { role: selectedRole },
        token
      });
      setMembers((prev) =>
        prev.map((member) =>
          member.user_id === selectedMember.user_id
            ? { ...member, role: selectedRole }
            : member
        )
      );
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      if (err.status === 403) {
        setPermissionError("You do not have permission to change roles.");
        setSaveError("You do not have permission to change roles.");
        return;
      }
      setSaveError(err.message || "Unable to save role.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    const emailToAdd = newEmail.trim();
    if (!emailToAdd) {
      setAddError("Email is required.");
      return;
    }
    setAdding(true);
    setAddError("");
    setPermissionError("");
    try {
      const data = await apiRequest(`/teams/${teamId}/members`, {
        method: "POST",
        body: { email: emailToAdd, role: newRole },
        token
      });
      setMembers((prev) => {
        if (!data || prev.some((member) => member.user_id === data.user_id)) {
          return prev;
        }
        return [...prev, data];
      });
      setNewEmail("");
      setNewRole("member");
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      if (err.status === 403) {
        setPermissionError("You do not have permission to add members.");
        setAddError("You do not have permission to add members.");
        return;
      }
      if (err.status === 404) {
        setAddError("User not found.");
        return;
      }
      if (err.status === 409) {
        setAddError("User is already a member.");
        return;
      }
      setAddError(err.message || "Unable to add member.");
    } finally {
      setAdding(false);
    }
  };

  const actionsDisabled = Boolean(permissionError);

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page">
      <div className="panel">
        <div className="column">
          <h2>Team members</h2>
          {loading && <div className="muted">Loading members...</div>}
          {!loading && error && <div className="error">{error}</div>}
          {!loading && !error && members.length === 0 && (
            <div className="muted">No members found.</div>
          )}
          {!loading && !error && members.length > 0 && (
            <ul className="list">
              {members.map((member) => {
                const label = member.email || `User #${member.user_id}`;
                const active = String(member.user_id) === String(selectedId);
                return (
                  <li key={member.user_id}>
                    <button
                      type="button"
                      className={`list-button${active ? " selected" : ""}`}
                      onClick={() => handleSelect(member)}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="column">
          <h2>Roles</h2>
          {permissionError && <div className="error">{permissionError}</div>}
          {!selectedMember && !loading && (
            <div className="muted">Select a member to view their role.</div>
          )}
          {selectedMember && (
            <div className="role-panel">
              <label className="field">
                <span>Role</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              {saveError && <div className="error">{saveError}</div>}
              <button
                type="button"
                className="primary"
                onClick={handleSave}
                disabled={saving || actionsDisabled}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
          <div className="role-panel">
            <div className="muted">Add member</div>
            <form className="form" onSubmit={handleAddMember}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={actionsDisabled}
                  required
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={actionsDisabled}
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              {addError && <div className="error">{addError}</div>}
              <button
                type="submit"
                className="primary"
                disabled={adding || actionsDisabled}
              >
                {adding ? "Adding..." : "Add member"}
              </button>
            </form>
          </div>
        </div>
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
