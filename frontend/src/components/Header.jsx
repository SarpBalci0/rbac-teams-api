import { useAuth } from "../auth/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <h1>RBAC Teams</h1>
      <div className="user-meta">
        <span>{user?.email}</span>
        <button className="secondary" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
