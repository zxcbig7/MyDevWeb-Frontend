// ============================================================
// AuthContext.tsx
// 全域 Auth 狀態：/auth/me 判斷登入、login / logout 跳轉後端
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

// import.meta.env：Vite 提供的環境變數入口（對應 .env.* 檔案）
// ?? ""（Nullish Coalescing）：只有在左側是 null / undefined 時才取右側預設值
//   與 || 的差異：|| 會把 "" / 0 / false 也視為假值而取右側，?? 不會
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? API_BASE;
const IS_DEV = import.meta.env.VITE_APP_ENV === "DEV";
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? "ruleviewer_token";

// Google OAuth 登入端點（前端主導）
// 前端直接跳 Google，callback 回 /auth/callback?code=xxx，再由前端送後端換 JWT
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;

// Google OAuth URL 組合：根據 Google OAuth 2.0 規範組合登入 URL，包含必要參數
const GOOGLE_AUTH_URL =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=openid%20email%20profile`;

// AuthUser：使用者資料類型，從 /auth/me 拿到的資料結構
export type AuthUser = { id: string; name: string; email: string };

// 測試release用的假資料，讓開發階段不需要真的登入也能看到使用者相關功能
const MOCK_USER: AuthUser = { id: "dev", name: "開發者", email: "dev@local" };

// AuthState：AuthContext 中的狀態結構，包含使用者資料、載入狀態、登入登出方法
type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

// createContext：建立一個可跨 元件樹 傳遞的全域容器，不需要逐層透過 props 傳遞
// 在 useAuth() 中偵測到 null 就能報錯，提醒開發者忘記包 <AuthProvider>
const AuthContext = createContext<AuthState | null>(null);

// useAuth：封裝 useContext，讓呼叫方不需要直接接觸 AuthContext
// 為何在這裡 throw 而不是回傳 null？
//   如果回傳 null，每個使用端都要自己做 null check，容易遺漏
//   在這裡統一拋錯，能在開發階段第一時間定位問題（忘記包 <AuthProvider>）
export function useAuth(): AuthState {
  // useContext：拿到最近的 <AuthContext.Provider> 提供的 value
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}

// AuthProvider：將 Auth 狀態注入整棵元件樹
// 用 <AuthContext.Provider value={...}> 包住 children，
// 讓所有子元件都能透過 useAuth() 拿到 user / loading / login / logout
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // loading 初始為 true：在驗證結果回來前，避免畫面閃爍（先顯示「載入中」）
  const [loading, setLoading] = useState(true);

  // 初始化 API call
  useEffect(() => {

    // 開發階段直接使用假資料，跳過驗證流程
    if (IS_DEV) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // 先從 localStorage 拿 token，沒有就直接結束（未登入狀態）
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    // 嘗試用 token 換使用者資料，驗證 token 是否有效
    axios.get<AuthUser>(`${AUTH_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setUser(res.data)) // 成功拿到使用者資料，更新狀態
      .catch(() => {
        // 驗證失敗（token 無效或過期），清除 token 並重置狀態
        localStorage.removeItem(TOKEN_KEY); // token 無效，清除並重置狀態
        setUser(null); // 確保 user 狀態被重置為 null
      })
      .finally(() => setLoading(false));
  }, []);

  // login / logout 方法：直接跳轉到後端處理，前端不負責 token 管理
  // indow.location.href: 直接跳轉到指定 URL，觸發完整的頁面刷新流程，適合處理 OAuth 這種需要離開當前頁面進行驗證的情況
  function login() {
    console.info("開始登入流程，跳轉到 Google OAuth 頁面", GOOGLE_AUTH_URL);
    window.location.href = GOOGLE_AUTH_URL;
  }
  function logout() {
    console.info("開始登出流程，跳轉到後端登出端點", `${AUTH_BASE}/auth/logout`);
    window.location.href = `${AUTH_BASE}/auth/logout`;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
