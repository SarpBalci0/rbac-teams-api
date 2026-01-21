import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, request } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await request("/api/v1/auth/me", { auth: true });
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email, password) => {
    const response = await request("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    localStorage.setItem("token", response.access_token);
    setToken(response.access_token);
    await fetchMe();
  }, [fetchMe]);

  const register = useCallback(async (email, password) => {
    await request("/api/v1/auth/register", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await login(email, password);
  }, [login]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    login,
    register,
    logout,
  }), [token, user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
