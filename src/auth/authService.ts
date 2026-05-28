// ============================================================
// authService.ts
// 支援兩種登入模式：
//   Flow A（有後端）：redirect → backend 設 HttpOnly cookie
//   One Tap（有後端）：GIS id_token → POST /exchange-token → backend 設 HttpOnly cookie
// token 存在 HttpOnly cookie，JS 無法讀取，登入狀態透過 /me 確認
// ============================================================

import axios from "axios";

const BACKEND_BASE     = import.meta.env.VITE_API_BASE ?? "";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export const API_BASE = import.meta.env.DEV ? "" : BACKEND_BASE;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

const authAxios = axios.create({
  withCredentials: true,
});

export const AuthService = {

  // ── Flow A：Redirect（後端主導）──────────────────────────

  /** 跳後端，由後端主導整個 OAuth flow，完成後後端設 HttpOnly cookie */
  loginServerSide(): void {
    window.location.href = `${BACKEND_BASE}/api/auth/google/login`;
  },

  // ── One Tap：GIS ─────────────────────────────────────────

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

  // ── 後端 Service Call ────────────────────────────────────

  /** One Tap 拿到的 Google id_token → 後端驗證並設 HttpOnly cookie */
  async exchangeIdToken(idToken: string): Promise<void> {
    await authAxios.post(`${BACKEND_BASE}/api/auth/google/exchange-token`, { idToken });
  },

  /** 取得目前登入者資料，同時用來確認 cookie 是否有效 */
  async fetchMe(): Promise<AuthUser> {
    const res = await authAxios.get<AuthUser>(`${API_BASE}/api/auth/google/me`);
    return res.data;
  },

  /** 登出：清除 HttpOnly cookie（後端清） */
  async logout(): Promise<void> {
    await authAxios.post(`${BACKEND_BASE}/api/auth/google/logout`).catch(() => {});
  },
};
