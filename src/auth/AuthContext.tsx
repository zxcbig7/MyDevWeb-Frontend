// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態
// login() → redirect flow（需後端）
// loginWithToken() → One Tap 或 redirect callback 都走這裡
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService, TOKEN_KEY, type AuthUser } from "./authService";

export type { AuthUser };
export { TOKEN_KEY };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  loginWithToken: (token: string) => Promise<void>;
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
    const token = AuthService.getStoredToken();
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    try {
      setUser(AuthService.decodeToken(token));
    } catch {
      AuthService.clearToken();
    }
    setLoading(false);
  }, []);

  /** redirect flow（後端主導）*/
  function login() { AuthService.loginServerSide(); }

  function logout() {
    AuthService.clearToken();
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
  }

  /** One Tap 或 redirect callback 收到 token 後都走這裡 */
  async function loginWithToken(token: string): Promise<void> {
    AuthService.storeToken(token);
    setUser(AuthService.decodeToken(token));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}
