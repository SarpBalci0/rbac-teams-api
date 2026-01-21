import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="header">
        <h1>RBAC Teams</h1>
        <div className="user-info">
          <span>{user?.email ?? ""}</span>
          <button type="button" className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
