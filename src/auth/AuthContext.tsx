// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態：/auth/me 判斷登入、login / logout 跳轉後端
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

export type AuthUser = { id: string; name: string; email: string };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const API_BASE      = import.meta.env.VITE_API_BASE      ?? "";
const AUTH_BASE     = import.meta.env.VITE_AUTH_BASE     ?? API_BASE;
const IS_DEV        = import.meta.env.VITE_APP_ENV === "DEV";
const DISABLE_AUTH  = import.meta.env.VITE_DISABLE_AUTH  === "true";

const MOCK_USER: AuthUser = { id: "dev", name: "開發者", email: "dev@local" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEV || DISABLE_AUTH) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }
    axios
      .get<AuthUser>(`${API_BASE}/auth/me`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function login()  { window.location.href = `${AUTH_BASE}/auth/login`;  }
  function logout() { window.location.href = `${AUTH_BASE}/auth/logout`; }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
