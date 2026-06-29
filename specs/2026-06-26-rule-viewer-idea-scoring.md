---
title: RTD RuleViewer 點子收斂與優先級 backlog
created: 2026-06-26
source: rule-viewer-idea-log.md（12 軸 ×2 圈 = 192 原始點子）
method: 去重合併 → 8 主題重歸納 → 5 維打分（V/F/E/U/R）→ Tier
status: 定稿（idea log 已跑完第二圈，停止 /loop 累積）
---

# RTD RuleViewer 點子收斂報告

## 方法

- **來源**：`rule-viewer-idea-log.md`，12 軸每軸 2 圈、每輪 8 點，共 **192 原始點子**。
- **去重**：合併 10 組語意重複/換皮點子 → **182 筆**進入評分。
- **打分**：每筆 1–5 分 × 5 維，`加權總分 = V×0.3 + F×0.25 + E×0.2 + U×0.15 + R×0.1`。
  - V 使用者價值｜F 資料模型可行性｜E 實作成本(5=最便宜)｜U 獨特性｜R 守則符合度(純讀/零副作用)
- **Tier**：≥4.2 P0｜3.5–4.1 P1｜2.8–3.4 P2｜<2.8 P3。
- **硬守則**（全部點子前提）：純讀、不改 rule、不跑 rule 演算法、grounded 在 block 資料模型。

## 全局統計

| 指標 | 值 |
|---|---|
| 原始點子 | 192 |
| 去重後 | 182 |
| P0 | 26 |
| P1 | ~100 |
| P2 | ~52 |
| P3 | 4 |

| 主題群 | 筆數 | 平均分 | 群內 Top |
|---|---|---|---|
| 稽核品質 | 17 | 4.01 | AU-17 Problems 面板(4.65)、AUDIT-3 孤兒盤點(4.4) |
| 導航定位 | 23 | 3.99 | NAV-2 跳定義/引用(4.5)、NAV-3 跳結論(4.4) |
| 解析理解 | 17 | 3.89 | PARSE-1 def-use map(4.65)、PARSE-2 主線骨幹(4.4) |
| 工作流個人化 | 29 | 3.87 | FLOW-26 watchlist(4.25)、FLOW-11 書籤(4.25) |
| 視覺呈現 | 17 | 3.80 | VIZ-3 [$LOG$] badge(4.4)、VIZ-2 主副線邊(4.25) |
| onboarding | 17 | 3.76 | ONBOARD-2 註解→說明層(4.55)、ON-13 先看5block(4.25) |
| 協作匯出 | 33 | 3.56 | COLLAB-5 精準連結(4.4)、CO-31 DB影響清單(4.2) |
| 跨 rule 比較/報表 | 29 | 3.41 | XRULE-20 陳舊度(4.1)、XRULE-6/7(3.9) |

---

## Top 10

| # | ID | 點子 | 總分 |
|---|---|---|---|
| 1 | PARSE-1 | 變數讀寫圖 def-use map | 4.65 |
| 1 | AU-17 | VS Code Problems 面板 | 4.65 |
| 3 | ONBOARD-2 | APF 註解→說明層 | 4.55 |
| 4 | NAV-2 | 跳到變數定義/引用 | 4.50 |
| 5 | NAV-3 | 「跳到結論」清單 | 4.40 |
| 5 | VIZ-3 | [$LOG$] 產出 badge | 4.40 |
| 5 | AUDIT-3 | 孤兒/斷尾盤點 | 4.40 |
| 5 | COLLAB-5 | 「看這個」精準連結 | 4.40 |
| 5 | PARSE-2 | 主線骨幹萃取 | 4.40 |
| 10 | AUDIT-5 | PREBLOCK 完整性 lint | 4.35 |

---

## P0 清單（26 筆，依總分）

| ID | 點子名 | 主題 | 一句 pitch | 靠的欄位/拓樸 | V·F·E·U·R | 總分 |
|---|---|---|---|---|---|---|
| PARSE-1 | 變數讀寫圖 def-use map | 解析 | rule 版 find-references，def/use 一圖看清 | KEY(def)+APF(use) | 5·5·4·4·5 | 4.65 |
| AU-17 | VS Code Problems 面板 | 稽核 | 常駐 dock 列所有 lint 違規、點擊跳 block | lint 結果+focusBlockById | 5·5·4·4·5 | 4.65 |
| ONBOARD-2 | APF 註解→說明層 | onboard | 把 code 註解變使用者文件，零維護 | apfParse comment token | 4·5·5·4·5 | 4.55 |
| NAV-2 | 跳到變數定義/引用 | 導航 | 最高頻操作，點變數跳定義/列引用 | KEY(def)+APF 引用(use) | 5·5·4·3·5 | 4.50 |
| NAV-3 | 「跳到結論」清單 | 導航 | 列所有 [$LOG$] 點一下飛過去 | [$LOG$]+focusBlockById | 4·5·5·3·5 | 4.40 |
| VIZ-3 | [$LOG$] 產出 badge | 視覺 | 產 reason 的 block 加角標，一眼看結論散在哪 | 掃 VALUE [$LOG$] | 4·5·5·3·5 | 4.40 |
| AUDIT-3 | 孤兒/斷尾盤點 | 稽核 | 斷尾 block + 引用不存在變數，整理成單 | findDeadBranchBlocks+roots | 4·5·5·3·5 | 4.40 |
| COLLAB-5 | 「看這個」精準連結 | 協作 | 連結開 rule 後自動選取+置中某 block | 擴充 deep-link+focusBlockById | 4·5·5·3·5 | 4.40 |
| PARSE-2 | 主線骨幹萃取 | 解析 | 只抽 MAIN 鏈、副線收起看核心決策流 | BLOCK_GROUP+PREBLOCK | 4·5·5·3·5 | 4.40 |
| AUDIT-5 | PREBLOCK 完整性 lint | 稽核 | 抓 Function 2-PREBLOCK / Index 1-PREBLOCK 等 | PREBLOCK+BLOCK_TYPE §5b | 4·5·4·4·5 | 4.35 |
| AUDIT-6 | [$LOG$] 衛生 | 稽核 | KEY≠disablereason/副線冒 log/重複 reason | [$LOG$]+BLOCK_GROUP+KEY | 4·5·4·4·5 | 4.35 |
| AU-10 | 座標重疊/離群 lint | 稽核 | 重疊 block 互遮、影響 hitTest 選取 | POSX/POSY | 4·5·4·4·5 | 4.35 |
| VIZ-2 | 主副線邊視覺區分 | 視覺 | primary 實線粗、secondary 虛線細 | Arrow.isPrimary/isMainLine | 4·5·5·2·5 | 4.25 |
| FLOW-11 | 書籤/收藏(+pinned 列) | 工作流 | 釘選常看 rule/block/變數，跨 session 保留 | BLOCK_NAME/變數 key+localStorage | 4·5·5·2·5 | 4.25 |
| FLOW-13 | UI 偏好持久化 | 工作流 | icon/面板/分頁/FAB/主題一次記住 | useState→localStorage | 4·5·5·2·5 | 4.25 |
| FLOW-20 | 復原最近關閉 tab | 工作流 | Ctrl+Shift+T 還原剛關的 rule | closed-tab stack | 4·5·5·2·5 | 4.25 |
| FLOW-26 | 變數 watchlist | 工作流 | 標關注變數，任何 rule 開啟自動高亮 | KEY watchlist 跨 rule | 4·4·4·5·5 | 4.25 |
| ON-13 | 「先看這 5 個 block」推薦 | onboard | 陌生 rule 推薦最關鍵幾個先看 | [$LOG$]+被引用度排序 | 4·4·4·5·5 | 4.25 |
| NAV-10 | 瀏覽器導航史 | 導航 | block 間跳轉後上一步/下一步 | 選取 history stack | 4·5·5·2·5 | 4.25 |
| NAV-1 | PREBLOCK 鍵盤走訪 | 導航 | 方向鍵沿上下游/主副線跳 | PREBLOCK 邊 | 4·5·4·3·5 | 4.20 |
| NAV-11 | Go-to-Symbol | 導航 | 快捷叫出變數/block 模糊跳轉清單 | KEY+BLOCK_NAME | 4·5·4·3·5 | 4.20 |
| NAV-12 | Obsidian local graph | 導航 | 只看選定 block 的鄰域子圖 | PREBLOCK ancestors/descendants | 5·4·3·4·5 | 4.20 |
| COLLAB-9 | 子圖→Mermaid 匯出 | 協作 | 框選一段匯成 Mermaid 貼 PR/文件 | blocks+PREBLOCK→Mermaid | 4·5·4·3·5 | 4.20 |
| CO-31 | 匯出影響清單給 DB 變更單 | 協作 | 改表前匯出「哪些 rule/block 受影響」 | table 熱度+where-used | 5·4·3·4·5 | 4.20 |
| AU-13 | Index 結構完整性 lint | 稽核 | Index 缺 join key/插入欄/PREBLOCK≠2 | Index 欄位+§5b | 4·5·4·3·5 | 4.20 |
| FLOW-23 | 我的 lint 開關 | 工作流 | 選哪些 lint 顯示/忽略，控雜訊 | lint 設定偏好 localStorage | 4·5·4·3·5 | 4.20 |

---

## P1 清單（~100 筆，依主題分組，依總分）

### 解析理解
- PARSE-7 單 rule 常數/門檻側欄 — 4.15
- PARSE-13 單 rule 多次定義(覆寫鏈) — 4.10
- PARSE-14 條件列舉值字典 — 4.10
- PARSE-3 結論→條件全文表 — 3.95
- PARSE-10 變數直接決定因子 — 3.95
- PARSE-15 Function I/O 簽名表 — 3.95
- PARSE-8 變數可能值來源(THEN) — 3.80
- PARSE-11 passthrough 變數偵測 — 3.80
- PARSE-4 變數依賴深度標註 — 3.65
- PARSE-6 聚合函式使用清單 — 3.65
- PARSE-9 APF 條件原子化清單 — 3.65
- PARSE-12 分支爆炸點 — 3.65
- PARSE-16 註解 vs 邏輯並列核對 — 3.65
- PARSE-5 APF 分支結構摘要 — 3.50

### 視覺呈現
- VIZ-6 複雜度 heatmap — 4.10
- VIZ-10 依離結論距離著色 — 4.10
- VIZ-5 常駐 legend+類別篩選 — 4.05
- VIZ-8 mini-map — 4.05
- VIZ-17 Git blame 風更新標註 — 4.05
- VIZ-4 Index 匯流圖示 — 3.90
- VIZ-11 變數血緣絲帶 ribbon — 3.90
- VIZ-1 BLOCK_GROUP 泳道分層 — 3.75
- VIZ-7 LOD 縮放分級 — 3.75
- VIZ-12 群組摺疊成超級節點 — 3.70
- VIZ-16 [$LOG$] 影響暈染 — 3.60

### 導航定位
- NAV-7 BLOCK_SEQ 邏輯順序導覽 — 4.10
- NAV-15 語意捲動條 — 4.10
- NAV-16 依結論逐站回溯 — 4.10
- NAV-19 root→block 路徑導航 — 4.10
- NAV-23 Obsidian backlinks 面板 — 4.10
- NAV-8 空間錨點+回跳(vim mark) — 4.05
- NAV-5 回到起點/終點 — 3.95
- NAV-9 麵包屑 breadcrumb — 3.95
- NAV-18 輸入欄位使用點巡覽 — 3.95
- NAV-22 IDE Outline 大綱面板 — 3.95
- NAV-14 IDE Peek 浮窗 — 3.90
- NAV-4 群組快速跳(+Tab 循環) — 3.75
- NAV-13 Excel 凍結窗格+篩選 — 3.75
- NAV-17 跳到最深/最複雜 block — 3.65
- NAV-21 命中點空間導航 — 3.60
- NAV-6 巡檢下一個未看過 block — 3.60
- NAV-20 對稱位置跳轉 — 3.50

### 稽核品質
- AUDIT-1 註解覆蓋率(複雜度加權) — 4.10
- AU-12 BLOCK_CODE 缺值/格式 — 4.10
- AU-15 TODO/空註解殘留 — 4.10
- AU-9 BLOCK_SEQ 完整性 — 3.90
- AU-16 DispatchScreen 規則檢查 — 3.90
- AUDIT-7 VALUE1~5 空白行檢查 — 3.80
- AUDIT-2 命名規範檢查 — 3.70
- AUDIT-4 空殼/無效列 — 3.65
- AU-11 群組命名一致性 — 3.65
- AUDIT-8 規模門檻警示 — 3.65

### onboarding
- ON-9 rule 一句話總結 — 4.10
- ON-1 block 一句話摘要 — 3.95
- ON-3 變數詞彙表 glossary — 3.95
- ON-6 RTD 黑話 tooltip — 3.95
- ON-8 群組意義導覽 — 3.95
- ON-15 APF cheat sheet 側欄 — 3.95
- ON-14 群組摘要卡 — 3.90
- ON-7 為什麼有這個 block — 3.80
- ON-10 難度分級徽章 — 3.80
- ON-4 rule 故事導讀順序 — 3.65

### 協作匯出
- CO-12 子圖→PNG/SVG 截圖 — 4.05
- CO-24 「給審閱者的導覽」錄製 — 4.05
- CO-11 變數/結論→CSV — 3.95
- CO-14 依賴清單→JSON/DOT — 3.95
- CO-28 整 rule 結論決策表 CSV — 3.95
- CO-13 APF→偽碼/決策表 — 3.90
- CO-6 CLAIM_TIME 變更通知 — 3.90
- CO-1 唯讀分享快照 — 3.75
- CO-10 rule→Markdown 規格 — 3.75
- CO-26 RTD 官方文件範本 PDF — 3.75
- CO-27 PlantUML/Graphviz cluster — 3.75
- CO-32 rule 結構快照封存 🔑 — 3.75
- CO-33 列印友善版 — 3.75
- CO-2 block 附註層 annotation — 3.70
- CO-16 來源表匯出整合 — 3.65
- CO-29 變數→標準資料字典 — 3.65
- CO-21 交接檢核清單自動生成 — 3.60
- CO-30 與 Notes wiki 雙向連結 — 3.60

### 工作流個人化
- FLOW-9 per-rule 記住上次視角 — 4.10
- FLOW-14 跨 tab 結論彙總面板 — 4.10
- FLOW-22 per-block 摺疊記憶 — 4.10
- FLOW-27 per-rule 私人標籤 — 4.10
- FLOW-1 跨已開 rule 變數聯動 — 4.05
- FLOW-29 首次見此 rule 標記 — 4.05
- FLOW-10 私人最近看過清單 — 3.95
- FLOW-18 split 連動捲動/縮放 — 3.95
- FLOW-24 搜尋/查詢歷史 — 3.95
- FLOW-25 個人預設展開深度 — 3.95
- FLOW-5 「相關 rule」側欄推薦 — 3.90
- FLOW-17 對整組 rule 同一查詢 — 3.90
- FLOW-12 per-rule 私人筆記草稿 — 3.80
- FLOW-2 具名工作區 workspace — 3.75
- FLOW-6 N 欄並排 grid — 3.75
- FLOW-3 rule 巡檢佇列 — 3.65
- FLOW-4 Tab 分組(自動+上色) — 3.65
- FLOW-8 session 活動時間軸 — 3.60
- FLOW-15 tab 間拖變數 — 3.60

### 跨 rule 比較/報表
- XRULE-20 陳舊度報表 — 4.10
- XRULE-6 共享變數關係圖 — 3.90
- XRULE-7 rule×table 矩陣/熱度 — 3.90
- XRULE-21 全廠 lint 違規 roll-up — 3.90
- XRULE-28 環境完整性矩陣 — 3.90
- XRULE-1 Rule 結構 diff(2→N 欄) — 3.75
- XRULE-2 同變數跨 rule 對照 — 3.75
- XRULE-15 跨 rule 變數字典 — 3.75
- XRULE-23 全廠孤兒欄位報表(種子衍生) — 3.60
- XRULE-24 BLOCK_CODE 全廠盤點 — 3.55

---

## P2 / P3 清單（觀望 / 暫緩）

### P2（2.8–3.4）
跨 rule：XRULE-12/13/14/16/17/19/22/27（3.45）、XRULE-8（3.35）、XRULE-26（3.30）、XRULE-11（3.20）、XRULE-3/4（3.05）、XRULE-5（3.00）、XRULE-9（2.95）、XRULE-29（2.90）、XRULE-10/18（2.80）
協作：CO-8（3.45）、CO-19（3.45）、CO-20（3.20）、CO-15（3.15）、CO-3/7/18/22（3.00）、CO-23（2.85）
工作流：FLOW-7/19/28（3.45）、FLOW-21（3.35）、FLOW-16（3.30）
視覺：VIZ-14（3.45）、VIZ-9（3.40）、VIZ-15（3.15）、VIZ-13（3.00）
onboarding：ON-17（3.45）、ON-5（3.30）、ON-12/16（3.20）、ON-11（3.00）
解析：PARSE-17（3.45）
稽核：AU-14（3.25）

### P3（<2.8，暫緩）
- CO-4 討論串綁 block/變數 — 2.75（需 comment 後端）
- CO-25 問題狀態流轉 — 2.75（需 thread 後端）
- CO-17 Figma 觀眾模式 — 2.70（需 realtime 廣播）
- XRULE-25 reason 碰撞報表 — 2.65（fuzzy 演算法）

---

## 建議落地順序

1. **偏好層底盤** — FLOW-13/20/23/26：一套 localStorage 偏好系統，個人化全掛這上面。
2. **理解 + 導航首發包** — PARSE-1/2、NAV-1/2/3/10/11/12、ONBOARD-2：全 P0、純讀純前端，看懂+走訪一條 rule 的核心。
3. **Lint 引擎 + Problems 面板** — AUDIT-3/5/6、AU-10/13 由一個引擎掃一次，AU-17 Problems 面板統一顯示。
4. **匯出 + ops 整合** — COLLAB-5/9、CO-31（DB 變更影響清單）對接既有 Mermaid/DB 變更單流程。

## 結構性洞見

- **稽核 + 導航是性價比雙冠軍**（均分 4.0/3.99，且幾乎全純讀純前端）。
- **🔑 CO-32 rule 結構快照封存** 是解鎖「時間維度」功能（XRULE-5 版本 diff、CO-19 changelog）的單一前置——三者都卡在「沒有歷史快照」。
- **兩道牆**：onboarding 進階點撞「需業務詞庫」（ON-12/16）；跨 rule 點撞「需多環境資料」（XRULE-28）。
- **成本天花板群**：跨 rule 的同構/群聚/fuzzy（XRULE-3/4/9/10/18/25）與協作的 annotation/thread/權限（CO-4/18/22/23/25）——novel 但要演算法或新後端，短期不投。

## 風險 / 存疑

- **演算法味（易違反「不跑演算法」）**：XRULE-9 子樹同構、XRULE-10 群聚降維、XRULE-3 結構 hash、XRULE-4/29 共用片段、XRULE-18/25 fuzzy、XRULE-8 同 reason 對照（避免比較真值）。
- **需新後端/store**：CO-2/18/22（annotation）、CO-4/25（thread）、CO-7（review 層）、CO-23（分享 token/auth）、FLOW-19/21/16（狀態/快照 store）。
- **需確認資料源**：CO-32/19、XRULE-5（歷史快照）、XRULE-28（多環境資料）、ON-12/16（業務詞庫）。
- **主要合併群**：結構 diff(G1+A1)、結構相似(G3+A7)、rule×table(G7+J3)、Index join(A5+J5)、Tab 分組(D4+K7)、偏好持久化(I1+I5+I6+I8)、書籤(FLOW-11+T2-7)。
