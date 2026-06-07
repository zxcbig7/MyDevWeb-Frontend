# src/lib/api — 共用資料層

全專案 HTTP / 資料抓取的單一入口。新功能一律從這裡 import。

## 為什麼

之前 `components/RTDRuleViewer/api.ts` 與 `auth/authService.ts` 各自 `axios.create()`，
baseURL / withCredentials / 信封拆解邏輯重複且不一致。這支把它收斂成單點維護。

## 用法

### 讀取（server state）→ `useApi`

SWR + 自動拆 `{ data, success, message, code }` 信封。`url` 傳 `null` 時不打 API。

```ts
import { useApi } from "../../lib/api";
import type { PhaseDTO } from "./types";

// 列表：泛型給陣列
const { data, error, isLoading } = useApi<PhaseDTO[]>("/api/RuleViewer/phases");

// 依賴前一個值：尚未選 phase 時傳 null，SWR 自動不打
const { data: rules } = useApi<RuleDTO[]>(
  phase ? `/api/RuleViewer/${encodeURIComponent(phase)}/rules` : null,
);
```

### 寫入（POST / PUT / PATCH / DELETE）→ mutation helper

自動拆信封；`success:false` 丟 `ApiError`（帶 `code`）。

```ts
import { apiPost, ApiError } from "../../lib/api";

try {
  const created = await apiPost<RuleDTO, CreateRuleBody>("/api/RuleViewer/rules", body);
} catch (e) {
  if (e instanceof ApiError && e.code === 409) { /* 重複 */ }
  throw e;
}
```

### 非抓取 async（解析 / 計算）→ `src/hooks/useAsync.ts`

不是打 API 的非同步流程（檔案解析、Web Worker…）用 `useAsync`，不要硬塞進這層。

## ✅ / ❌

```ts
// ✅ 讀取用 useApi，元件只拿 data
const { data } = useApi<RuleDTO[]>(url);

// ❌ 別在元件裡自己 new client / 自己拆信封
const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE }); // 重複設定
const res = await client.get(url); const rows = res.data.data;          // 各自拆，易不一致
```

## Zod boundary（建議）

信封結構穩定，但 `data` 內容來自後端，屬 system boundary。新 endpoint 應在拿到 `data`
後用 Zod parse 一次再進 UI（框架規範要求，見規範庫 `React & Typescript/CLAUDE.md`）。

## 遷移既有 code（不急，逐步）

- `components/RTDRuleViewer/api.ts`：把 `useAPI<T>` 換成本層 `useApi<T[]>`，刪掉檔內 `client` / `fetcher`。
  注意 RTDRuleViewer 額外帶了 `Account` header → 需要時用 `apiClient` 的 per-call config 傳。
- `auth/authService.ts`：`authAxios` 可換成 `apiClient`（兩者都 `withCredentials`）。

> 遷移前先確認後端對該 endpoint 的信封格式一致，再逐支替換 + 手測。
