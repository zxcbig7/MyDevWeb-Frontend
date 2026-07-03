---
title: Full Rule Tree — 整條 rule 無過濾 block 拓樸樹（真實資訊零損失）
status: draft
created: 2026-07-03
updated: 2026-07-03
modules: [frontend]
---

# Full Rule Tree（整條 rule 無過濾拓樸樹）

## Summary

以 **DispatchScreen block 為樹根**、沿 PREBLOCK 往上游展開的 **block 層級拓樸樹**。
與既有 `buildDepGraph`（變數層級、跳斷尾、PREBLOCK scoping）相反：**不做任何篩選**——
斷尾保留、共用上游每條路徑完整重複展開、VALUES 原樣攜帶（KEY / COLUMN1 / COLUMN2 / VALUE 不解析不過濾）。
產出：pure function 資料結構 + 文字 dump（複製給 AI）+ 獨立 UI 樹狀面板。

## Motivation / Why

Tracker（depGraph）為了查案精準，做了三層篩選：跳斷尾、只認 Function 定義、PREBLOCK scoping。
代價是「rule 實際長什麼樣」沒有一個零損失的全貌視圖——要驗證 rule 拓樸、給 AI 完整 context、
或人工盤整條 rule 時，需要一份**忠實反映 DB 內容**的樹狀結構。

## Scope

### In Scope

- 新演算法模組 `ruleTree.ts`：`buildRuleTree(rules)` + `dumpRuleTree(tree)`
- 新型別 `RuleTreeNode` / `RuleTree`（types.ts）
- 獨立 UI 面板 `RuleTreePanel.tsx`：RuleViewer 右側新 tab「全覽」，樹可收合、點跳 canvas、一鍵複製 dump
- 單元測試（coverage 完整性 / cycle / missing / orphan / 重複展開）

### Out of Scope

- 不動既有 `buildDepGraph` / Tracker / Impact 任何行為
- 不解析 APF 表達式（VALUE 原樣字串，不建變數依賴）
- 不做後端 / DB 改動
- 不做 canvas 高亮連動（第一版純面板；hover 連動列為後續加分項）

## User Stories / Use Cases

1. As a RTD 維運者, I want 一鍵複製整條 rule 的完整樹狀結構給 AI, so that AI 拿到零損失 context 分析整條 rule（而非單一 log 的閉包）。
2. As a RTD 維運者, I want 在 UI 上瀏覽以 DispatchScreen 為根的全貌樹, so that 快速驗證 rule 接線是否符合預期（含斷尾）。
3. As a 開發者, I want 一個不做篩選的 ground truth 結構, so that 對照 Tracker 的篩選結果 debug（「為什麼這個 block 沒進依賴圖」）。

## Acceptance Criteria

- [ ] `buildRuleTree(rules)` 回傳的 roots = 該 rule 所有 `DispatchScreen` block（可能多個 → forest）
- [ ] **零損失**：roots 子樹 ∪ orphanRoots 子樹涵蓋 rule 100% 的 block（斷尾與其上游進 orphanRoots，不丟棄）
- [ ] 共用上游在每條路徑**完整重複展開**（同一 block 可在樹上出現多次，各自帶完整子樹）
- [ ] 環：block 已在當前路徑的祖先中再出現 → 節點標 `cycle: true`，停止展開（不 throw、不漏列）
- [ ] PREBLOCK 指向不存在的 block → 節點保留名稱、標 `missing: true`、`raw: null`
- [ ] 每個節點攜帶原始 `RuleData`（VALUES 的 KEY / COLUMN1 / COLUMN2 / VALUE 原樣，含空值欄位不美化）
- [ ] `dumpRuleTree` 輸出 markdown/ASCII：rule 名 + 統計（block 數 / 節點數 / root 數 / 斷尾樹數）+ 逐節點 type、group、VALUES；資料型 block 以 `Table:` / `Columns:` 呈現（沿用 depGraph `DATA_SOURCE_TYPES` 格式）
- [ ] 無 DispatchScreen 的 rule → roots 為空、全部 block 進 orphanRoots（不炸）
- [ ] UI「全覽」tab：樹狀顯示（lazy render，展開才 render 子層）、節點點擊跳 canvas block、雙擊開 inspector、頂部「複製全文」鈕（= dumpRuleTree）
- [ ] 單測全綠 + `tsc --noEmit` 乾淨；以 `STRESS_RULES`（714 行 mock）build + dump < 100ms

## Module Interactions

- **Frontend**：
  - `RTDRuleViewer/ruleTree.ts`（新）— 演算法 + dump，只依賴 `types.ts`（與 `depGraph.ts` 平行的家族成員；`DATA_SOURCE_TYPES` 自 depGraph export 共用）
  - `RTDRuleViewer/types.ts` — 加 `RuleTreeNode` / `RuleTree`
  - `RTDRuleViewer/RuleTreePanel.tsx`（新）— 獨立面板元件
  - `RuleViewer.tsx` — 右側 tab 列加「全覽」，傳 `rules` + `onFocusBlock` / `onOpenInspector`
- **Backend / DB / Infra**：無

## API Design

### 函式簽名（無 HTTP endpoint，純前端）

```ts
// ruleTree.ts
export function buildRuleTree(rules: RuleData[]): RuleTree;
export function dumpRuleTree(tree: RuleTree, rules: RuleData[]): string;
```

## Data Model

```ts
// types.ts
/** 整條 rule 無過濾拓樸樹的節點：一個 block 在某條路徑上的出現 */
export type RuleTreeNode = {
  block: string;             // BLOCK_NAME（missing 時 = PREBLOCK 裡寫的名字）
  blockType: string | null;  // missing 時 null
  raw: RuleData | null;      // 原始 block 資料（VALUES 原樣）；missing 時 null
  children: RuleTreeNode[];  // PREBLOCK 上游，依 PREBLOCK 陣列順序（[0] 主線、[1] 副線）
  cycle: boolean;            // 此出現點為當前路徑祖先重複 → 不再展開
  missing: boolean;          // PREBLOCK 指向不存在的 block
};

/** 整條 rule 的無過濾樹（forest） */
export type RuleTree = {
  roots: RuleTreeNode[];       // DispatchScreen 為根（依 rules 出現順序）
  orphanRoots: RuleTreeNode[]; // 不在任何 DispatchScreen 上游鏈上的末端（斷尾終點）為根的子樹
  blockCount: number;          // rule block 總數
  nodeCount: number;           // 展開後節點總數（重複展開 → 可能 > blockCount）
  truncated: boolean;          // 命中 MAX_NODES 保險絲（理論上不會，防拓樸異常爆炸）
};
```

## Edge Cases & Error Handling

- **多 DispatchScreen** → 多棵根樹（forest），依 rules 順序排列
- **PREBLOCK 為 null / []** → 葉節點（children 空）
- **環（A→B→…→A）** → 重複出現點標 `cycle: true` 停止；同一 block 在**不同路徑**出現不算環（那是共用，照常展開）
- **PREBLOCK 指向不存在的 block** → `missing: true` 節點，名稱保留（真實反映 DB 髒資料）
- **rule 無 DispatchScreen** → roots 空，全部進 orphanRoots
- **orphan forest 的根選取**：未被 DispatchScreen 鏈覆蓋的 block 中，「無任何下游消費者」者為根；若剩餘皆成環（無終點的孤島），取序列中第一個當根（防漏列）
- **指數爆炸保險絲**：`MAX_NODES = 50_000`，超過即停止展開並標 `truncated: true`（真實 rule 遠達不到；防異常拓樸把 UI 拖死）

## Non-Functional Requirements

- **Performance**：`buildRuleTree` + `dumpRuleTree` 對 `STRESS_RULES` < 100ms；UI lazy render（收合節點不 render 子層）
- **相容性**：不 import `depGraph.ts` 的演算法（只 re-use `DATA_SOURCE_TYPES` 顯示格式）；未來 Index→CrossRef 改名不影響本演算法（不特判 block type，除 DispatchScreen root 判定與資料型 dump 格式）
- **可測性**：`ruleTree.ts` 為 pure function，vitest 直測

## Open Questions

- [ ] UI tab 名稱：「全覽」（暫定）— approve 時可改
- [ ] orphan forest 在 UI 是否預設收合成獨立區塊（暫定：是，標「未接終端」）

## Implementation Plan

### Stub 階段（先做）

- [ ] `types.ts` 加 `RuleTreeNode` / `RuleTree`
- [ ] `ruleTree.ts`：`buildRuleTree` / `dumpRuleTree` 簽名 + TODO
- [ ] `RuleTreePanel.tsx`：props interface + `<div>TODO</div>`
- [ ] `RuleViewer.tsx` tab 接線（面板掛上但顯示 TODO）
- [ ] `tsc --noEmit` 綠

### 逐層實作

- [ ] `buildRuleTree`：DispatchScreen roots → 上游遞迴（path 防環、missing 偵測、MAX_NODES）
- [ ] orphan forest：覆蓋差集 → 斷尾終點為根
- [ ] `dumpRuleTree`：統計 header + ASCII 樹 + VALUES 渲染
- [ ] 單測 `__tests__/ruleTree.test.ts`（coverage / cycle / missing / orphan / 重複展開 / 無 DispatchScreen / STRESS 效能）
- [ ] `RuleTreePanel.tsx`：lazy 樹 + 點跳 / 雙擊 / 複製
- [ ] CodeMap.md 同步

## References

- 對照演算法：`RTDRuleViewer/depGraph.ts`, search:`buildDepGraph`（本功能刻意反其道：零篩選）
- 斷尾定義：`depGraph.ts`, search:`findDeadBranchBlocks`
- mock：`stressRule.ts`（效能驗收基準）
