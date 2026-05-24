---
title: 把 frontend 拆成「公開部落格站」與「開發 console 站」兩個獨立 app（local-first）
status: approved
created: 2026-05-12
updated: 2026-05-12
modules: [frontend]
---

# Frontend Split：Public Blog + Dev Console（local-first 階段）

## Summary

把目前單一 SPA `MyDevWebFrontend/` 拆成兩個獨立的 app：**公開部落格站**（給一般訪客看 Homepage / About / Notes）與**開發 console 站**（自己用的 RTD RuleViewer、SQLVisualizer、Sudoku、Tailwind cheatsheet 等開發工具）。**本 spec 範圍只到 local 開發環境驗證**——兩個 app 各自 `npm run dev`、各自 `npm run build`、bundle 隔離驗證通過。K8s 部署、DNS、CI image push、Helm 變動全部延後到後續 spec。Design tokens（color / spacing / font 變數）抽出共用以維持視覺一致，其餘 code 不共用。

## Motivation / Why

- **隔離 attack surface**：公開站完全不含開發工具與 auth code，普通訪客無從窺探（即使 dev menu 加 `LockOutlined` 鎖頭，bundle 內仍包含完整 dev code 與 source map，理論上可被反編）。
- **bundle 瘦身**：公開站不再背負 SQL Visualizer、RuleViewer、Sudoku、AntD Form 等大型相依，首頁載入速度提升。
- **獨立發版節奏**：開發 console 改動頻繁，部落格穩定；拆開後改 RuleViewer 不用 rebuild 部落格、不用碰 prod 流量。
- **未來擴充**：若部落格之後要 SEO（prerender / Next.js），可獨立改造不影響開發 console。

## Scope

### In Scope（local-first）

- 在現有 `MyDevWebFrontend/` repo 下建立子目錄結構：

  ```text
  MyDevWebFrontend/
  ├── apps/
  │   ├── blog/         # 公開部落格站（獨立 package.json、vite.config）
  │   └── devconsole/   # 開發 console 站（獨立 package.json、vite.config）
  ├── design-tokens/    # 共用 design tokens（CSS variables + TS const）
  └── （legacy：src/ 暫保留為 fallback）
  ```

  > 採用「同 repo 子目錄」而非「兩個獨立 repo」，理由：design tokens 在 root 一份兩邊 import 最乾淨；未來部署階段 CI 可用 path-filter 各自觸發。

- 兩個 app **不共用** components / utils / auth code（各自複製需要的部分）。
- **共用 design tokens**：`design-tokens/tokens.css`（CSS variables）+ `design-tokens/tokens.ts`（TypeScript constants），兩個 app 透過相對路徑 import。
- 兩個 app **各自可 local 啟動**：
  - `cd apps/blog && npm run dev` → `localhost:5173`
  - `cd apps/devconsole && npm run dev` → `localhost:5174`（避免 port 衝突）
- 兩個 app **各自 build 成功**：`npm run build` 各自產出獨立 `dist/`。
- **Bundle 隔離驗證**：公開站 bundle 不含開發工具 code。

### Out of Scope（本 spec 不做，留待後續另開 spec）

- **K8s 部署、Helm chart 變動、ArgoCD application**：等 local 驗證通過後另開 spec 處理。
- **DNS 設定（`dev.viclai.idv.tw`）、Cloudflare Tunnel / Cloudflare Access**：同上。
- **Dockerfile / nginx.conf**：本階段不建（local 開發直接 vite dev server 即可）；保留現有 root 層 Dockerfile 不動。
- **CI/CD workflow 拆分（GitHub Actions、image push、tag 策略）**：等部署 spec 一起處理。
- **SEO / prerender / 改 Next.js**：使用者明確表示不需要流量，這次不做。
- **抽共用 components / utils / auth 成 npm package 或 workspaces**：使用者明確選「不共用 code」，這次只共用 design tokens。
- **後端 API 變動**：後端 `api.viclai.idv.tw` 不動。公開站 v1 不打後端（筆記為 build-time sync 進 dist）。
- **legacy `src/` 立即刪除**：先保留作 fallback，等部署上線、prod 穩定後另開 PR 刪除。

## User Stories / Use Cases

1. As a **站主（local 驗證階段）**，I want to 在本機跑 `cd apps/blog && npm run dev` 開到 `localhost:5173` 看到精簡版公開站（首頁 / About / Notes、無 auth 無 dev menu），so that 我能驗證拆分後的公開站功能正確。
2. As a **站主（local 驗證階段）**，I want to 在本機跑 `cd apps/devconsole && npm run dev` 開到 `localhost:5174` 看到完整開發 console（含所有 dev 工具與 auth），so that 我能驗證拆分後開發功能無遺漏。
3. As a **站主**，I want to 改一處 `design-tokens/tokens.css` 的變數（例如主色），so that 兩個 app 視覺自動同步。
4. **（未來部署階段）** As a **一般訪客**，I want to 開啟 `viclai.idv.tw` 看到公開站，而**完全看不到也載不到**開發工具相關 code。← 此 story 對應的部署工作屬後續 spec。

## Acceptance Criteria

- [ ] `apps/blog/` 可獨立 `npm install && npm run dev`，於 `localhost:5173` 顯示公開站（首頁 / About / Notes），畫面正常無 console error。
- [ ] `apps/devconsole/` 可獨立 `npm install && npm run dev`，於 `localhost:5174` 顯示完整開發 console（所有現有功能），畫面正常無 console error。
- [ ] `apps/blog/` 可獨立 `npm run build`，產出 `apps/blog/dist/`，type-check 過。
- [ ] `apps/devconsole/` 可獨立 `npm run build`，產出 `apps/devconsole/dist/`，type-check 過。
- [ ] `apps/blog/dist/` 用 bundle analyzer（`vite-bundle-visualizer` 或 `rollup-plugin-visualizer`）檢查，**不含任何 `Dev/`、`tools/`、`auth/`、`RuleViewer`、`SQLVisualizer`、`Sudoku` 相關 chunk**。
- [ ] 改 `design-tokens/tokens.css` 的 `--color-primary` 變數，兩個 app 重啟 dev server 後主色都會同步改變。
- [ ] 兩個 app 從同一個 `MyDevWebFrontend/` 啟動互不影響（不共用 `node_modules`、不互踩 `dist/`、port 不衝突）。
- [ ] legacy `MyDevWebFrontend/src/` 暫保留不動，仍可用現有 root `npm run dev` 啟動（驗證拆分過程沒破壞舊版）。

## Module Interactions

- **Frontend (apps/blog)**
  - Routes：`/`、`/homepage`、`/about`、`/notes`、`/notes/graph`、`/notes/*`、`*`(404)
  - 移除：`auth/`、`Dev/`、`tools/`、`components/RTDRuleViewer/`、`components/SQLVisualizer/`、`components/Sudoku/`、`ProtectedRoute`
  - 移除 `HomeLayout` 中的 `useAuth` / 登入登出按鈕 / `VITE_SHOW_PRIVATE` 開關 / 私人選單分組
  - 保留：`pages/home/`、`pages/Notes/`、`pages/ErrorPage`、`pages/layout/HomeLayout`（精簡版）
- **Frontend (apps/devconsole)**
  - Routes：所有現有路由（包含 `/login`、`/auth/callback`、`/ruleviewer`、`/dev/*`、`/sql-visualizer`、`/sudoku`、`/tailwind`、`/homepage`、`/about`、`/notes`）
  - 是否保留 Notes / Homepage / About？預設**保留**（你自己也會用）；如要省 bundle 也可移除，列為 Open Question。
- **Design Tokens (design-tokens/)**
  - 兩個 app 透過 `import "../../design-tokens/tokens.css"` 引入 CSS 變數
  - TS 端透過 `import { colors, spacing } from "../../design-tokens/tokens"` 取常數（給 inline style 用，例如 AntD theme provider）
- **Infra**：本 spec **不動** infra。未來部署 spec 會處理 DNS / Cloudflare / K8s / Helm / ArgoCD。

## API Design

本 spec **不新增 API**。

- 公開站（blog）v1 不打後端 API。筆記內容透過現有 `scripts/sync-notes.mjs` 在 build-time 從 `Notes/` 同步成靜態檔，內嵌進 `apps/blog/dist/`。
- 開發站（devconsole）維持現有 API 設定：
  - `VITE_API_BASE=https://api.viclai.idv.tw`
  - `VITE_AUTH_BASE=https://api.viclai.idv.tw`
  - `VITE_GOOGLE_CLIENT_ID=<from K8s secret>`

## Data Model

無 DB 變動。

## Edge Cases & Error Handling

- **訪客在公開站誤打開發路徑**（例如直接輸入 `localhost:5173/ruleviewer`）：公開站 router 完全沒這條路由，由 `*` catch-all 路由顯示 `ErrorPage 404`。**不** redirect 到 dev 站。
- **devconsole bundle 過大導致首次載入慢**：使用者自己用 + 已有 lazy loading + manualChunks，可接受；不額外處理。
- **design tokens 兩邊不同步**：靠 build-time import 保證——若有任何一邊 import 失敗會 build error 擋住。
- **legacy `MyDevWebFrontend/src/` 與兩個 app 同時存在期間的混淆**：在 `MyDevWebFrontend/README.md` 加註「此 src/ 為 v1 legacy，新功能請寫在 apps/{blog,devconsole}/」。
- **port 衝突**：blog 用 `5173`、devconsole 用 `5174`，明確分開避免同時 dev 撞 port。
- **共用 `node_modules` 風險**：每個 app 各自 `package.json` + 各自 `node_modules`，不用 npm workspaces，避免一個 app 升級套件影響另一個。

## Non-Functional Requirements

- **Performance**：公開站 initial bundle 目標 < 200KB gzipped（不含 markdown 渲染相關，因為 lazy load）。靠拆分後天然達成。
- **Security**：
  - 公開站 build 不注入任何 secret（無 Google Client ID、無 API base）。
  - 開發站 local 環境用 `.env.local` 注入（沿用現有 Vite 機制）。
- **Build Time**：兩個 app 各自 `npm install` + `vite build`，目標單一 app build < 60s（小於目前單一 monolith 約 80–90s）。
- **Observability**：local 階段不要求（沿用 vite dev server log）。

## Open Questions

- [ ] **`apps/devconsole/` 要不要保留 Homepage / About / Notes 路由**？保留 = 維持你目前體驗；移除 = devconsole bundle 更小。預設**保留**。
- [ ] **筆記內容（`Notes/`）兩個 app 都要嗎**？目前公開站需要 Notes、devconsole 預設也保留。`scripts/sync-notes.mjs` 要不要也複製兩份（兩個 app 各自 prebuild 跑一次）？預設**兩份各自跑**，避免一改現有 script 影響舊 src/。
- [ ] 部署相關（Cloudflare Access、Git tag 策略、Helm chart、legacy 下線時機）→ **延到部署 spec**，本階段不討論。

## Implementation Plan

### Stub 階段（先做，本次 spec approve 後立即執行）

- [ ] 建立目錄結構：`apps/blog/`、`apps/devconsole/`、`design-tokens/`
- [ ] `design-tokens/`：
  - [ ] `tokens.css`（CSS variables：`--color-primary`、`--color-bg`、`--color-text`、`--font-sans`、`--spacing-*` 等，**先抽幾個代表性的**）
  - [ ] `tokens.ts`（同樣值的 TS export）
  - [ ] `README.md`（說明用法）
- [ ] `apps/blog/`：
  - [ ] `package.json`（先複製現有 `MyDevWebFrontend/package.json` 精簡版：保留 react、react-router-dom、tailwindcss、markdown 渲染相關；移除 antd 開發工具相關、@tanstack/react-table、react-force-graph-2d、axios、swr 等暫不用的）
  - [ ] `vite.config.ts`（沿用現有，**port 改 `5173`**，移除後端 proxy）
  - [ ] `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`
  - [ ] `index.html`、`src/main.tsx`、`src/index.css`（import `../../../design-tokens/tokens.css`）
  - [ ] `src/App.tsx`（**stub**：router + 公開站路由 + `<div>TODO: blog route</div>`）
  - [ ] `src/pages/`、`src/components/`、`src/layout/HomeLayout.tsx`（**stub**：精簡版 layout，無 auth menu，內容 `<div>TODO: layout</div>`）
- [ ] `apps/devconsole/`：
  - [ ] `package.json`（完整相依，與目前 `MyDevWebFrontend/package.json` 一致）
  - [ ] `vite.config.ts`（**port 改 `5174`**，保留後端 proxy）
  - [ ] `tsconfig*.json`、`index.html`、`src/main.tsx`、`src/index.css`（import design-tokens）
  - [ ] `src/App.tsx`（**stub**：完整 router + 所有現有 route，但每條 route 目標 component 暫指 `<div>TODO: devconsole route</div>`）
  - [ ] `src/auth/`、`src/pages/`、`src/components/` 目錄（**stub**：只放 placeholder export）
- [ ] **本機驗證（不部署、不 build image）**：
  - [ ] `cd apps/blog && npm install && npm run dev` → 開 `localhost:5173`，畫面顯示 stub 內容無 error
  - [ ] `cd apps/devconsole && npm install && npm run dev` → 開 `localhost:5174`，畫面顯示 stub 內容無 error
  - [ ] `cd apps/blog && npm run build` 成功產出 dist/
  - [ ] `cd apps/devconsole && npm run build` 成功產出 dist/
  - [ ] 改 `design-tokens/tokens.css` 的某個變數，兩個 app dev server 都看得到變化
- [ ] **legacy 不動**：`MyDevWebFrontend/src/`、root `Dockerfile`、`nginx.conf`、`package.json`、現有 CI workflows **完全不動**，繼續可用 root `npm run dev` 啟動舊版。

### 逐層實作（stub 完成後，逐項展開填肉）

- [ ] **Design Tokens 確定**：盤點目前 `index.css` / inline style 用到的 color / spacing / font，抽 8–12 個核心 token
- [ ] **apps/blog 內容遷移**：
  - [ ] 從現有 `src/` 複製 `pages/home/`、`pages/Notes/`、`pages/ErrorPage` 到 `apps/blog/src/pages/`
  - [ ] 複製必要的 `components/`（**只複製 Notes 渲染需要的**：markdown 相關、graph）
  - [ ] 改寫 `HomeLayout`：移除 auth menu、移除 `IS_PRIVATE` 開關、移除 dev 選單分組
  - [ ] 改寫 `App.tsx`：移除 `AuthProvider` / `ProtectedRoute` / 所有 dev route
  - [ ] 套 design tokens（替換 hard-code 顏色）
  - [ ] 複製 `scripts/sync-notes.mjs` 並調整路徑（指向 `MyDevWebFrontend/../Notes/`），確認 `npm run dev` 前能 sync
- [ ] **apps/devconsole 內容遷移**：
  - [ ] 從現有 `src/` 完整複製到 `apps/devconsole/src/`
  - [ ] 套 design tokens（替換 hard-code 顏色）
  - [ ] 改寫 `HomeLayout`：移除 `VITE_SHOW_PRIVATE` 開關（在 devconsole 永遠 true，直接寫死）
  - [ ] 複製 `scripts/sync-notes.mjs` 或共用（依 Open Question 決定）
- [ ] **Bundle 隔離驗證**：
  - [ ] `apps/blog/` 加 `rollup-plugin-visualizer`，build 後檢查 chunk 不含 `Dev/`、`tools/`、`auth/`、`RuleViewer`、`SQLVisualizer`、`Sudoku`
- [ ] **後續部署 spec**：local 驗證通過後，另開 `specs/YYYY-MM-DD-frontend-split-deploy.md` 處理：
  - Dockerfile / nginx.conf for each app
  - GitHub Actions workflow 拆分 + image push
  - DNS / Cloudflare / Ingress / Helm / ArgoCD
  - Cloudflare Access for devconsole
  - legacy `src/` 下線時機

## References

- 現有 frontend 結構：`MyDevWebFrontend/src/App.tsx`（route 表）、`MyDevWebFrontend/src/pages/layout/HomeLayout.tsx`（layout + auth menu）、`MyDevWebFrontend/Dockerfile`、`MyDevWebFrontend/nginx.conf`
- 部署架構參考：`MyDevWeb/CLAUDE.md`（K8s namespaces、ArgoCD、Cloudflare Tunnel、域名規則）
- CI/CD 現況：`MyDevWebFrontend/.github/workflows/ci.yml`、`release.yml`（tag `V.X.X.X.X.X` 觸發）
- 相關 repo：`Deployments/`（Helm + ArgoCD application 變動的工作目錄）
