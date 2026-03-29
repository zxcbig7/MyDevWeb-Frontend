// ============================================================
// api.ts
// DEV  → Mock + 真實 API 合併（API 失敗時 fallback mock）
// STAGE / PROD → 打真實 API
// ============================================================

import axios from "axios";
import useSWR from "swr";
import type * as RTDDTO from "./types";

// ── Axios Client ─────────────────────────────────────────────
// 統一 baseURL / timeout / 通用 headers
// withCredentials: true → 跨域請求時自動帶上 Cookie（SSO / session）
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000,
  withCredentials: true,
  headers: {
    Cid: import.meta.env.VITE_CID,
    Account: "ruleviewer-frontend",
  },
});

async function fetcher<T>(url: string): Promise<T> {
  const res = await client.get<T>(url);
  return res.data;
}

// ── API 回應信封 ──────────────────────────────────────────────
// 標籤必須要跟後端一樣(會看大小寫)
interface APIResponse<T> {
  data: T[];
  success: boolean;
  message: string;
  code: number;
}

// ── 通用 SWR Hook ─────────────────────────────────────────────
// 給定 DTO 型別 T，自動拆信封回傳 T[]；
// url 為 null 時不打 API: 處理input資料有漏問題

function useAPI<T>(url: string | null) {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<APIResponse<T>, Error>(url, (u) => fetcher<APIResponse<T>>(u), { revalidateOnFocus: false });

    console.info(data);
  return { data: data?.data ?? null, error: error ?? null, isLoading, isValidating, mutate };
}

/** 取得所有 Phase 清單 */
export const usePhaseResponse = () =>
  useAPI<RTDDTO.PhaseDTO>("/api/RuleViewer/phases");

/** 取得指定 Phase 的 EQP-Rule 對照表；phase 為 null 時不打 API */
export const useEQPRuleResponse = (phase: string | null) =>
  useAPI<RTDDTO.EqpRuleListDTO>(
    phase ? `/api/RuleViewer/${encodeURIComponent(phase)}/eqprules` : null
  );

/** 取得指定 Phase 的 Rule 清單；phase 為 null 時不打 API */
export const useRuleResponse = (phase: string | null) =>
  useAPI<RTDDTO.RuleListDTO>(
    phase ? `/api/RuleViewer/${encodeURIComponent(phase)}/eqprules` : null
  );

/** 取得指定 Phase + Rule 的詳細資料；phase / ruleName 任一為 null 時不打 API */
export const useRuleInfoResponse = (phase: string | null, ruleName: string | null) =>
  useAPI<RTDDTO.RuleInfoDTO>(
    phase && ruleName
      ? `/api/RuleViewer/${encodeURIComponent(phase)}/${encodeURIComponent(ruleName)}`
      : null
  );