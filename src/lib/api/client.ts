// ============================================================
// 共用 axios 實例
// baseURL / withCredentials / timeout / 通用 header 單點維護。
// NEVER 在 component 各自 axios.create()，一律 import 這支。
// ============================================================

import axios, { type AxiosInstance } from "axios";

// dev 預設打 VITE_API_BASE（http://localhost:8082）。
// 若改走 vite proxy（vite.config.ts 的 /api → :8082），把 dev 的 VITE_API_BASE 設為空字串即可。
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "",
  timeout: 10_000,
  withCredentials: true, // 帶 HttpOnly cookie（SSO / session）
  headers: {
    Cid: import.meta.env.VITE_CID,
  },
});

export { apiClient };
