---
title: 操作合理性體檢 — 用 UI/UX 工程專業知識逐項檢視 MyDevWeb 現有操作
created: 2026-06-25
kind: UX audit（grounded，非 brainstorm；每條結論都對應「真實程式碼 + 具名原則」）
method: 直接讀互動原始碼 → 對照具名 UX 原則 → 判斷是否更合理
---

# 操作合理性體檢 🔬

> 規則：**不瞎想**。每條發現都來自「我實際讀過的程式碼」+「一條具名的 UX/UI 工程原則」（Nielsen heuristic / 互動定律 / WCAG / Norman）。
> 沒讀到的檔不評；推測的地方標「需驗證」。

**本次覆蓋範圍**（實際讀過的檔）：
`HomeLayout.tsx`（導覽）、`AuthPage.tsx`（登入）、`RuleDropdownSearch.tsx`（Rule 選擇）、`RuleContentSearch.tsx`（站內搜尋）、`RuleViewer.tsx`（主控殼層）、`NotesList.tsx`、`NoteArticle.tsx`、`ErrorPage.tsx`（部分）。
未含：SQLVisualizer、Sudoku、TailwindCheatsheet、BlockInspector、CaseQuery、AboutPage、Dev harness。

---

## Part 1 — 專業知識框架（評估用的尺）

逐項體檢時引用的具名原則。這就是「UI/UX 工程師看一個操作時腦中跑的 checklist」。

### A. Nielsen 十大可用性啟發法（Usability Heuristics）

1. **系統狀態可見**（Visibility of system status）— 任何操作都要有即時回饋
2. **貼近真實世界**（Match system & real world）— 用使用者的語言與心智模型
3. **使用者掌控與自由**（User control & freedom）— 隨時有「退出 / 復原」
4. **一致性與標準**（Consistency & standards）— 同類操作長一樣、守平台慣例
5. **預防錯誤**（Error prevention）— 比好的錯誤訊息更重要
6. **辨識優於回想**（Recognition over recall）— 選項看得見，別逼人背語法
7. **彈性與效率**（Flexibility & efficiency）— 新手可走、老手有快捷
8. **美感與極簡**（Aesthetic & minimalist）— 不放無關資訊增加雜訊
9. **協助辨識/回復錯誤**（Help recover from errors）— 用人話、給出路
10. **說明與文件**（Help & documentation）— 必要時就近可得

### B. 互動定律（Interaction Laws）

- **Fitts's Law** — 目標越大越近越好點；常用動作要大、要近
- **Hick's Law** — 選項越多決策越慢；用漸進揭露 / 預設值降低當下選項
- **Jakob's Law** — 使用者期待你的站跟他用過的其他站一樣運作（沿用慣例）
- **Tesler's Law（複雜度守恆）** — 複雜度不會消失，只能在「系統承擔」與「使用者承擔」間移動 → 盡量讓系統扛
- **Doherty Threshold** — 系統回應 < **400ms** 才能維持心流；超過要給進度回饋
- **Nielsen 回應時間三閾值** — `0.1s`=瞬間 / `1.0s`=不打斷思路 / `10s`=注意力上限
- **Goal-Gradient** — 越接近完成越有動力 → 多步驟流程顯示進度
- **Aesthetic-Usability Effect** — 好看的介面會被認為更好用（但別拿來掩蓋可用性問題）

### C. Norman 設計原則

- **Affordance / Signifier** — 元件要「看起來可被怎樣操作」+「明示怎麼操作」
- **Mapping** — 控制與結果的對應要直覺
- **Feedback** — 每個動作都要有可感知結果
- **Constraints** — 用限制防止錯誤操作

### D. 每個資料視圖必須設計的「5 種狀態」（Scott Hurff）

`ideal（理想）` / `empty（空）` / `error（錯誤）` / `loading（載入）` / `partial（部分/首次）`
→ 缺任一種，使用者就會在那個狀態看到壞畫面。

### E. 無障礙 WCAG 2.2（工程必達底線）

- `2.1.1` 全功能可鍵盤操作　`2.4.7` 焦點可見　`2.4.1` 可跳過重複區塊（skip link）
- `2.5.8` 觸控目標 ≥ **24×24px**　`1.4.3` 文字對比 ≥ **4.5:1**
- `4.1.2` 自訂 widget 要有 name/role/value（ARIA）　`prefers-reduced-motion` 尊重減動偏好

---

## Part 2 — 操作逐項體檢

格式：**現況（程式碼實證）→ 對照原則 → 是否更合理（建議）**。
嚴重度 🔴高 / 🟡中 / 🟢低。Effort：S/M/L。

### 2.1 導覽 Sidebar / Tab Bar（`HomeLayout.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| N1 | 未登入時「專案開發」整個 group `disabled: !IS_PRIVATE`，子項灰掉 + 鎖頭，**點了沒反應**（`HomeLayout.tsx:69,99`）| Nielsen #1 可見狀態 / Norman mapping：看得到卻無路可走 | 鎖頭項改成**可點 → 導去 `/login`**（或 tooltip「登入後可用」），把「死路」變「入口」 | 🟡 | S |
| N2 | hover 變色用 `onMouseEnter/Leave` 直接改 inline style（`HomeLayout.tsx:196-203,296-303`），**只對滑鼠有效**；鍵盤 focus 不會觸發該視覺（僅剩 UA 預設 outline）| WCAG 2.4.7 / Nielsen #7 | 改用 CSS `:hover` + **`:focus-visible`** 同步高亮，鍵盤使用者也看得到目前位置 | 🟡 | S |
| N3 | 每頁第一個可 Tab 元素就是整排選單，**無 skip-to-content**（全檔無 skip link）| WCAG 2.4.1 Bypass Blocks | 加一個視覺隱藏、focus 才出現的「跳到主內容」連結 | 🟢 | S |
| N4 | 收合的 Sider「整條可點展開」，內層 header 又 `stopPropagation` 切換收合（`HomeLayout.tsx:172-181`）；同一塊區域兩種行為 | Norman：單一元件單一明確 affordance | 收合時只讓**展開鈕**負責展開，避免「點哪都會動但行為不同」 | 🟢 | S |
| N5 | 手機 Top Bar 只有標題、**無返回**（`HomeLayout.tsx:495-518`），深層頁（如 `/notes/xxx`）要回上層只能靠底部 Tab | Jakob's Law（手機慣例有返回）| 深層路由時 Top Bar 左側顯示返回箭頭 | 🟢 | S |
| ✓ | 漸進式選單分組、桌機 Sider + 手機 Tab/Drawer、`selectedKeys` 跟著路由 | Jakob / Hick：符合慣例、降低當下選項 | 維持 | — | — |

### 2.2 登入（`AuthPage.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| L1 | Google One Tap 換 token 失敗**只 `console.error`**，畫面無任何提示（`AuthPage.tsx:32-34`）| Nielsen #1 / #9：錯誤不可見、無回復路徑 | 失敗時顯示 inline error（「登入失敗，請重試」）+ 保留手動登入鈕 | 🔴 | S |
| L2 | 「使用 Google 帳號登入」鈕 `onClick={login}`，**無 pending/disabled/spinner**（`AuthPage.tsx:49-60`）| Doherty / Nielsen #1：OAuth 往返 >400ms 必有等待回饋 | 點擊後 disable + spinner「登入中…」，防重複點擊 | 🟡 | S |
| ✓ | 標準 Google 按鈕樣式、logo、「登入以繼續使用」、「回首頁」退出 | Jakob / Nielsen #3：守慣例、給退出 | 維持 | — | — |

### 2.3 Rule 選擇 — FAB → Phase → EQP → Rule（`RuleDropdownSearch.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| R1 | **FAB 寫死 F01/F02/F03 且三者回完全相同資料**（`RuleDropdownSearch.tsx:16-17`、`RuleViewer.tsx:92`），卻當成必選的第一道關卡 | Hick's Law / Nielsen #2：製造一個「假選擇」，三選一卻無差異 → 純增決策成本 | 後端未分流前：要嘛**預設選好單一值並隱藏**，要嘛標註「目前不影響結果」。別讓人對無意義選項糾結 | 🟡 | S |
| R2 | 自訂 combobox（`<input>`+`<ul>`）有完整鍵盤上下/Enter/Esc，但**無 ARIA**（無 `role=combobox/listbox/option`、`aria-expanded`、`aria-activedescendant`）| WCAG 4.1.2 Name/Role/Value | 補 ARIA combobox pattern，讓螢幕報讀器可用（鍵盤邏輯已具備，只差語意）| 🟡 | M |
| R3 | 直接輸入 Rule 會把 EQP 欄**停用變灰**（`ruleDirectActive`，`:278`），但**沒說明為什麼**停用 | Nielsen #1/#5：禁用無解釋 = 困惑 | 停用時加 tooltip / 小字「已直接輸入 Rule，EQP 不適用」 | 🟢 | S |
| R4 | 清除「×」鈕 `tabIndex={-1}`（`:295,345`），鍵盤到不了 | WCAG 2.1.1 | 雖有 Esc 可清，仍建議「×」可被 focus，或明示 Esc 快捷 | 🟢 | S |
| ✓ | 漸進揭露（選了才往下開）、selection vs loaded 分離（dropdown 操作不清掉已載資料）、Enter 直接載入 | Hick / Nielsen #5 #3：少選項、防誤清、給快捷 | 維持，這設計很好 | — | — |

### 2.4 站內搜尋（`RuleContentSearch.tsx` + `RuleViewer` 結果列）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| S1 | `SearchNavigator` 的 ‹ › 鈕 `w-6 h-6`（=24px）（`RuleContentSearch.tsx:215,227`）| WCAG 2.5.8（≥24px，**剛好踩線**）| 升到 28–32px 留餘裕，觸控更穩 | 🟢 | S |
| ✓✓ | Ctrl+F 攔截瀏覽器 find→聚焦站內搜尋（`RuleViewer.tsx:355`）、180ms debounce、Enter/Shift+Enter 上下筆、Esc 清除、命中 snippet 高亮 + 欄位 tag、`x / total` 計數、`empty/no-match/初次` 三段提示文字（`RuleViewer.tsx:993-1003`）| Jakob（仿瀏覽器）/ Doherty（debounce）/ #1 #6 / 5 狀態齊全 | **標竿級，全站最佳操作**。維持，並把這套互動規格抽成全站搜尋的範本 | — | — |

### 2.5 RuleViewer 主控殼層（`RuleViewer.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| V1 | SWR 錯誤用 antd notification 顯示，但 `description` 直接塞 `error.message`（`RuleViewer.tsx:142,151,159`）| Nielsen #9：用人話、別丟技術訊息 | 包一層友善文案（「伺服器忙線，請稍後重試」）+ 技術細節摺疊 | 🟡 | S |
| V2 | 按「載入」後 `ruleInfoLoading` 期間，**殼層未見 canvas 載入指示**（本檔無 spinner/skeleton；搜尋頁僅依 `loadedRule` 顯示提示）| Nielsen #1 / Doherty / 5 狀態缺 `loading` | 載入中在 canvas 區放 skeleton/spinner（**需驗證 RuleView 內部是否已有**）| 🟡 | S |
| V3 | 已知變數用 textarea 自由打 `(VAR: value)` 語法（`RuleViewer.tsx:793-801`）| Nielsen #6 辨識優於回想：逼使用者記語法 | 提供「變數下拉 + 值輸入」的 chip builder，textarea 當進階模式並存 | 🟡 | M |
| V4 | 點麵包屑「Fab/Phase/Rule」即複製連結（`RuleViewer.tsx:687-720`）| Norman affordance：麵包屑通常用來「導覽」不是「複製」| 已用 hover「⧉ 複製連結」標示緩解；可再加獨立複製 icon 鈕，降低誤解 | 🟢 | S |
| V5 | `Modern/Classic` icon 切換、面板寬度、收合狀態皆 `useState`，**重整即遺失**（`RuleViewer.tsx:280,294,295`）| Nielsen #7：老手偏好應被記住 | 存 localStorage，下次保留 | 🟢 | S |
| ✓ | 可拖曳收合的右側面板（拖到 55px 自動收）、deep-link 即時同步 URL 且可分享、錯誤集中通知 | #3 #7 / 可見狀態 | 維持 | — | — |

### 2.6 開發筆記列表（`NotesList.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| K1 | 搜尋 / Tag 篩選後**只在 header 顯示總數**（`{ALL_NOTES.length} 篇`，`:46`），未顯示「篩出幾筆」| Nielsen #1 | 篩選時顯示「X / 總 N 篇」 | 🟢 | S |
| K2 | 搜尋字 + 選取 tag **不入 URL**（純 `useState`），無法分享 / 書籤 / 上一頁還原 | Nielsen #3 / Jakob | 把 `search`、`tag` 同步進 query string | 🟢 | M |
| ✓ | 即時前端篩選、`empty` 狀態（「找不到符合的筆記」`:99`）、整卡可點（大目標 Fitts）、tag toggle | Doherty / Fitts / 5 狀態 | 維持 | — | — |

### 2.7 單篇筆記（`NoteArticle.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| A1 | 長文**無 TOC / 閱讀進度 / scroll-spy**（檔內僅 prose 渲染 + 返回鈕）| Nielsen #1 定位感 / 長內容導覽 | 右側浮動目錄 + 頂部進度條（呼應藍圖 §2.9）| 🟡 | M |
| A2 | 讀完只有「← 回到列表」（`:131-137`），**無上一篇/下一篇 / 相關筆記**，是死路 | Goal-Gradient / Peak-End：結尾體驗影響留存 | footer 加 prev/next + 「相關筆記」（用既有 wiki-link / tag）| 🟢 | M |
| A3 | wiki-link 解析不到時 fallback 成猜測 slug（`:24`），可能**靜默導到 404** | Nielsen #5 預防錯誤 | 解析失敗的連結標記為 broken（淡灰 + tooltip），別讓人點進死頁 | 🟢 | S |
| ✓ | not-found 狀態（📭 + 回列表 `:37-51`）、外部連結 `_blank`+`noopener`、內部走 SPA `<Link>` | 5 狀態 / 安全 / Jakob | 維持 | — | — |

### 2.8 錯誤頁（`ErrorPage.tsx`）

| # | 現況（實證） | 對照原則 | 建議 | 嚴重 | Effort |
|---|---|---|---|---|---|
| E1 | 錯誤文案**全是英文**（`errorConfig` 400/401/.../500，`ErrorPage.tsx:146-177`），但全站介面是繁中 | Nielsen #2 貼近真實世界 / #4 一致性 | 文案改繁中（technical term 可留），與全站語言一致 | 🟡 | S |
| E2 | 404 時主要（紅）按鈕是 **`Retry`**（reload），但「找不到頁面」重整無濟於事（`ErrorPage.tsx:206-212,256-268`）| Nielsen #2 / #5：主行動與情境不符 | 依 statusCode 切主行動——404/403 主鈕應為「回首頁」，5xx 才是「重試」 | 🟡 | S |
| E3 | 整頁 inline style + `Courier` + 自訂紅（`ErrorPage.tsx:17-90`），脫離 design-tokens；`Go Home` 用 `location.href="/"` 走整頁 reload 非 SPA 導覽（`:218`）| Nielsen #4 一致性 | 顏色至少引用 token；回首頁可改 SPA `navigate("/")` | 🟢 | S |
| ✓ | `Retry / Go Home` 皆有合理預設（reload / 導 `/`）、6 種 status 預設文案、淡入動畫 | Nielsen #3 #9：給出路 | 出路設計本身 OK | — | — |

---

## Part 3 — 跨站系統性問題（重複出現，建議一次治）

這些不是單一頁的問題，是**反覆出現的模式**，治一次全站受惠（Tesler 複雜度守恆：讓系統承擔）。

1. **自訂互動元件缺 ARIA**（R2、N2）— RuleDropdownSearch 等手刻 combobox/menu 鍵盤邏輯都做了，**就差 role/aria-* 語意**。→ 抽一個合規的 `Combobox` / `Listbox` 共用元件，全站換上。
2. **`:focus-visible` 焦點態普遍缺席**（N2）— hover 多靠 JS inline / Tailwind `hover:`，但鍵盤焦點態零散。→ 在 design-tokens 定義統一 focus ring，全域套用。
3. **`loading` 狀態不齊**（V2、L2）— dropdown 有「讀取中…」，但**按鈕送出中、rule 資料抓取中**缺等待回饋。→ 約定：任何 >400ms 的非同步操作都要 disable + 進度態（接 `useAsync` / SWR `isLoading`）。
4. **可分享 / 可還原狀態不一致**（K2、V4）— RuleViewer 把狀態存進 URL 做得很好，但 Notes 搜尋/tag 沒有。→ 統一「重要篩選狀態進 URL」原則。
5. **錯誤訊息技術味**（V1、L1）— 直接顯示 `error.message` 或只 console。→ 共用一層 error → 友善文案的轉換（boundary 也可順便補 Zod，呼應 CLAUDE.md）。
6. **使用者偏好不持久**（V5）— icon 模式 / 面板寬度重整即失。→ 共用 `usePersistentState`（localStorage）。

---

## Part 4 — 快速勝利排序（高回報 / 低成本先做）

照「痛感 × 易做」排，全是 S/M：

| 順位 | 項目 | 為何先做 |
|---|---|---|
| 1 | **L1 登入失敗顯示提示** | 🔴 唯一會讓人「卡死且不知為何」的點，成本 S |
| 2 | **L2 / V2 送出中與載入中等待回饋** | 跨頁信任感，違反 Doherty 最有感 |
| 3 | **N1 鎖頭項變登入入口** | 把死路變轉化路徑，順手 |
| 4 | **統一 `:focus-visible` ring（Part 3-2）** | 一次建設，全站鍵盤可用性跳級 |
| 5 | **V1 錯誤文案人話化** | 觀感與專業度，成本 S |
| 6 | **A1 長文 TOC + 進度條** | Reader 體驗最有感的升級 |

> 想真的動其中一條 → 對它跑 `/sdd` 產可實作規格再進 stub。

---

## 附：方法論可重用性

Part 1 的「專業知識框架」本身與專案無關，可抽成框架層的 UI/UX domain（`LLMDevFramework/UIUX/CLAUDE.md`），日後任何前端專案 review 都用同一把尺。需要的話我再抽。

## References
- 受檢操作：見各條 `檔名:行號`
- 前端規範：`MyDevWebFrontend/CLAUDE.md`、`LLMDevFramework/React & Typescript/CLAUDE.md`
- 同批產出的方向藍圖：`specs/2026-06-25-frontend-dream-blueprint.md`
- 原則來源：Nielsen Norman Group（Heuristics、Response Times）、Laws of UX（lawsofux.com）、WCAG 2.2、D. Norman《The Design of Everyday Things》
