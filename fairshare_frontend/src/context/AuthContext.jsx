import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("fairshare_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("fairshare_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    if (nextToken) {
      localStorage.setItem("fairshare_token", nextToken);
      localStorage.setItem("fairshare_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("fairshare_token");
      localStorage.removeItem("fairshare_user");
    }
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login({ email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await api.register({ name, email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(() => persist(null, null), [persist]);

  const value = useMemo(
    () => ({ token, user, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
