// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態：/auth/me 判斷登入、login / logout 跳轉後端
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";


// 定義 AuthUser 類型，包含 id、name 和 email 三個屬性，分別表示用戶的唯一標識、名稱和電子郵件地址。
export type AuthUser = { id: string; name: string; email: string };

const MOCK_USER: AuthUser = { id: "dev", name: "開發者", email: "dev@local" };


// 定義 AuthState 類型，包含 user、loading、login 和 logout 四個屬性，分別表示當前用戶信息、加載狀態、登入方法和登出方法。
type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

// 創建一個 AuthContext，使用 React 的 createContext 函數，初始值為 null，表示尚未獲取到用戶信息。
// createContext 函數用途: 用於創建一個 Context 對象，這個對象可以在組件樹中傳遞數據，而不需要通過 props 層層傳遞。
// Context 主要用於全局狀態管理，例如用戶認證、主題設置等。
// 在這裡創建了一個 AuthContext，用於管理和提供認證相關的狀態和方法。
const AuthContext = createContext<AuthState | null>(null);

const API_BASE      = import.meta.env.VITE_API_BASE      ?? "";
const AUTH_BASE     = import.meta.env.VITE_AUTH_BASE     ?? API_BASE;
const IS_DEV        = import.meta.env.VITE_APP_ENV === "DEV";
const DISABLE_AUTH  = import.meta.env.VITE_DISABLE_AUTH  !== "false";

// 定義 AuthProvider 組件，接受 children 作為子組件，並在內部管理 Auth 狀態。
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEV || DISABLE_AUTH) {
      setUser(MOCK_USER);
      setLoading(true);
      return;
    }

    axios.get<AuthUser>(`${API_BASE}/auth/me`, { withCredentials: true })
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

// 自訂 Hook，方便在其他組件中使用 Auth 狀態和方法
export function useAuth(): AuthState {
  // 從 AuthContext 中獲取當前的 Auth 狀態，如果尚未在 AuthProvider 中使用，則拋出錯誤提示。
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
