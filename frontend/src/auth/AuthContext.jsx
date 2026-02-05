import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);

  const login = (accessToken) => {
    localStorage.setItem("authToken", accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      return () => {
        active = false;
      };
    }

    const loadUser = async () => {
      try {
        const data = await apiRequest("/auth/me", { token });
        if (active) {
          setUser(data || null);
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401) {
          localStorage.removeItem("authToken");
          setToken(null);
        }
        setUser(null);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      userEmail: user?.email || null,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
