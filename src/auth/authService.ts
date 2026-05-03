// ============================================================
// authService.ts
// 支援兩種登入模式：
//   Flow A（有後端）：redirect → backend JWT
//   One Tap（無後端）：GIS → Google id_token
// ============================================================

import axios from "axios";

const BACKEND_BASE     = import.meta.env.VITE_API_BASE ?? "";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? "auth_token";

// 後端 service call 時使用
export const API_BASE = import.meta.env.DEV ? "" : BACKEND_BASE;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export const AuthService = {

  // ── Flow A：Redirect（有後端）────────────────────────────

  /** 跳後端，由後端主導整個 OAuth flow */
  loginServerSide(): void {
    window.location.href = `${BACKEND_BASE}/api/auth/google/login`;
  },

  // ── One Tap：GIS（無後端）───────────────────────────────

  /** 初始化 GIS，拿到 id_token 後呼叫 onCredential */
  initGIS(onCredential: (idToken: string) => void): void {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
      cancel_on_tap_outside: false,
    });
  },

  /** 顯示 One Tap 浮動選帳號框 */
  promptOneTap(): void {
    window.google.accounts.id.prompt();
  },

  // ── Token 管理 ───────────────────────────────────────────

  /**
   * 解析 JWT payload，同時支援兩種格式：
   *   - Google id_token：sub / name / email / picture
   *   - .NET backend JWT：ClaimTypes 長 URI
   */
  decodeToken(token: string): AuthUser {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(base64));
    if (p.exp * 1000 < Date.now()) throw new Error("Token expired");

    const NET_SUB   = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    const NET_EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
    const NET_NAME  = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

    return {
      id:     p.sub     ?? p[NET_SUB]   ?? "",
      name:   p.name    ?? p[NET_NAME]  ?? "",
      email:  p.email   ?? p[NET_EMAIL] ?? "",
      avatar: p.picture ?? "",
    };
  },

  storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // ── 後端 Service Call 用 ─────────────────────────────────

  /** 驗證 token 並取得使用者資料（後端需運行） */
  async fetchMe(token: string): Promise<AuthUser> {
    const res = await axios.get<AuthUser>(`${API_BASE}/api/auth/google/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
