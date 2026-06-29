# MyDevWeb Frontend（RuleViewer）

<system_context>
React 19 + TypeScript strict 前端。RuleViewer / Notes / SQL 工具 + Google OAuth。
通用 React+TS 規範與「找元件/icon/template」對照表在本機規範庫：
`c:\Users\zxcbi\Desktop\Projects\LLMDevFramework\React & Typescript\`（`CLAUDE.md` + `frontend-resources.md`）。
本檔只放本專案專屬決策；與規範庫衝突時以本檔為準。
</system_context>

<tech_stack>
- React 19 + TypeScript（strict）+ Vite 7
- **Tailwind 4**（CSS-first `@theme`，見 `src/index.css`）+ `cn()`（`src/utils/clsx.tsx`）
- **antd 6**：重量級 widget（Table / Form / DatePicker / Modal / Upload）
- **axios + SWR**：資料層（讀 SWR、寫 axios）
- react-icons（已裝）；**新 icon 一律 lucide-react**（functional UI icon）
- react-router-dom 7（route-level lazy，見 `src/App.tsx`）
- 主 app（`src/`）design token：圓角 `src/lib/radius.ts`、間距 `src/lib/spacing.ts`（皆為靜態 Tailwind class 字串，`src/index.css` `@theme` 放 CSS var）
- `design-tokens/`（root）：**僅** `apps/blog` / `apps/devconsole` 子 app 用，**主 app 不 import**（勿混用）
</tech_stack>

<paved_stack>
照規範庫 `<paved_stack>`，本專案落地細節：

**Styling** — Tailwind + `cn()` 為主；antd 元件用其 props/theme 調，少數覆寫才用 className。圓角用 `--radius-btn/card/panel`（`src/index.css` ↔ `src/lib/radius.ts`），NEVER hard-code 色票。

**Spacing（間距三鐵則，見 `src/lib/spacing.ts`）**

- NEVER 在子元件寫 `mb-*`/`mt-*` 把自己往外推 — ALWAYS 由父層 flex/grid 的 `gap` 給間距 — Why: 間距寫子層 = N 個分散決定、換 grid 就壞、最後一個多一截；寫父層一處管全部
- NEVER half-step（`gap-1.5`/`py-0.5`）或 inline `style={{ padding }}` 硬 px — ALWAYS 走 4px grid 整數階
- 三層級節奏（越外層越大）：`tight`(8) `<` `default`(16) `<` `loose`(24/32)，用 `GAP`/`PAD` 常數或 layout primitive
- 排版優先用 `src/components/layout` 的 `<Stack>`/`<Row>`/`<Grid>`（已內建父層 gap），個別元件少直接寫 spacing class
- antd 間距/圓角的單一控制點在 `src/App.tsx` 的 `ConfigProvider`，NEVER 各元件 inline 蓋 antd 間距

**Components（Hybrid）** — 重量級 widget 用 antd；layout/卡片/按鈕/自訂視覺用 Tailwind。要炫砲/動效從 `frontend-resources.md` 的 shadcn/HyperUI/Aceternity **貼進來改寫成 Tailwind**，不新增 runtime dep。

**Data layer** — 統一走 `src/lib/api/`（見該目錄 README）：
- 讀取 → `useApi<T>(url)`（SWR + 自動拆 `{ data, success, message, code }` 信封）
- 寫入 → `apiPost/apiPut/apiPatch/apiDelete`（unwrap + `success:false` 丟錯）
- 非抓取 async（解析/計算）→ `src/hooks/useAsync.ts`
- NEVER 在 component 自己 `axios.create()` —— 用 `src/lib/api/client`
- 既有 `components/RTDRuleViewer/api.ts`、`auth/authService.ts` 各自有 client，屬**待收斂**；新功能一律用 `src/lib/api/`，舊的逐步遷移（見 README 遷移段）

**Icons** — functional icon 用 lucide-react；品牌 logo 才用 react-icons。
</paved_stack>

<critical_notes>
- MUST 開新功能前讀規範庫 `React & Typescript/CLAUDE.md` 的 `<critical_notes>`（strict TS、no `any`、no class component、Zod boundary…）
- MUST API response 在 boundary 用 Zod 驗證（目前多數 endpoint 尚未補，新 endpoint 一定加）
- NEVER 把 secret 寫進前端；只用 `VITE_` 開頭且為 public 值
- NEVER 改 design-tokens 只改一邊（`tokens.css` 與 `tokens.ts` 必須同步）
</critical_notes>

<file_map>
src/lib/api/        - 共用 axios client + useApi 信封 hook + 寫入 helper（新功能入口）
src/lib/            - 純函式（radius.ts…）
src/utils/clsx.tsx  - `cn()` className 合併（唯一入口）
src/components/      - 共用元件（RTDRuleViewer、SQLVisualizer…）
src/pages/          - 路由頁面（lazy load）
src/auth/           - Google OAuth + ProtectedRoute（HttpOnly cookie）
src/hooks/          - 共用 hooks（useAsync…）
design-tokens/      - 跨 app design tokens
docs/               - React_TypeScript_Guide.md（語法 cheat-sheet）
.claude/skills/     - web-design-guidelines / vercel-react-best-practices（做 UI 前看）
</file_map>

<build>
```powershell
npm run dev      # localhost:5173（vite proxy /api → :8082）
npm run build    # tsc -b + vite build，輸出 dist/
npm run lint     # ESLint
```
</build>

<env>
- `VITE_API_BASE`：後端 API base（dev: http://localhost:8082）
- `VITE_GOOGLE_CLIENT_ID`：Google OAuth client id
- `VITE_CID` / `VITE_APP_ENV` / `VITE_SHOW_PRIVATE`：業務旗標
</env>

<naming>
照規範庫：camelCase 變數/函式、PascalCase component/type（interface 不加 `I`）、
UPPER_SNAKE_CASE constant、boolean 加 `is/has/can`。詳見規範庫 `React & Typescript/CLAUDE.md`。
</naming>

<ci_cd>
- push to main → lint + build（GitHub Actions ci.yml）
- push tag `V.*` → build image + push Docker Hub + 更新 Deployment repo（release.yml）
- Image：`zxcbig7/mydevweb-frontend:<tag>`
</ci_cd>

<hatch>
- 已知技術債：clsx 未列入 package.json deps（靠 hoist），建議 `npm install clsx` 補成顯式
- RTDRuleViewer / auth 的 axios client 待收斂到 `src/lib/api/`，不阻擋現有功能
</hatch>
