// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態：/auth/me 判斷登入、login / logout 跳轉後端
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

export type AuthUser = { id: string; name: string; email: string };

const MOCK_USER: AuthUser = { id: "dev", name: "開發者", email: "dev@local" };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

// createContext：建立一個可跨元件樹傳遞的全域容器，不需要逐層透過 props 傳遞
// 在 useAuth() 中偵測到 null 就能報錯，提醒開發者忘記包 <AuthProvider>
const AuthContext = createContext<AuthState | null>(null);

// import.meta.env：Vite 提供的環境變數入口（對應 .env.* 檔案）
// ?? ""（Nullish Coalescing）：只有在左側是 null / undefined 時才取右側預設值
//   與 || 的差異：|| 會把 "" / 0 / false 也視為假值而取右側，?? 不會
const API_BASE     = import.meta.env.VITE_API_BASE     ?? "";
const AUTH_BASE    = import.meta.env.VITE_AUTH_BASE    ?? API_BASE;
const IS_DEV       = import.meta.env.VITE_APP_ENV === "DEV";

// DISABLE_AUTH 的判斷邏輯（雙重否定）：
// 沒設或任何其他值都視為停用，方便本機開發時不用特別設定
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH !== "false";

// Google OAuth 登入端點
// 後端會處理 redirect_uri 與 token 交換，前端只需跳轉
const GOOGLE_AUTH_URL = `${AUTH_BASE}/api/auth/google`;

// AuthProvider：將 Auth 狀態注入整棵元件樹
// 用 <AuthContext.Provider value={...}> 包住 children，
// 讓所有子元件都能透過 useAuth() 拿到 user / loading / login / logout
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  // loading 初始為 true：在驗證結果回來前，避免畫面閃爍（先顯示「載入中」）
  const [loading, setLoading] = useState(true);

  // 初始化 API call
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

  function login()  { window.location.href = GOOGLE_AUTH_URL; }
  function logout() { window.location.href = `${AUTH_BASE}/auth/logout`; }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth：封裝 useContext，讓呼叫方不需要直接接觸 AuthContext
// 為何在這裡 throw 而不是回傳 null？
//   如果回傳 null，每個使用端都要自己做 null check，容易遺漏
//   在這裡統一拋錯，能在開發階段第一時間定位問題（忘記包 <AuthProvider>）
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}
