import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { request } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const loadUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const me = await request("/api/v1/auth/me");
      setUser(me);
    } catch (err) {
      if (err.message === "Unauthorized") {
        logout();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    const response = await request("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    localStorage.setItem("authToken", response.access_token);
    setToken(response.access_token);
    await loadUser();
  };

  const register = async (email, password) => {
    setError(null);
    await request("/api/v1/auth/register", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await login(email, password);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError: () => setError(null),
    }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
