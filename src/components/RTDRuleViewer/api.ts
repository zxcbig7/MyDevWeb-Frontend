// ============================================================
// api.ts
// 資料讀取一律打後端真實 API（DEV / STAGE / PROD 皆同，無 mock fallback）。
// devMock.ts / stressRule.ts 只供 /dev/* 元件測試頁離線使用，不在此資料路徑內。
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

//
async function fetcher<T>(url: string): Promise<T> {
    const res = await client.get<T>(url);
    return res.data;
}

// ── API 回應信封 ──────────────────────────────────────────────
// 所有 API 回傳格式必須符合此信封結構，欄位名稱大小寫需與後端一致
//
// 後端回應範例：
// {
//   "success": true,
//   "code": 200,
//   "message": "OK",
//   "data": [ ...各 endpoint 的資料陣列... ]
// }
//
// ┌─ success ─ boolean  操作是否成功（false 時前端顯示 error toast）
// ├─ code    ─ number   HTTP 狀態碼（200 / 400 / 500 等）
// ├─ message ─ string   錯誤時的說明文字（success=true 時可為 "OK" 或 ""）
// └─ data    ─ T[]      實際資料陣列，無資料時回傳 [] 而非 null
interface APIResponse<T> {
    data: T[];
    success: boolean;
    message: string;
    code: number;
}

// ── 通用 SWR Hook ─────────────────────────────────────────────
// 給定 DTO 型別 T，自動拆信封回傳 T[]；
// url 為 null 時不打 API: 處理input資料有漏問題
// revalidateOnFocus: false → 切回頁面時不自動重新驗證（不打 API）

function useAPI<T>(url: string | null) {
    const { data, error, isLoading, isValidating, mutate } =
        useSWR<APIResponse<T>, Error>(url, (u) => fetcher<APIResponse<T>>(u), { revalidateOnFocus: false });
    return { data: data?.data ?? null, error: error ?? null, isLoading, isValidating, mutate };
}

/**
 * 取得所有 Phase 清單；fab 為 null 時不打 API
 *
 * GET /api/{fab}/RuleViewer/phases
 *
 * data: [
 *   { "PHASE": "APF" },
 * ]
 */
export const usePhaseResponse = (fab: string | null) =>
    useAPI<RTDDTO.PhaseDTO>(
        fab ? `/api/${encodeURIComponent(fab)}/RuleViewer/phases` : null
    );

/**
 * 取得指定 Phase 的 EQP-Rule 對照表；fab / phase 任一為 null 時不打 API
 *
 * GET /api/{fab}/RuleViewer/{phase}/eqprules
 *
 * data: [
 *   { "PHASE": "APF", "EQP_ID": "APF01", "RULE_NAME": "RULE_A" },
 *   ...
 * ]
 * 同一台 EQP 可對應多條 Rule，同一條 Rule 也可被多台 EQP 使用
 */
export const useEQPRuleResponse = (fab: string | null, phase: string | null) =>
    useAPI<RTDDTO.EqpRuleListDTO>(
        fab && phase ? `/api/${encodeURIComponent(fab)}/RuleViewer/${encodeURIComponent(phase)}/eqprules` : null
    );

/**
 * 取得指定 Phase 的 Rule 清單；fab / phase 任一為 null 時不打 API
 *
 * GET /api/{fab}/RuleViewer/{phase}/rules
 *
 * data: [
 *   { "RULE_NAME": "RULE_A" },
 *   ...
 * ]
 */
export const useRuleResponse = (fab: string | null, phase: string | null) =>
    useAPI<RTDDTO.RuleListDTO>(
        fab && phase ? `/api/${encodeURIComponent(fab)}/RuleViewer/${encodeURIComponent(phase)}/rules` : null
    );

/**
 * 取得指定 Phase + Rule 的詳細資料（所有 Block 展開成多列）；fab / phase / ruleName 任一為 null 時不打 API
 *
 * GET /api/{fab}/RuleViewer/{phase}/{ruleName}
 *
 * 一個 Block 的多筆條件會展開成多列（同 BLOCK_NAME，不同 VALUE1~5）：
 * data: [
 *   {
 *     "PHASE":       "APF",
 *     "RULE_NAME":   "RULE_A",
 *     "BLOCK_NAME":  "Filter1",       // 同一個 Block 若有多個條件，同名出現多列
 *     "BLOCK_TYPE":  "Filter",        // 對應 /public/RTDIcons 的圖片名稱
 *     "BLOCK_GROUP": "G1",
 *     "BLOCK_SEQ":   "1",
 *     "KEY":         "OUTPUT_VAR",    // Function：輸出變數名；Database：表別名；Index：index 名；可為 null
 *     "POSX":        100,             // Canvas 畫布 X 座標（px）
 *     "POSY":        200,             // Canvas 畫布 Y 座標（px）
 *     "PREBLOCK":    "DataSource1",   // 前置 Block 名稱，多個用逗號分隔（最多取前 2 個）；可為 null
 *     "COLUMN1":     "COL_LIST",      // Database：欄位清單；Index：主線 join key；Function：null
 *     "COLUMN2":     "SOURCE_COL",    // Index：副線 join key；Function：null
 *     "VALUE":       "IF $LOG$ THEN", // 條件表達式（後端已將 VALUE1~5 合併）；可為 null
 *     "CLAIM_TIME":  null             // 最後更新時間；可為 null
 *   },
 *   ...
 * ]
 */
export const useRuleInfoResponse = (fab: string | null, phase: string | null, ruleName: string | null) =>
    useAPI<RTDDTO.RuleInfoDTO>(
        fab && phase && ruleName
            ? `/api/${encodeURIComponent(fab)}/RuleViewer/${encodeURIComponent(phase)}/${encodeURIComponent(ruleName)}`
            : null
    );


export const useResourceDataResponse = (fab: string | null, imfileName: string | null) =>
    useAPI<RTDDTO.RuleInfoDTO>(
        fab && imfileName ? `/api/${encodeURIComponent(fab)}/RuleViewer/IMFILE/${encodeURIComponent(imfileName)}`
            : null
    );

// 單一物件信封（import endpoint 回傳非陣列）
interface SingleAPIResponse<T> {
    data: T;
    success: boolean;
    message: string;
    code: number;
}

// 取得指定 Import Table 的資料；fab / tableName 任一為 null 時不打 API
export const useImportTableResponse = (fab: string | null, tableName: string | null) => {
    const { data, error, isLoading } = useSWR<SingleAPIResponse<RTDDTO.ImportTableDTO>>(
        fab && tableName ? `/api/${encodeURIComponent(fab)}/RuleViewer/ImportFile/${encodeURIComponent(tableName)}` : null,
        (u) => fetcher<SingleAPIResponse<RTDDTO.ImportTableDTO>>(u),
        { revalidateOnFocus: false }
    );
    return { data: data?.data ?? null, error: error ?? null, isLoading };
};