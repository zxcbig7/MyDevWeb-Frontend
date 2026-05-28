// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態
// login() → redirect flow（後端主導，後端設 HttpOnly cookie）
// loginWithCookie() → One Tap 或 redirect callback 完成後呼叫 /me 確認身份
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService, type AuthUser } from "./authService";

export type { AuthUser };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  loginWithCookie: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

const DEV_USER: AuthUser = {
  id: "dev-local",
  name: "Dev User",
  email: "dev@local",
  avatar: "",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEV_BYPASS ? DEV_USER : null);
  const [loading, setLoading] = useState(!DEV_BYPASS);

  useEffect(() => {
    if (DEV_BYPASS) return;
    AuthService.fetchMe()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function login() { AuthService.loginServerSide(); }

  async function logout(): Promise<void> {
    await AuthService.logout();
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
  }

  /** cookie 已由後端設好，呼叫 /me 取得使用者資料 */
  async function loginWithCookie(): Promise<void> {
    const me = await AuthService.fetchMe();
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithCookie }}>
      {children}
    </AuthContext.Provider>
  );
}
