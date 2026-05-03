---
title: React 效能優化實戰
date: 2026-05-03
tags: [React, TypeScript, Performance]
description: Code splitting、useMemo、useCallback、useEffect 合併等常見效能優化模式，附判斷速查表。
---

## Code Splitting — React.lazy + Suspense

### 問題

靜態 import 所有路由元件，全部打包進 initial bundle，即使使用者只看首頁也得下載所有頁面的程式碼。

```tsx
// ❌ Before：全部靜態 import
import SQLVisualizer from "./pages/tools/SQLVisualizer";
import SudokuSolver from "./components/Sudoku/SudokuSolver";
import RuleViewer from "./components/RTDRuleViewer/RuleViewer";
// ...18 個 import，全打包進 main chunk
```

### 做法

用 `lazy()` 包裝，只在第一次導覽到該路由時才下載對應 chunk。`<Suspense>` 在 chunk 載入中時提供 fallback。

```tsx
// ✅ After：route-level code splitting
import { lazy, Suspense } from "react";

const SQLVisualizer = lazy(() => import("./pages/tools/SQLVisualizer"));
const SudokuSolver  = lazy(() => import("./components/Sudoku/SudokuSolver"));
const RuleViewer    = lazy(() => import("./components/RTDRuleViewer/RuleViewer"));

function App() {
  return (
    <AuthProvider>
      <Suspense>  {/* fallback 省略時預設 null，可傳 <LoadingSpinner /> */}
        <Routes>
          <Route path="sql-visualizer" element={<SQLVisualizer />} />
          {/* ... */}
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
```

### 什麼不能 lazy

| 元件 | 能否 lazy | 原因 |
|------|-----------|------|
| Layout shell（HomeLayout） | ❌ | 所有路由都依賴，每次都需要 |
| Context Provider（AuthProvider） | ❌ | 必須在 Suspense 外層，否則子元件拿不到 context |
| 路由頁面、工具頁面 | ✅ | 使用者不一定會造訪 |
| 共用 UI 元件（Button、Input） | ❌ | 被多處引用，分割反而增加 round-trip |

### 注意

- Default export 直接 `lazy(() => import("path"))` 即可
- Named export 需要 `.then(m => ({ default: m.ComponentName }))`
- 避免從 barrel (`index.ts`) lazy import——barrel 會把整個模組都拉進來，失去分割效果，應直接指向檔案

---

## 搬出 Component 外的 Helper Function

### 問題

JSX helper（回傳 JSX 的純函式）定義在 component body 內，每次 render 都重新建立 function object。

```tsx
// ❌ Before：每次 render 都建立新 function
export default function RuleViewer() {
  function highlightSnippet(snippet: string, kw: string) {
    if (!kw) return <span>{snippet}</span>;
    const idx = snippet.toLowerCase().indexOf(kw.toLowerCase());
    // ...
  }
  // highlightSnippet 被用在 map 裡
}
```

### 做法

沒有用到 component 內 state/props 的函式，一律移到 component 外層。

```tsx
// ✅ After：module-level pure function，只建立一次
function highlightSnippet(snippet: string, kw: string) {
  if (!kw) return <span>{snippet}</span>;
  const idx = snippet.toLowerCase().indexOf(kw.toLowerCase());
  if (idx === -1) return <span>{snippet}</span>;
  return (
    <>
      {snippet.slice(0, idx)}
      <span className="text-yellow-300 font-semibold">
        {snippet.slice(idx, idx + kw.length)}
      </span>
      {snippet.slice(idx + kw.length)}
    </>
  );
}

export default function RuleViewer() {
  // 直接呼叫，不需要 useCallback
}
```

### 判斷原則

函式是否有 closure over component state/props？

- **否** → 搬到 component 外
- **是** → 留在 component 內，視情況加 `useCallback`

---

## useMemo 緩存 Non-Primitive Props

### 問題

在 JSX 或 render 函式內建立 Set / Map / 物件 / 陣列，每次 render 都是全新 reference。即使值相同，子元件收到不同 reference 也會重新 render。

```tsx
// ❌ Before：每次 render 建立新 Set，即使 trackerLogIds 沒變
<RuleView
  trackerLogIds={trackerLogIds.length ? new Set(trackerLogIds) : undefined}
  trackerVarIds={trackerVarIds.length ? new Set(trackerVarIds) : undefined}
/>
```

### 做法

```tsx
// ✅ After：只在 source array 改變時才重建 Set
const trackerLogIdsSet = useMemo(
  () => (trackerLogIds.length ? new Set(trackerLogIds) : undefined),
  [trackerLogIds],
);
const trackerVarIdsSet = useMemo(
  () => (trackerVarIds.length ? new Set(trackerVarIds) : undefined),
  [trackerVarIds],
);

<RuleView
  trackerLogIds={trackerLogIdsSet}
  trackerVarIds={trackerVarIdsSet}
/>
```

### 適用範圍

| Prop 類型 | 需要 useMemo？ | 原因 |
|-----------|---------------|------|
| `string \| number \| boolean` | ❌ | Primitive，值相同就相同 |
| `Set \| Map` | ✅ | Reference type |
| `object literal {}` | ✅ | 每次 render 是新 reference |
| `array literal []` | ✅ | 每次 render 是新 reference |
| 從 state 直接取的值 | ❌ | React 已保證 reference 穩定 |

---

## 合併相似的 useEffect

### 問題

多個只差在變數名稱的 `useEffect`，語意重複、deps 分散，難以維護。

```tsx
// ❌ Before：3 個 effect 做同樣的事
useEffect(() => {
  if (phaseError) notifApi.error({ key: "phaseError", ... });
}, [phaseError]);

useEffect(() => {
  if (eqpError) notifApi.error({ key: "eqpError", ... });
}, [eqpError]);

useEffect(() => {
  if (ruleInfoError) notifApi.error({ key: "ruleError", ... });
}, [ruleInfoError]);
```

### 做法

合併為一個 effect，deps 列出全部相關狀態。

```tsx
// ✅ After：單一 effect，邏輯集中
useEffect(() => {
  if (phaseError)    notifApi.error({ key: "phaseError",    ... });
  if (eqpError)      notifApi.error({ key: "eqpError",      ... });
  if (ruleInfoError) notifApi.error({ key: "ruleError",     ... });
}, [phaseError, eqpError, ruleInfoError]);
```

### 注意

- `notification.error` 傳入不同 `key` → 多條通知並存，不會互相覆蓋
- 合併後行為等同原本：任何一個 error 變化都觸發 effect，`if` guard 防止重複顯示

---

## useCallback 穩定化 Handler

### 問題

Inline function 每次 render 都是新 reference，子元件即使使用 `React.memo` 也會因 prop 改變而重新 render。更重要的是：有 closure over state 的 function 若不包 `useCallback`，在 deps 陣列過時時會讀到 stale state。

```tsx
// ❌ Before：每次 render 建立新 function，且 closure over selectedRule
<RuleDropdownSearch
  onRuleSelect={(ruleName) => {
    if (ruleName !== selectedRule) {   // stale closure 風險
      setSelectedRule(ruleName);
      setLoadedPhase(selectedPhase);  // stale closure 風險
    }
  }}
/>
```

### 做法

```tsx
// ✅ After：deps 正確聲明，function identity 穩定
const handleRuleSelect = useCallback((ruleName: string) => {
  if (ruleName !== selectedRule) {
    setSelectedRule(ruleName);
    setLoadedPhase(selectedPhase);
  }
}, [selectedRule, selectedPhase]);

<RuleDropdownSearch onRuleSelect={handleRuleSelect} />
```

### 何時值得用 useCallback

| 情境 | 建議 | 原因 |
|------|------|------|
| Function 有 closure over state（deps 非空） | ✅ 一定用 | 避免 stale closure |
| Function 傳給有 `React.memo` 的子元件 | ✅ 用 | 避免子元件無謂 re-render |
| Function 是 `useEffect` / `useMemo` 的 dep | ✅ 用 | 避免 effect 無限觸發 |
| 只呼叫 setter，deps 為空 | ⚪ 可選 | setter 本身 reference 穩定，效果有限 |
| 單行 inline `onClick={() => setState(x)}` | ❌ 不用 | 收益 < 程式碼噪音 |

---

## 判斷速查表

遇到效能問題時，依序問這幾個問題：

```
元件 render 太慢 / 太頻繁？
│
├─ 是因為子元件一直重新 render？
│   ├─ prop 是 object / array / Set？ → useMemo 緩存
│   ├─ prop 是 function？             → useCallback 穩定化
│   └─ 子元件本身沒有 memo？         → React.memo 包子元件
│
├─ 是因為 expensive 計算？
│   └─ useMemo 緩存計算結果
│
├─ 是因為 initial bundle 太大？
│   └─ React.lazy + Suspense，以 route 為單位分割
│
├─ 程式碼有 helper function 在 component 內？
│   ├─ 有用到 state/props？ → 留在內，考慮 useCallback
│   └─ 沒用到？             → 搬到 component 外
│
└─ 多個 useEffect 做同樣的事？
    └─ 合併為一個，deps 列出全部相關狀態
```
