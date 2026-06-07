// 共用資料層入口。新功能一律從這裡 import。
// 讀取 → useApi；寫入 → apiPost/apiPut/apiPatch/apiDelete。

export { apiClient } from "./client";
export { useApi, type UseApiResult } from "./useApi";
export { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./mutations";
export { ApiError } from "./types";
export type { ApiEnvelope } from "./types";
