---
updated: 2026-06-13
type: module-map
module: RTDRuleViewer
loc: ~6600
spec: specs/2026-06-07-tracker-dep-graph.md
specs_applied:
  - specs/2026-06-07-tracker-dep-graph.md
  - specs/2026-06-13-tracker-impact-deeplink-clause-eval.md
  - specs/2026-06-14-canvas-group-block-select-drag.md
---

[TOC]

## Dependency Graph

```mermaid
graph TD
  APP["App.tsx / pages"] --> RV

  subgraph entry
    RV["RuleViewer.tsx (495)<br/>主入口：狀態中樞 + 右側面板"]
  end

  subgraph data
    API["api.ts (160)<br/>SWR hooks + axios client"]
    DT["dataTransform.ts (52)<br/>DTO → RuleData 合併"]
    TY["types.ts (235)<br/>共用型別 + BlockTypes"]
  end

  subgraph tracker["Tracker（查案核心）"]
    DG["depGraph.ts (452)<br/>DAG 建圖 / trace / impact / report"]
    AP["apfParse.ts (205)<br/>APF tokenizer / clause / 變數萃取"]
    AE["apfEval.ts (233)<br/>條件 AST + 三值評估"]
    CQ["CaseQuery.tsx (608)<br/>Tracker 側欄：Trace + Impact"]
  end

  subgraph canvas
    RVW["RuleView.tsx (854)<br/>Canvas 渲染 + 滑鼠互動"]
    BU["blockUtils.ts (216)"]
    AU["arrowUtils.ts (158)"]
    CU["canvasUtils.ts (127)<br/>grid / minimap / snap"]
    BI["BlockInspector.tsx (774)<br/>雙擊浮動面板"]
    BT["BlockTooltip.tsx (59)"]
    TI["tableinfo.tsx (420)<br/>Import 資料表面板"]
  end

  subgraph search
    RDS["RuleDropdownSearch.tsx (341)<br/>Phase→EQP/Rule 兩段選擇"]
    RCS["RuleContentSearch.tsx (205)<br/>Rule 內關鍵字搜尋"]
  end

  subgraph dev["Dev only"]
    DM["devMock.ts (338)"]
    SR["stressRule.ts (714)<br/>⚠ 生成器 _gen_stress.mjs 不在 repo"]
    DEVP["pages/Dev/* 手動測試 harness"]
  end

  RV --> API
  RV --> DT
  RV --> DG
  RV --> RVW
  RV --> RDS
  RV --> RCS
  RV --> CQ
  CQ --> DG
  DG --> AP
  DG -->|evalSnippet 委派| AE
  RV -->|impact 高亮重用 trackerEdges| DG
  RVW --> BU & AU & CU & BT & BI & TI
  RVW -->|useImportTableResponse| API
  BI -->|tokenize 語法上色| AP
  DT --> TY
  DEVP --> SR & DM
```

## File Index

| 檔案 | 行數 | 職責 | 備註 |
|------|------|------|------|
| `RuleViewer.tsx` | 625 | 主入口；持有全部跨元件狀態（選擇 / 搜尋 / tracker 展開 / runtime 值 / **mode / impactVar**）；**URL deep link 還原+同步**；canvas 與側欄完全受控同步 | phase/rule/log/mode/var 入 URL；runtime/expanded 不入 |
| `types.ts` | 256 | DTO / RuleData / Block / Arrow / DepGraph / ViewNode / **TrackerMode / ImpactResult / ImpactPath** 全型別 | `Repository: "Database"` 為 icon 對應，刻意不一致 |
| `api.ts` | 160 | axios client + `useAPI<T>` 信封拆解 + 5 個 SWR hooks | 標頭註解稱「DEV fallback mock」但未實作（drift）|
| `dataTransform.ts` | 52 | DTO 多列 → 以 baseName 合併為 RuleData（PREBLOCK split、去 `[n]` 後綴、取前 2）| |
| `apfParse.ts` | 205 | APF DSL：tokenize（上色共用）/ parseAPF（IF-THEN-ELSE clause）/ extractVars（跳字串註解 $log$ 函式名）| Tracker 解析正確性的根基 |
| `apfEval.ts` | 233 | APF 條件三值評估：lex（括號/AND/OR/NOT，跳字串註解、函式整段標 unknown）+ 遞迴下降 parseCond + evalCond（三值邏輯）| 自帶 lexer，不依賴 apfParse；evalSnippet 委派它 |
| `depGraph.ts` | 452 | 整條 rule 建一次 DAG；traceLog / expandVar lazy 投影；computeTrace（canvas 邊）；**computeImpact（反向 BFS → 受影響 log + 最短路徑 + 邊）**；evalSnippet（委派 apfEval）；buildLogReport；dumpDepGraph | `dumpDepGraph` 無 UI 掛載點 |
| `CaseQuery.tsx` | 608 | Tracker 側欄：**Trace/Impact 模式切換**；log 搜尋下拉、LayerNode 受控樹、Runtime Log + **trigger 命中 badge**、一鍵複製；**Impact 面板（變數 autocomplete → 受影響 log 清單 → 點擊跳 Trace）** | 「查案」主介面 |
| `RuleView.tsx` | 1056 | Canvas：blocks/arrows/grid/minimap 繪製、pan/zoom、hover/雙擊/右鍵、inspector 管理、tracker 邊上色；**group 框選（Shift marquee）+ 整組拖曳 + 對齊/分佈 toolbar + ESC/方向鍵/雙擊整組 inspector** | 模組內最大檔 |
| `BlockInspector.tsx` | 774 | 浮動詳情面板：Shell（拖曳/縮放/z-index）+ 依類型 Body + 搜尋/Tracker 高亮 | |
| `tableinfo.tsx` | 420 | Import table 浮動面板：搜尋 / 排序 / 欄位拖曳與寬度 | |
| `RuleDropdownSearch.tsx` | 341 | Phase → EQP/Rule 互斥兩段選擇 | |
| `RuleContentSearch.tsx` | 205 | Rule 內容關鍵字搜尋 → MatchResult[] | |
| `blockUtils.ts` | 230 | Block 建構 / icon 快取 / hit test / `blocksInRect`（marquee 相交）/ 繪製 | |
| `arrowUtils.ts` | 158 | PREBLOCK → Arrow 建構與繪製（主/副線）| MAIN 線改最深灰（非藍）|
| `alignUtils.ts` | 49 | 選取 block 對齊（6 op）/ 等距分佈（純函式，就地改 x/y）| spec 2026-06-14；可單測 |
| `canvasUtils.ts` | 127 | grid / minimap / snap / world bounds | |
| `BlockTooltip.tsx` | 59 | hover 提示 | |
| `devMock.ts` | 338 | 開發假資料 + VariableSource | |
| `stressRule.ts` | 714 | STRESS rule 快照（自動生成勿手改）| 生成器 `_gen_stress.mjs` 不在 repo |
| `index.ts` | 39 | barrel export | |

## Symbol Index（MPE：Module / Public symbols / Entry-consumers）

| Module | Public symbols | 被誰用 |
|--------|----------------|--------|
| `depGraph.ts` | `buildDepGraph` `resolveDefs` `traceLog` `expandVar` `computeTrace` `computeImpact` `evalSnippet` `collectLogClosure` `buildLogReport` `dumpDepGraph` `LogClosure` | RuleViewer（build/trace/impact）、CaseQuery、Dev；dump 僅 console |
| `apfParse.ts` | `tokenize` `HIGHLIGHT_RE` `parseAPF` `extractVars` `Token` `Clause` | depGraph、BlockInspector |
| `apfEval.ts` | `parseCond` `evalCond` `CondNode` `CmpOp` | depGraph（evalSnippet 委派）、apfEval.test |
| `api.ts` | `usePhaseResponse` `useEQPRuleResponse` `useRuleResponse` `useRuleInfoResponse` `useResourceDataResponse` `useImportTableResponse` | RuleViewer、RuleView |
| `dataTransform.ts` | `convertDtosToData` | RuleViewer、Dev pages |
| `blockUtils.ts` | `buildBlocks` `getBlockImage` `hitTestBlock` `blocksInRect` `blockCenter` `drawBlock(s)` `BLOCK_SIZE` | RuleView、canvasUtils、arrowUtils |
| `alignUtils.ts` | `alignBlocks` `distributeBlocks` | RuleView（align toolbar）、groupOps.test |
| `arrowUtils.ts` | `buildArrows` `drawArrow(s)` `getSideCenter` `decideConnectionSides` | RuleView |
| `canvasUtils.ts` | `drawGrid` `drawMinimap` `snap` `getWorldBounds` `GRID_SIZE` | RuleView |
| `RuleViewer.tsx` | `default RuleViewer` | App routes |
| `RuleView.tsx` | `RuleView`（forwardRef `RuleViewHandle`: `focusBlockById` / `openInspectorById`）| RuleViewer、DevRuleView |
| `CaseQuery.tsx` | `CaseQuery` `CaseQueryProps` | RuleViewer、DevCaseQuery |
| `types.ts` | 全型別 + `BlockTypes` `Sides` | 模組內全部 |

## 資料流（查案視角）

1. **載入**：`RuleDropdownSearch` 選 Phase/Rule → `useRuleInfoResponse` → `convertDtosToData` → `RuleData[]`
2. **建圖**：`buildDepGraph(rules)`（`useMemo`，整條 rule 一次）→ vars / logs / roots / ancestors（PREBLOCK 反向 BFS）
3. **追蹤**：輸入 `[$LOG$]` → `traceLog` 第一層 → 點節點 / 右鍵 canvas block → `expandedBlocks`（block-keyed，canvas 與側欄共用）→ `computeTrace` 算 canvas 邊
4. **Runtime**：貼 `(VAR: value)` log → `parseRuntimeLog` → `evalSnippet` 逐邊判 fired → 自動展開命中路徑
5. **輸出**：`buildLogReport` → clipboard → 貼給 AI 分析

## 已知風險 / Gap

| 項 | 說明 |
|----|------|
| 測試僅含純函式 | vitest 已建（`npm test`）；apfEval(12) + computeImpact(6) 已測；UI 互動（impact 面板 / canvas 高亮 / URL 還原 / trigger badge）仍靠 F5 目視 |
| `_gen_stress.mjs` 失蹤 | stressRule.ts 標頭指向的生成器不存在 → 與後端 RTDMockData.cs 漂移無從重生 |
| ~~api.ts 註解 drift~~ | ✅ 已修：改為據實「一律打後端、無 mock fallback」 |
| mock 改 dev-only | `devMock.ts`/`stressRule.ts` + 7 個 `/dev/*` 頁以 `import.meta.env.DEV` gate（App.tsx 路由、HomeLayout 選單）；barrel 不再 re-export mock → production bundle 零 mock（build 已驗證） |
| evalCond 函式呼叫保守 | `COUNT(...)` 等函式子條件一律 unknown（不模擬值）；AND/OR/NOT/括號複合條件已支援三值邏輯 |
| 跨 rule impact 未做 | computeImpact 限當前載入 rule；跨 rule 影響需後端 endpoint（backlog）|
| ~~正向 impact 分析~~ | ✅ 已做（computeImpact + Impact 模式 UI，spec 2026-06-13）|
| ~~狀態不可分享~~ | ✅ 已做（URL deep link：phase/rule/log/mode/var，spec 2026-06-13）；runtime/expanded 仍不入 URL（刻意）|

## 查案資料流補充（spec 2026-06-13）

- **Impact（反向）**：Tracker 切 Impact 模式 → 輸入變數（`graph.vars` autocomplete）→ `computeImpact` 反向 BFS → 受影響 `[$LOG$]` 清單 + 最短 var 路徑 → 點 log 切回 Trace；canvas 重用 `trackerEdges` 高亮。
- **Deep link**：mount 讀 `?phase&rule` 觸發載入 → graph ready 補 `log/mode/var`（pending-ref 防 SWR race）→ 狀態變動 replace 寫回；失效 rule/log → notification + 清 param。
- **Clause 評估**：`evalSnippet` → `parseCond`+`evalCond`（apfEval），trigger 整體條件命中狀態顯示於 Tracker（成立/不成立/未知）。
