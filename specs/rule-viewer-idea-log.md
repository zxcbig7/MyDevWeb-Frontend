---
title: RTD RuleViewer 純發想 idea log（/loop 30m 累積）
created: 2026-06-26
kind: idea log（每輪一個軸 append；不寫 code、不改 rule、不跑演算法、grounded 在資料模型）
---

# RTD RuleViewer 發想 log 🌙

每輪由 `/loop` append 一段。守則：純發想，**不寫 code、不修改 rule、不執行/模擬 rule 演算法**，
所有點子 grounded 在 [block 資料模型](2026-06-25-block-data-model.md)（block 三層、APF VALUE、PREBLOCK 拓樸、`[$LOG$]`、Index、BLOCK_GROUP）。
altitude 對齊「分頁開多個 rule」這種**實用但非顯而易見**的程度。

---

## 軸涵蓋追蹤（每輪挑「最少涵蓋」的一個，跑完把次數 +1）

| # | 軸 | 已跑次數 | 已產點子數 |
|---|---|---|---|
| ① | 解析單一 rule 內容 | 2 | 16 |
| ② | 多 rule / workspace / session 工作流 | 2 | 16 |
| ③ | 導航與定位 | 2 | 16 |
| ④ | 比較與跨 rule 關係 | 2 | 16 |
| ⑤ | 圖的視覺化呈現方式 | 2 | 16 |
| ⑥ | 稽核 / 品質 / lint（純讀）| 2 | 16 |
| ⑦ | onboarding / 解釋性 | 2 | 16 |
| ⑧ | 狀態記憶與個人化 | 2 | 16 |
| ⑨ | 協作 / 分享 / 交接 | 2 | 16 |
| ⑩ | 匯出與整合 | 2 | 16 |
| ⑪ | 從原始資料批次報表 | 2 | 16 |
| ⑫ | 類比借用（VS Code / 瀏覽器 / Figma / Excel / Obsidian）| 2 | 16 |

> 已知種子（避免重複，不算新點子）：分頁開多 rule、split 並排、常駐 rule 樹側欄、session restore、跨 tab 全域搜尋、決策樹攤平、拓樸鐵則 lint、結論字典、hardcode 清冊、沒用到的 DB 欄位、輸入需求清單、變數血緣到 DB 欄位、Index join 清單。

---

## 發想紀錄（新的 append 在最上面）

<!-- 每輪格式：
## YYYY-MM-DD HH:mm · 軸：<軸名>
1. **<點子>** — <一句 pitch>｜靠 <欄位/拓樸> 做得到
   …（8 個）
⭐ 本輪最 non-obvious：<2 個>
下一輪建議換：<軸>
-->

## 2026-06-26 12:13 · 軸：⑫ 類比借用（第二圈 · 進階）— 第二圈收尾

> 第一圈⑫已做：breadcrumb/導航史/go-to-symbol/local graph/Excel凍結/Figma簡報/分頁群組/IDE Peek。

1. **VS Code Problems 面板** — 底部常駐面板列所有 ⑥ lint 違規，點跳該 block｜借 VS Code Problems｜靠 lint 結果 + `focusBlockById`。
2. **Git blame 風更新標註** — block/rule 旁標 `CLAIM_TIME`（何時最後動），像 blame｜借 Git blame｜靠 `CLAIM_TIME`。
3. **瀏覽器 Reader Mode** — 一鍵轉純閱讀版（決策樹 + 結論，去畫布互動）｜借 Reader mode｜靠 ①決策樹 + `[$LOG$]`。
4. **Excel 樞紐分析（pivot）** — 對 block 清單做 pivot（按 type/group 計數彙總）｜借 Excel pivot｜靠 RuleData 欄位。
5. **Figma component / instance** — 重複子拓樸標成 component、看哪些是同模板 instance｜借 Figma component｜靠 ④共用片段。
6. **IDE Outline 大綱面板** — 側欄樹：群組 ▸ block ▸ 變數，隨捲動 sync｜借 VS Code Outline｜靠 BLOCK_GROUP + `KEY`（vs go-to-symbol=搜尋跳）。
7. **書籤列 / pinned tabs** — 常用 rule 釘頂部書籤列｜借瀏覽器｜靠 ⑧書籤（借 UI 形態）。
8. **Obsidian backlinks 面板** — 某變數/block 的「被引用」反向連結清單面板｜借 backlinks｜靠 where-used（vs local graph=圖）。

⭐ 本輪最 non-obvious：**#1 VS Code Problems 面板**（把 ⑥ lint 變常駐 dock、點擊跳轉、operationalise 稽核）、**#5 Figma component/instance**（把重複子拓樸視為元件+實例、提升複用意識）。

下一輪建議：**第二圈已滿（12 軸 ×2 = 192 點）。建議停 loop + 收斂優先級 backlog**，而非進第三圈（重複風險高）。若續跑則進第三圈 ⑤。

## 2026-06-26 11:43 · 軸：⑪ 從原始資料批次報表（第二圈 · 進階）

> 第一圈⑪已做：變數字典/reason總目錄/table熱度/規模統計/Index總表/命名歧異/phase×group矩陣/陳舊度。全跨 rule 聚合、純讀。

1. **全廠 lint 違規 roll-up** — 把 ⑥ 各 lint 跨所有 rule 彙總成「違規排行」，揪最髒的 rule｜靠 lint 結果聚合（vs ⑥=單 rule）。
2. **變數複用 vs 重複定義** — 哪些變數名跨 rule 重複定義、定義是否一致｜靠 `KEY` 跨 rule + 定義文字比對。
3. **全廠孤兒欄位報表** — 哪些 Database 表/欄位「被拉但全廠沒任何 APF 用到」｜靠 `COLUMN1` ∪ vs APF 引用全集（沒用欄位 seed 的全廠版）。
4. **BLOCK_CODE 盤點** — 全廠 `BLOCK_CODE` 填寫率/重複值/分布｜靠 §0.1 `BLOCK_CODE`（缺口欄批次盤點）。
5. **reason 碰撞報表** — 同 reason 名被多 rule 用是否語意一致、拼錯的近似 reason｜靠 `[$LOG$]` 跨 rule fuzzy。
6. **複雜度分布直方圖** — 全廠複雜度分布 + 長尾「巨獸 rule」清單｜靠規模統計聚合（vs ⑪#4 排行=表）。
7. **Index join key 一致性** — 全廠 Index join key 統計（多數 LOT_ID？有無異類）｜靠 Index `COL1/COL2` 聚合。
8. **環境完整性矩陣** — 哪條 rule 在哪些 phase/環境存在/缺漏｜靠 `PHASE` + `RULE_NAME` 跨環境（vs ⑪#7 結構分布、此=存在性缺漏）。

⭐ 本輪最 non-obvious：**#1 全廠 lint 違規 roll-up**（per-rule lint → 全廠品質排行、揪最該整理的 rule）、**#3 全廠孤兒欄位報表**（被拉卻全廠沒人用的 DB 欄位、可清理）。

下一輪建議換：⑫ 類比借用（第二圈，第二圈最後一軸）

## 2026-06-26 11:13 · 軸：⑩ 匯出與整合（第二圈 · 進階）

> 第一圈⑩已做：子圖→Mermaid/rule→Markdown/變數結論→CSV/子圖→PNG/APF→偽碼·決策表/依賴→JSON·DOT/embed Notes/來源表 CSV。

1. **RTD 官方文件範本（PDF）** — 整條 rule 套範本（含 §0 schema、結論、輸入需求、Index 對照）一鍵出 PDF 給審核｜靠 RuleData 全欄 + schema（vs rule→Markdown=陽春）。
2. **PlantUML / Graphviz cluster** — 除 Mermaid 外出 PlantUML、或帶 `BLOCK_GROUP` cluster 的 Graphviz｜靠 PREBLOCK + BLOCK_GROUP cluster（DOT 已於 pass1）。
3. **整 rule 結論決策表 CSV** — 所有 `[$LOG$]` × 觸發條件出成決策表給 BA/QA｜靠 `[$LOG$]` + cond（vs pass1 APF→決策表=單 Function）。
4. **變數 → 標準資料字典** — 變數表匯成資料字典（名稱/型別推斷/來源欄/說明）｜靠 `KEY` + deps + comment。
5. **與 Notes wiki 雙向連結** — rule 內概念連到 Notes 筆記、Notes 反連回 rule｜靠 deep-link + 既有 `remark-wiki-link`（vs embed=嵌入）。
6. **匯出影響清單給 DB 變更單** — 改某表前匯出「哪些 rule/block 受影響」貼進變更單｜靠 ⑪ table 熱度 + where-used。
7. **rule 結構快照封存** — 存當前結構快照(含 `CLAIM_TIME`)當稽核底稿/日後 diff｜靠 RuleData 序列化（接 ④diff、⑨changelog）。
8. **列印友善版** — 一鍵 A4 排版（主線決策樹 + 結論表）發紙本｜靠 RuleData + 列印 CSS。

⭐ 本輪最 non-obvious：**#6 匯出影響清單給 DB 變更單**（改表前先附「影響哪些 rule」清單、接真實 ops 流程）、**#5 與 Notes 雙向連結**（複用既有 wiki-link 打通 rule↔筆記）。

下一輪建議換：⑪ 從原始資料批次報表（第二圈）

## 2026-06-26 10:43 · 軸：⑨ 協作 / 分享 / 交接（第二圈 · 進階）

> 第一圈⑨已做：唯讀快照/block附註層/交接包/討論串/精準連結/CLAIM_TIME通知/審閱模式/匿名化。

1. **註解 @提及 + 指派** — 附註可 @人、指派待辦，交接責任明確｜靠 annotation 層 + 使用者（深化附註）。
2. **變更 changelog 自動生成** — 用 `CLAIM_TIME` + 兩快照結構 diff 自動產「這條改了什麼」交接文件｜靠 CLAIM_TIME + ④版本 diff（vs ⑨通知=只提醒）。
3. **分享含我的高亮/註記** — 分享連結帶上 annotation/watchlist 高亮，對方看到一樣的重點｜靠 deep-link + annotation（vs 唯讀快照=純視角）。
4. **交接檢核清單自動生成** — 交接時自動列 checklist（看過結論？確認輸入表？無斷尾？）｜靠 `[$LOG$]`+roots+lint 自動列（接 ⑥⑦）。
5. **多人註解彙整側欄** — 一條 rule 上所有人的附註/問題集中列、逐一處理｜靠 annotation 聚合。
6. **分享過期/權限控管** — 唯讀連結設到期、限特定人、可撤銷｜靠 token + 權限（深化 ⑨#1）。
7. **「給審閱者的導覽」錄製** — 預錄一串「先看這→再看那」步驟連結，受審者照走（非同步 walkthrough）｜靠 deep-link 序列（vs 精準連結=單點、⑦ tour=自己看）。
8. **問題狀態流轉** — block/變數討論串有「開啟→處理中→解決」狀態，交接看未解清單｜靠 thread + 狀態。

⭐ 本輪最 non-obvious：**#7「給審閱者的導覽」錄製**（用 deep-link 序列錄成可分享的非同步逐站走查）、**#2 變更 changelog 自動生成**（兩快照 diff → 人讀的交接 changelog）。

下一輪建議換：⑩ 匯出與整合（第二圈）

## 2026-06-26 10:13 · 軸：⑧ 狀態記憶與個人化（第二圈 · 進階）

> 第一圈⑧已做：偏好持久化/per-rule視角/最近看過/書籤/預設FAB·Phase/分頁偏好/私人筆記草稿/檢視偏好。

1. **per-block 摺疊記憶** — 記每個 block inspector/VALUES 卡片的展開摺疊，重開還原｜靠 `BLOCK_NAME` + localStorage（vs per-rule 視角=整體）。
2. **我的 lint 開關** — 選哪些 ⑥ lint 顯示、哪些忽略｜靠 lint 設定偏好。
3. **搜尋/查詢歷史** — 記打過的搜尋字、下次自動補｜靠搜尋 history（vs 最近看過=rule）。
4. **個人預設展開深度** — Tracker 預設展開幾層、是否預設開 runtime panel｜靠 expandedBlocks 預設偏好。
5. **「我關注的變數」watchlist** — 標幾個常追變數，任何 rule 開啟自動高亮｜靠 `KEY` watchlist 跨 rule（vs 書籤=收藏 rule/block）。
6. **per-rule 私人標籤** — 給 rule 貼自訂 tag（"待釐清"/"我負責"）供私人篩選｜靠 `RULE_NAME` + 私人 tag。
7. **佈局 profile** — 多種版面 profile（精簡/分析/比較）一鍵切並各自記住｜靠版面設定集合。
8. **首次見此 rule 標記** — 記哪些 rule 看過/第一次，第一次多給導引｜靠 viewed-set（記憶驅動 ⑦ onboarding）。

⭐ 本輪最 non-obvious：**#5 變數 watchlist**（標關注變數、跨任何 rule 自動高亮，像 debugger watch）、**#8 首次見此 rule 標記**（用 viewed-set 驅動自適應導引）。

下一輪建議換：⑨ 協作 / 分享 / 交接（第二圈）

## 2026-06-26 09:43 · 軸：⑦ onboarding / 解釋性（第二圈 · 進階）

> 第一圈⑦已做：block一句話/APF註解→說明層/變數glossary/rule故事導讀/guided tour/黑話tooltip/為什麼有此block/群組意義。

1. **rule 一句話總結** — 整條 rule 摘成一句（吃哪些輸入 → 吐哪些 reason）｜靠 roots + `[$LOG$]` 自動組句（vs block 一句話=單 block）。
2. **難度分級徽章** — 給 rule 標「新手/進階」（依規模/深度/分支），新手先挑簡單的｜靠規模統計當 onboarding 標籤。
3. **概念地圖** — 把核心變數關係畫成概念圖當教材（非完整拓樸）｜靠 `KEY` + deps 抽核心。
4. **術語對照（業務↔技術）** — `disablereason`/`HOLD_RISK` 對應業務白話｜靠 `KEY` + 註解 + 詞庫（vs 黑話tooltip=定義 RTD 名詞）。
5. **「先看這 5 個 block」推薦** — 進陌生 rule 推薦最關鍵幾個先看（產結論的、最多下游的）｜靠 `[$LOG$]` + 被引用度（vs 故事導讀=順序）。
6. **群組摘要卡** — 每個 `BLOCK_GROUP` 一張卡：這副線算什麼、輸出什麼變數進主線｜靠 group + 該群 Function `KEY` + Index 輸出（vs 群組意義=主/副線角色）。
7. **APF 語法 cheat sheet 側欄** — 常駐 IF/THEN/`[$$]`/`COUNT()` 語法說明，給不熟 APF 的人｜靠固定語法表（接既有 TailwindCheatsheet 模式）。
8. **結論釋義** — 點一 disable reason，顯示業務意義 + 觸發大意（白話）｜靠 `[$LOG$]` + 註解/詞庫。

⭐ 本輪最 non-obvious：**#5「先看這 5 個 block」推薦**（陌生 rule 的智慧入口、靠結論點+下游度排序）、**#2 難度分級徽章**（rule 標難度、新手先挑簡單的）。

下一輪建議換：⑧ 狀態記憶與個人化（第二圈）

## 2026-06-26 09:13 · 軸：⑥ 稽核 / lint（第二圈 · 進階）

> 第一圈⑥已做：註解覆蓋率/命名規範/孤兒斷尾/空殼列/PREBLOCK完整性/[$LOG$]衛生/VALUE空白行/規模門檻。全靜態不評估。

1. **BLOCK_SEQ 完整性** — seq 跳號、重複(非 array facet)、與拓樸順序不一致｜靠 `BLOCK_SEQ` + topo（順帶查 NUMBER vs string 漂移）。
2. **座標重疊/離群** — 多 block `POSX/POSY` 完全重疊(非 facet)、或飄離群（重疊會互相遮、影響 hitTest）｜靠 POSX/POSY。
3. **群組命名一致性** — 同副線散在不同 `BLOCK_GROUP`、或命名不符 MAIN/Gn 慣例｜靠 BLOCK_GROUP + PREBLOCK。
4. **BLOCK_CODE 缺值/格式** — 盤點哪些 block 沒填 `BLOCK_CODE`、格式異常｜靠 §0.1 `BLOCK_CODE`（直接針對該欄缺口）。
5. **Index 結構完整性** — Index 缺 join key、無插入欄、PREBLOCK 不是恰好 2｜靠 Index 欄位 + §5b（pass1 PREBLOCK 完整性的 Index 深化）。
6. **同名變數不同義疑慮** — 同變數名在不同 group 疑似被當不同用途（啟發式標記、不評估）｜靠 `KEY` + 上下文。
7. **TODO / 空註解殘留** — APF 內 `// TODO`、空 `/* */`、被註解掉的整段邏輯｜靠 comment token 內容掃描。
8. **DispatchScreen 規則檢查** — DS 不在最後/有多個/帶不該有的欄位值｜靠 DispatchScreen + 拓樸（§5b：純 sink、收尾）。

⭐ 本輪最 non-obvious：**#4 BLOCK_CODE 缺值檢查**（直接 lint §0.1 的 schema 缺口欄）、**#2 座標重疊/離群**（重疊 block 互相遮、且影響 hitTest「距中心最近」選取）。

下一輪建議換：⑦ onboarding / 解釋性（第二圈）

## 2026-06-26 08:43 · 軸：③ 導航與定位（第二圈 · 進階）

> 第一圈③已做：PREBLOCK鍵盤走訪/跳變數定義引用/跳結論/群組跳/起終點/巡檢/seq導覽/空間錨點（＋⑫breadcrumb·go-to-symbol·local-graph、⑤minimap）。

1. **語意捲動條** — 右側捲軸標記 `[$LOG$]`/Index/斷尾位置（VS Code 風），大圖快速定位｜靠 `POSY` + 標記掃描（vs minimap=縮圖，此=捲軸標記）。
2. **依結論逐站回溯** — 選一 disable reason，一步步沿觸發條件往上游走（next 跳上一層因子）｜靠 `[$LOG$]` triggers + deps 鏈逐站。
3. **群組間 Tab 循環** — Tab 在 MAIN/G1/G2/G3 間循環聚焦，快速掃各副線｜靠 `BLOCK_GROUP` 順序。
4. **跳到最深/最複雜 block** — 一鍵直達拓樸最深或條件最多的 block（熱點直達）｜靠深度/複雜度計數 + `focusBlockById`。
5. **輸入欄位使用點巡覽** — 選一 DB 欄位，逐一跳所有用到它的 Function｜靠 Database `COLUMN1` + APF 引用（vs 跳變數引用=計算變數）。
6. **root → 此 block 路徑導航** — 顯示從資料源到選定 block 的完整依賴路徑、沿路逐站跳｜靠 ancestors 鏈（vs 麵包屑=層級）。
7. **對稱位置跳轉** — 在 G1 某 block 一鍵跳 G2/G3 的對應 block（同角色，如各副線 FILTER）｜靠 `BLOCK_GROUP` + `BLOCK_TYPE`/`BLOCK_SEQ` 對位。
8. **命中點空間導航** — 搜尋命中標在 minimap/捲軸，可在命中間按空間鄰近跳（非只清單順序）｜靠命中 `POSX/POSY`。

⭐ 本輪最 non-obvious：**#7 對稱位置跳轉**（平行副線間跳同角色 block）、**#1 語意捲動條**（捲軸標 `[$LOG$]`/Index/斷尾，大圖秒定位）。

下一輪建議換：⑥ 稽核 / lint（第二圈）

## 2026-06-26 08:13 · 軸：② 多 rule / workspace（第二圈 · 進階）

> 第一圈②已做：變數聯動/具名workspace/巡檢佇列/自動分組/相關rule推薦/N欄grid/tab預覽/活動時間軸（＋seed）。本輪更深。

1. **跨 tab 結論彙總面板** — 一面板列出「所有開啟 rule 的 disable reason 總和」，跨案子鳥瞰｜靠 `[$LOG$]` 跨 open tabs 聚合（vs ④兩兩、⑪全廠批次）。
2. **tab 間拖變數** — 從 tab A 拖一變數到 tab B，B 自動定位該變數（跨文件參照手勢）｜靠 `KEY` 跨 rule 定位（vs 變數聯動=自動，此=手動拖）。
3. **workspace 階層書籤樹** — workspace 內 rule 再加自訂資料夾/標籤分層（非平鋪 tabs）｜靠 workspace 集合 + 使用者層級。
4. **對整組 rule 做同一查詢** — 對 workspace 所有 rule 同時找某變數/某 reason，結果彙整一表｜靠跨 open rule 批次查（純讀）。
5. **split 連動捲動/縮放** — 並排兩 rule 同步平移縮放，對照省力｜靠共用 viewport transform。
6. **tab 狀態色點** — 每個 tab 加「已審/待辦/問題」色點，工作進度一眼知｜靠 per-rule 狀態（接 ⑧/⑨ 但落在 tab 列）。
7. **復原最近關閉 tab** — Ctrl+Shift+T 還原剛關的 rule tab｜靠 closed-tab stack。
8. **workspace 差異快照** — 存一個 workspace 的當下狀態，下次開比對「哪些 rule 變了」｜靠 workspace + `CLAIM_TIME` 比對（vs ④單 rule 版本 diff）。

⭐ 本輪最 non-obvious：**#4 對整組 rule 做同一查詢**（把開啟的 workspace 變成迷你查詢標的）、**#8 workspace 差異快照**（整組 rule 的「自上次以來誰變了」）。

下一輪建議換：③ 導航與定位（第二圈）

## 2026-06-26 07:43 · 軸：④ 比較與跨 rule 關係（第二圈 · 進階）

> 第一圈④已做：side-by-side diff/同變數對照/近似偵測/共用片段/版本快照diff/共享變數圖/rule×table矩陣/同reason對照。本輪更深、仍純結構不評估。

1. **多版本 N 欄合併比對** — 同 rule 三環境(dev/stg/prod) 三欄並排標差異（非兩兩）｜靠 `BLOCK_NAME`/`KEY` 多方集合比對（環境漂移）。
2. **血緣形狀相似度（子樹同構）** — 不比文字、比兩變數依賴子樹是否同構（換湯不換藥）｜靠 deps 子樹結構比對。
3. **rule 群聚 2D 散佈** — 依「共用變數/表/型別組成」特徵把所有 rule 聚群、畫散佈圖｜靠特徵向量 + 相似度（vs 共享變數圖=關係邊，此=群聚降維）。
4. **子集偵測（誰是誰精簡版）** — 一條 rule 的 block/變數集合是否被另一條完全包含｜靠集合包含關係。
5. **Index join 模式比對** — 跨 rule 比「副線→主線 join 模式」是否一致（key 對法/插入欄）｜靠 Index `COL1/COL2/VALUE` 跨 rule。
6. **disable reason 涵蓋差集** — 兩 rule 各吐哪些 reason，標「A 有 B 沒有」｜靠 `[$LOG$]` 集合差。
7. **拓樸指紋** — 每條 rule 給指紋(層數/分支度/Index數/主副線比)，相近指紋並列｜靠 PREBLOCK 統計特徵（vs 近似 hash=精確比對，此=粗特徵瀏覽）。
8. **欄位使用差異** — 兩 rule 用了哪些不同 DB 表/欄位（誰多吃一張表）｜靠 Database `COLUMN1` 集合差。

⭐ 本輪最 non-obvious：**#2 血緣形狀相似度**（比依賴子樹同構、抓「同邏輯改名」）、**#4 子集偵測**（一條 rule 完全包含另一條＝精簡/衍生關係）。

下一輪建議換：② 多 rule / workspace（第二圈）

## 2026-06-26 07:14 · 軸：① 解析單一 rule 內容（第二圈 · 進階）

> 第一圈①已做：def-use map/主線骨幹/結論→條件/依賴深度/分支摘要/聚合函式/常數側欄/結果值來源。本輪只收更深且不重複者。

1. **APF 條件原子化清單** — 把每個 Function 拆成最小比較式（`HOLD_RISK == "RISK"`、`TOOL_LIMIT < 3`）全列｜靠 parse APF cond（vs 分支摘要=計數）。
2. **變數「直接決定因子」** — 選一輸出變數，列直接影響它的第一層 cond 變數｜靠 clause cond `extractVars`（vs 血緣=全鏈，此=直接因子）。
3. **passthrough 變數偵測** — 找「只把上游值原封轉出、沒判斷」的 Function（THEN 是變數非字面值）｜靠 APF THEN ident vs literal。
4. **分支爆炸點** — 標條件組合最多的 Function（潛在最多路徑）｜靠 clause 數 × cond AND/OR 計數（不枚舉路徑）。
5. **單 rule 內多次定義** — 同名變數被多個 Function 定義（如 `disablereason`）→ 標覆寫鏈｜靠 Function `KEY` 重複 + `BLOCK_SEQ` 順序。
6. **條件列舉值字典** — 從 `var == "X"` 收集每個變數被比的所有列舉值（`HOLD_RISK`→{RISK,WATCH,OK}）｜靠 parse cond 比對（vs 結果值來源=THEN 側，此=cond 側）。
7. **Function I/O 簽名表** — 每個 Function 列「輸入變數 → 輸出變數」當簽名，整條 rule 像一組 signatures｜靠 `KEY`(out) + deps(in)。
8. **註解 vs 邏輯並列核對** — `/* 註解 */` 與其 Function 並列，方便人工核對「說的＝做的？」（只並列、不判斷）｜靠 comment token + VALUE。

⭐ 本輪最 non-obvious：**#3 passthrough 變數偵測**（揪只轉手不判斷的 Function、可簡化候選）、**#6 條件列舉值字典**（從條件側反推變數的有效值域）。

下一輪建議換：④ 比較與跨 rule 關係（第二圈）

## 2026-06-26 06:44 · 軸：⑤ 圖的視覺化呈現方式（第二圈 · 進階）

> 第一圈⑤已做：泳道/主副線/[$LOG$]badge/Index匯流/legend/複雜度熱圖/LOD/minimap。本輪只收進階且不重複者。

1. **fish-eye 焦點放大鏡** — 滑鼠處 block 連續放大、周邊縮小，大圖局部細看不失全局｜靠 POSX/POSY 距離縮放（vs LOD 分級，此連續魚眼）。
2. **依「離結論距離」著色** — block 按「到最近 `[$LOG$]` 幾跳」漸層上色，越近決策越亮｜靠 `[$LOG$]` triggers + PREBLOCK 反向距離（vs 複雜度熱圖=不同度量）。
3. **變數血緣絲帶（ribbon）** — 選一變數沿它流經的 block 畫一條高亮絲帶（非單純亮節點）｜靠 deps 鏈 + 邊路徑。
4. **群組摺疊成超級節點** — 把整條 G1/G1X 副線摺成一個群組節點，展開才看內部，主線更清爽｜靠 `BLOCK_GROUP` 聚合 + 進出邊重接。
5. **edge bundling 邊束** — 多條平行依賴邊聚成束，降低大圖連線雜亂｜靠 PREBLOCK 邊幾何聚合。
6. **群組小倍數（small multiples）** — 旁邊一排各 `BLOCK_GROUP` 迷你縮圖，點擊聚焦｜靠 BLOCK_GROUP 分群 render。
7. **深度等高線背景** — 背景淡色等高線標拓樸深度層（root…第N層），看資料流幾層｜靠 PREBLOCK 深度。
8. **`[$LOG$]` 影響暈染** — 點一個 reason，把所有「會影響它」的 block 用同色暈染成區域（非單純連線）｜靠 ancestors 集合 + 區域著色（vs 第一圈 badge）。

⭐ 本輪最 non-obvious：**#2 依離結論距離著色**（用「到決策幾跳」導引注意力到關鍵 block）、**#4 群組摺疊成超級節點**（副線收成一點、馴服大圖複雜度）。

下一輪建議換：① 解析單一 rule 內容（第二圈）

## 2026-06-26 06:14 · 軸：② 多 rule / workspace / session 工作流

> 避開 seed（分頁/split/側欄/session restore/跨tab搜尋）與 ⑧（per-rule 記憶）、⑨（分享）、⑫#7（tab groups）。本輪＝多 rule 之間的工作流串接。

1. **跨已開 rule 變數聯動** — tab A 選一變數，其他已開 tab 自動標出同名變數位置｜靠 `KEY` 跨開啟 rule 比對（vs 跨tab搜尋 seed=找字串，此=選一個即時聯動高亮）。
2. **具名工作區（workspace）** — 一組 rule 存成「本週查的案子」，一鍵全開還原 tabs+視角｜靠 deep-link state 集合（vs session restore=自動還原上次，此=具名存多組）。
3. **rule 巡檢佇列** — 排一串待看 rule 成佇列，看完打勾→下一條，跨 rule 不漏看｜靠 rule 清單 + 進度狀態（接 ③#6 但跨 rule）。
4. **開啟過多自動分組** — tab 太多時依 phase/group 自動分組/提示，避免迷失｜靠 `PHASE`/`BLOCK_GROUP` 聚合（vs ⑫#7 借瀏覽器，此=自動策略）。
5. **「相關 rule」側欄推薦** — 看某 rule 時側欄列「共用變數/表的其他 rule」可一鍵開新 tab｜靠 ④ 共享變數交集（把跨 rule 關係變成 workspace 入口）。
6. **N 欄並排 grid** — 不只 2 欄 split，3-4 條 rule grid 並排掃視｜靠 workspace 多 pane（vs split seed=2 欄）。
7. **tab hover 預覽** — hover rule tab 不切換就浮窗預覽縮圖/結論字典｜靠 deep-link state + 縮圖 render（接 ⑫#8 peek 但對 tab）。
8. **session 活動時間軸** — 記錄本 session 看過的 rule/block 順序，可回放/跳回（工作軌跡）｜靠瀏覽歷史 stack（vs ⑧#3 最近看過=清單，此=有序時間軸+回放）。

⭐ 本輪最 non-obvious：**#1 跨已開 rule 變數聯動**（選一變數、所有開啟 tab 同步亮，跨文件變數追蹤）、**#5「相關 rule」側欄推薦**（把跨 rule 共享變數關係變成主動發現入口）。

下一輪建議換：第一圈已走遍 12 軸（96 點）。第二圈建議從 ⑤ 或 ② 深挖；或先請我把 96 點收斂成優先級彙整（報酬可能遞減，可考慮停 loop）。

## 2026-06-26 05:44 · 軸：① 解析單一 rule 內容

> 全靜態，不評估真值。與種子（決策樹攤平/結論字典/輸入需求/變數血緣）及 ⑦ glossary 區別已標。

1. **變數讀寫圖（def-use map）** — 每個變數在哪 block 寫(定義)、哪些 block 讀(引用)，input vs computed 分類｜靠 Function `KEY`(def) + APF 引用(use)（vs ⑦ glossary=釋義，此=讀寫關係）。
2. **主線骨幹萃取** — 只抽 `BLOCK_GROUP=MAIN` 的 Function 鏈、副線收起，看「核心決策流」｜靠 BLOCK_GROUP + PREBLOCK（vs 種子決策樹攤平=展平結構，此=過濾副線）。
3. **結論 → 條件全文表** — 每個 `[$LOG$]` 列出觸發它的 IF 條件原文（只列、不評估）｜靠 `[$LOG$]` + clause cond 抓取（vs 結論字典=只列名稱）。
4. **變數依賴深度標註** — 每個變數標「離原始 DB 欄位幾跳」，越深越難懂｜靠 deps 遞迴計數到 root。
5. **APF 分支結構摘要** — 每個 Function 摘「N 分支 → 哪幾個結果值」（IF/ELSE-IF 數 + THEN 結果集）｜靠 parse APF clauses（vs ⑤#6 複雜度=視覺熱圖，此=文字摘要）。
6. **聚合函式使用清單** — 列 `COUNT/SUM/AVG/MAX` 用在哪些 block/欄位（暗示資料量需求）｜靠 parse VALUE function token。
7. **單 rule 常數/門檻側欄** — 這條 rule 內所有字面值門檻（120、3、"HIGH"…）集中列、看調參點｜靠 tokenize VALUE literal（vs hardcode 清冊=全廠批次⑥/⑪，此=單 rule 即時側欄）。
8. **變數可能值來源** — 選一變數，列出所有「會賦予它的 THEN 結果字面值」集合（不評估哪個發生）｜靠 Function THEN 結果 parse。

⭐ 本輪最 non-obvious：**#1 變數讀寫圖**（rule 版的 IDE find-references，def 與 use 一圖看清）、**#8 變數可能值來源**（靜態收集一個變數所有可能被賦的值，不執行）。

下一輪建議換：② 多 rule / workspace / session 工作流（唯一還沒正式跑過的軸）

## 2026-06-26 05:14 · 軸：⑥ 稽核 / 品質 / lint（純讀）

> 全靜態，不評估條件真值（死分支/衝突/覆蓋已排除）。把種子「拓樸鐵則 lint」拆成具體子檢查。

1. **註解覆蓋率（按複雜度加權）** — 哪些 Function 沒 `/* */` 說明、且複雜度高（最該標卻沒標）｜靠 parse VALUE comment + 運算子計數。
2. **命名規範檢查** — `KEY` 全大寫、Index 以 `IDX_` 開頭、Database 表別名格式…不符就標｜靠 `KEY`/`BLOCK_NAME` pattern。
3. **孤兒/斷尾盤點** — 斷尾 block（已有偵測）＋ 引用不存在變數處，整理成清單｜靠 `findDeadBranchBlocks` + roots。
4. **空殼/無效列** — VALUES 全空的 block、`COLUMN1` 列了欄但 APF 沒引用（精確到行）｜靠 dataTransform 規則 + APF 引用（vs 種子「沒用欄位」細化到列）。
5. **PREBLOCK 完整性** — 指向不存在的 block、Function 卻 2 PREBLOCK、Index 卻只 1 PREBLOCK｜靠 PREBLOCK + `BLOCK_TYPE` 對照 §5b。
6. **`[$LOG$]` 衛生** — 產 log 的 block `KEY`≠`disablereason`、副線冒出 `[$LOG$]`、重複 reason 名｜靠 `[$LOG$]` + `BLOCK_GROUP` + `KEY`（§5b）。
7. **VALUE1~5 連續性/空白行** — VALUE 中間夾 null（合併會生空白行）、空字串 `""`｜靠 VALUE1~5 原始陣列檢查（呼應合併規則 §0.2）。
8. **規模門檻警示** — 單 Function 條件數/巢狀超標、單 rule block 數爆量 → 紅旗清單（純計數）｜靠 parse 計數 + `BLOCK_TYPE` 統計。

⭐ 本輪最 non-obvious：**#7 VALUE1~5 空白行檢查**（抓 `\n` 合併產生的隱形 null-gap artifact，§0.2）、**#1 註解覆蓋率按複雜度加權**（只揪「最該標卻沒標」的 Function）。

下一輪建議換：① 解析單一 rule 內容（最後一軸）

## 2026-06-26 04:43 · 軸：④ 比較與跨 rule 關係

> 只做「結構比對」，刻意避開需評估邏輯的衝突/遮蔽/覆蓋分析（違反不跑演算法）。與 ⑪ 區別：⑪=批次報表、本輪=互動比較視圖。

1. **兩 rule side-by-side 結構 diff** — 並排標出 block/變數/`[$LOG$]` 的增刪改（結構比對，不評估邏輯）｜靠 `BLOCK_NAME`/`KEY`/PREBLOCK 集合比對（split 種子=並排看，此=diff 標記）。
2. **同變數跨 rule 對照** — 選 `CONSTRAINT_FLAG`，並排看它在不同 rule 的 APF 定義差異｜靠 Function `KEY` 跨 rule 抓 + 文字 diff。
3. **近似/重複 rule 偵測** — 用 `BLOCK_TYPE` 序列 + PREBLOCK 結構 hash 找高相似 rule（copy-paste）｜純結構 hash、不評估。
4. **共用片段偵測** — 找多條 rule 共用的相同 APF 片段 / 子拓樸（macro 抽取候選）｜靠 APF 文字 + 子圖比對。
5. **版本快照結構 diff** — 同 rule 兩個 `CLAIM_TIME` 時間點的結構差異表｜靠 `CLAIM_TIME` + block 集合比對。
6. **共享變數關係圖** — 畫「rule 之間靠哪些共同變數/表相連」的圖（哪些 rule 是一掛）｜靠 `KEY`/Database 跨 rule 交集。
7. **rule × table 互動矩陣** — rule(列) × 來源表(欄) 引用矩陣熱圖，點格跳該引用｜靠 Database `KEY` 聚合（互動版，非 ⑪ 報表）。
8. **同 reason 跨 rule 觸發對照** — 同一 `disablereason` 在不同 rule 的觸發條件片段並排看一致性｜靠 `[$LOG$]` + 條件片段抓取（不評估真值）。

⭐ 本輪最 non-obvious：**#4 共用片段偵測**（跨 rule 找可抽 macro 的相同子拓樸）、**#6 共享變數關係圖**（用共同變數把 rule 連成「家族」圖）。

下一輪建議換：⑥ 稽核 / 品質 / lint（純讀）

## 2026-06-26 04:13 · 軸：③ 導航與定位

> 與既有區別：minimap=⑤#8、breadcrumb/go-to-symbol/local graph=⑫、常駐側欄=種子。本輪聚焦「在圖內移動/定位」。

1. **PREBLOCK 鍵盤走訪** — 選中 block 用方向鍵沿上下游跳（↑上游 ↓下游、←→ 切主/副線來源）｜靠 PREBLOCK 邊。
2. **跳到變數定義 / 引用** — 點某變數 → 跳定義它的 Function；或列出所有引用它的 block 逐一跳｜靠 Function `KEY`(def) + APF 引用(use)。
3. **「跳到結論」清單** — 列所有 `[$LOG$]` 產出 block，點一下飛過去（即時導航，非 ⑪ 報表）｜靠 `[$LOG$]` 掃描 + `focusBlockById`。
4. **群組快速跳** — 列 MAIN/G1/G1X，點群組置中該群 bounding box｜靠 `BLOCK_GROUP` 聚合。
5. **回到起點/終點** — 一鍵跳主線資料源(root `DB_MAIN`) 或終端 `DispatchScreen`｜靠 roots + sink。
6. **巡檢：下一個未看過的 block** — Tab 帶你走訪還沒展開/看過的 block，確保不漏看｜靠瀏覽狀態 + 拓樸順序。
7. **依 BLOCK_SEQ 邏輯順序導覽** — 按 seq 上一個/下一個（靠邏輯次序而非空間位置）｜靠 `BLOCK_SEQ`(DB NUMBER)。
8. **空間錨點 + 回跳（vim mark）** — 設標記點，大圖遊走後一鍵彈回標記 block｜靠 block id + 視窗座標暫存。

⭐ 本輪最 non-obvious：**#6 巡檢未看過 block**（coverage 導向導航，保證不漏看）、**#8 空間錨點回跳**（大圖 vim-mark 式定位）。

下一輪建議換：④ 比較與跨 rule 關係

## 2026-06-26 03:44 · 軸：⑧ 狀態記憶與個人化

1. **偏好持久化** — 記住 icon 模式(Modern/Classic)、面板寬度、收合狀態，重整還原｜靠現有 useState → localStorage（UX 體檢 V5）。
2. **每條 rule 記住上次視角** — 回到某 rule 還原上次縮放/選取/展開的 tracker 鏈（非全域 session，是 per-rule）｜靠 per-rule key 存 view state（deep-link 已有部分）。
3. **私人「最近看過」清單** — 自動記最近開的 rule + block，快速回去（私人，與 ⑨ 分享無關）｜靠 localStorage history。
4. **書籤/收藏** — 釘選常看 rule / 特定 block / 變數，跨 session 保留｜靠 `BLOCK_NAME`/變數當 key。
5. **個人化預設 FAB/Phase** — 記住最常用 fab/phase 自動帶入，省每次選｜靠 `selectedFab/selectedPhase` 存偏好（呼應 FAB 假選擇 R1）。
6. **記住右側分頁偏好** — 習慣停 Viewer/Tracker/Var Impact 哪個就預設停那｜靠 `rightTab` 存偏好。
7. **per-rule 私人筆記草稿** — inspector 的就地編輯/已知變數草稿重開還在（私人、不分享、不改 rule）｜靠 localStorage 綁 rule+block（現有就地編輯目前不存）。
8. **個人檢視偏好** — 記主題色/字級/邊線密度等｜靠 design-tokens + 偏好存儲。

⭐ 本輪最 non-obvious：**#2 每條 rule 記住上次視角**（per-rule 視角記憶，超越全域 session restore）、**#7 per-rule 私人筆記草稿**（持久化現有但會丟失的就地編輯，且仍不碰 rule 資料）。

下一輪建議換：③ 導航與定位

## 2026-06-26 03:14 · 軸：⑪ 從原始資料批次報表

> 全部跨 rule 聚合、純讀；與既有 single-rule 種子（結論字典、沒用欄位、輸入需求）區別在「跨所有 rule 彙總」。

1. **跨 rule 變數字典** — 掃所有 rule 的 Function `KEY`，產「變數 → 哪些 rule 用、各自定義」總表｜靠 Function `KEY` 跨 rule 聚合（vs ⑦ 單 rule glossary）。
2. **disable reason 總目錄** — 掃全廠 `[$LOG$]`，列「所有 disable reason + 出現在哪些 rule」｜靠 `[$LOG$]` 聚合（vs 種子「結論字典」單 rule）。
3. **table/欄位使用熱度表** — 每張來源表(`Database KEY`)、每個欄位(`COLUMN1`)被多少 rule/block 引用｜靠 Database `KEY` + `COLUMN1` 聚合。
4. **rule 規模統計** — 每條 rule 的 block/Function/Index 數、主副線數、最大深度 → 排行｜靠 `BLOCK_TYPE` 計數 + PREBLOCK 深度。
5. **Index join 總表** — 全廠所有 Index：主/副線來源、join key、插入欄，一張表盤點｜靠 Index `COL1/COL2` + `VALUE` + 2 PREBLOCK 聚合。
6. **變數命名歧異報表** — 跨 rule 找同概念多寫法（`CONSTRAINT_FLAG` vs `CONSTR_FLAG`）｜靠 `KEY`/變數 fuzzy 分群。
7. **phase × group 覆蓋矩陣** — 哪些 phase 有哪些 rule、各 `BLOCK_GROUP` 結構分布｜靠 `PHASE` + `RULE_NAME` + `BLOCK_GROUP` 聚合。
8. **陳舊度報表** — 用 `CLAIM_TIME` 列最久沒動/最近改的 rule，找陳舊或熱點｜靠 `CLAIM_TIME` 排序聚合。

⭐ 本輪最 non-obvious：**#3 table/欄位使用熱度表**（改表前先看「動這欄會影響哪些 rule」）、**#8 陳舊度報表**（複用 `CLAIM_TIME` 找沒人維護的 rule）。

下一輪建議換：⑧ 狀態記憶與個人化

## 2026-06-26 02:44 · 軸：⑫ 類比借用（VS Code / 瀏覽器 / Figma / Excel / Obsidian）

1. **VS Code 麵包屑** — 頂部 phase ▸ rule ▸ group ▸ block 階層麵包屑，點任一層跳轉｜靠 `BLOCK_GROUP` + PREBLOCK 階層。
2. **瀏覽器導航史** — 在 block 間跳轉後可「上一步/下一步」回到剛剛看的 block｜靠選取歷史 stack。
3. **VS Code Go-to-Symbol** — 快捷鍵叫出此 rule 所有變數/block 的模糊跳轉清單｜靠 `KEY` + `BLOCK_NAME`。
4. **Obsidian local graph** — 選一個 block 只看它的「鄰域子圖」（上下游 N 跳），不被全圖淹沒｜靠 PREBLOCK ancestors/descendants。
5. **Excel 凍結窗格 + 篩選排序** — block 清單表凍結欄、按 type/group/seq 篩選排序｜靠 RuleData 欄位。
6. **Figma 簡報/觀眾模式** — 唯讀展示跟隨講者視角（不執行、不改）｜靠 deep-link state 廣播。
7. **瀏覽器分頁群組** — 多 rule 分頁可分群上色（同案子一群）｜靠 ② workspace（與單純「分頁」seed 差在分群）。
8. **IDE Peek 浮窗** — 不離開當前 block，浮窗偷看上游 block 內容｜靠 PREBLOCK + inspector 浮窗。

⭐ 本輪最 non-obvious：**#4 Obsidian local graph**（鄰域子圖，破解大圖淹沒）、**#8 IDE Peek 浮窗**（原地偷看上游、不跳走）。

下一輪建議換：⑧ 狀態記憶與個人化

## 2026-06-26 02:44 · 軸：⑩ 匯出與整合

1. **選取子圖 → Mermaid 匯出** — 框選一段 block 匯成 Mermaid flowchart 貼進文件/PR｜靠 blocks + PREBLOCK 邊轉 Mermaid。
2. **rule → Markdown 規格文件** — 整條 rule 匯成結構化 .md（block 表 + 結論字典 + 輸入需求）｜靠 RuleData + `[$LOG$]` + roots。
3. **變數/結論清單 → CSV/Excel** — 匯出變數表、disable reason 表給非工程同事｜靠 Function `KEY` + `[$LOG$]` 掃描。
4. **子圖 → PNG/SVG 截圖** — canvas 選區匯成圖檔貼簡報｜靠現有 `drawBlocks` render。
5. **APF → 偽碼/決策表匯出** — 把 Function 的 IF/THEN 轉成可讀偽碼或決策表（純轉格式、不執行）｜靠 parse APF clauses。
6. **依賴清單 → JSON / DOT** — 匯出 block→block 邊給外部圖工具（Graphviz）｜靠 PREBLOCK 拓樸。
7. **嵌入式連結（embed）** — 產嵌入碼把某 rule 唯讀視圖嵌進 Notes/wiki｜靠 deep-link state + 唯讀渲染（接既有 Notes 站）。
8. **來源表匯出整合** — Database/Import block 的「View Data」串既有 GeneralTable/Import endpoint，匯出該表 CSV｜靠 `KEY`(表名) + 既有 endpoint。

⭐ 本輪最 non-obvious：**#5 APF → 偽碼/決策表**（把邏輯轉成非工程能讀的格式、純轉換不執行）、**#7 嵌入 Notes wiki**（跨既有 app 整合）。

下一輪建議換：⑪ 從原始資料批次報表

## 2026-06-26 01:43 · 軸：⑨ 協作 / 分享 / 交接

1. **唯讀分享快照** — 產含到期的唯讀連結，對外/跨團隊展示某 rule 的某視角、免登入內網｜靠現有 deep-link URL state（fab/phase/rule/log/mode/var）token 化。
2. **block 附註層（annotation）** — 在 block 上貼便利貼（「這條約束待確認」），存成獨立可分享層，**不碰 rule 資料**｜靠 `BLOCK_NAME` 當錨點、附註層外掛。
3. **交接包（handoff bundle）** — 一鍵打包「rule + 我的視角 + 註解 + 結論字典」成一份可交付文件｜靠 deep-link state + annotation + `[$LOG$]` 掃描。
4. **討論串綁 block/變數** — 針對某 block 或變數開 comment thread，討論不離 context｜靠 `BLOCK_NAME` / 變數名當 thread key。
5. **「看這個」精準指向連結** — 連結開 rule 後自動選取+置中某 block（「看 `FUNC_S1B`」）｜擴充現有 deep-link（已有 log 參數 + `focusBlockById`）加 block 參數。
6. **CLAIM_TIME 變更通知** — 訂閱某 rule，`CLAIM_TIME` 變了就提醒「這條被改過」，交接後不漏更新｜靠 `CLAIM_TIME`(Rule 層級最後更新) 比對。
7. **審閱模式（review）** — 對 rule 標「已審/有疑問」+ 逐 block checklist，交接時知道誰看過哪些｜靠 `BLOCK_NAME` checklist 疊加層。
8. **匿名化分享（mask）** — 分享時遮罩敏感變數/表名，對外只露拓樸結構不洩業務｜靠顯示層 token 化 `KEY`/`COLUMN`/變數名（不改原始資料）。

⭐ 本輪最 non-obvious：**#2 block 附註層**（註解外掛在 BLOCK_NAME 上、與 rule 資料解耦，守住不修改 rule）、**#6 CLAIM_TIME 變更通知**（直接複用既有最後更新時間欄做訂閱）。

下一輪建議換：⑩ 匯出與整合

## 2026-06-26 01:13 · 軸：⑦ onboarding / 解釋性

1. **「這個 block 在幹嘛」一句話摘要** — 選/hover block 時依 type 自動生成人話（「Function：算出 `HOLD_RISK`，看嚴重度/狀態/約束」）｜靠 `BLOCK_TYPE` + `KEY` + 純讀 parse VALUE 取條件變數。
2. **APF 註解 → 官方說明層** — 把 VALUE 裡的 `/* 治具/預約約束程度 */` 抽出來當每個 block 的正式說明顯示｜靠 parse VALUE 的 comment token（`apfParse` 已分 comment 類）。
3. **變數詞彙表（glossary）** — 自動列這條 rule 所有變數 + 在哪定義 + 取註解當釋義（`CONSTRAINT_FLAG`=約束程度…）｜靠 Function `KEY` + deps + comment。
4. **「rule 故事」導讀順序** — 依拓樸自動排閱讀順序（DB→Function→Index→reason→DS），新手照順序讀，非自己亂點｜靠 PREBLOCK topo sort（與「決策樹攤平」不同：這是閱讀動線非結構展平）。
5. **首次導覽 guided tour** — spotlight 帶看四站「資料源 / 判斷 / 結論 / 收尾」｜靠 `TYPE_CATEGORY`(input/function/output) + DispatchScreen sink。
6. **RTD 黑話 tooltip** — PREBLOCK / Index join / `disablereason` / `[$LOG$]` hover 給定義｜靠固定術語表對應資料模型概念。
7. **「為什麼有這個 block」反向說明** — 選 block → 一句話說它的輸出被哪些下游用，消除孤立感｜靠變數被引用 + PREBLOCK 反向（純拓樸）。
8. **群組意義導覽** — 解釋 MAIN/G1/G1X 各是主線/副線/副副線（文字說明，非視覺分帶）｜靠 `BLOCK_GROUP` 命名 + §5b 拓樸規則（與⑤#1 泳道分層區別：那是視覺、這是釋義）。

⭐ 本輪最 non-obvious：**#2 APF 註解 → 說明層**（把 code 註解變使用者文件，零額外維護）、**#7「為什麼有這個 block」反向說明**（從下游回答存在理由）。

下一輪建議換：⑨ 協作 / 分享 / 交接

## 2026-06-26 00:32 · 軸：⑤ 圖的視覺化呈現方式

1. **BLOCK_GROUP 泳道分層**（swimlane）— 用 group 把畫布切成主線/副線/副副線水平帶，一眼看層級結構｜靠 `BLOCK_GROUP`(MAIN/G1/G1X) + `POSY` 分帶。
2. **主/副線邊視覺區分** — primary PREBLOCK 實線粗、secondary 虛線細，副線匯入一眼可辨｜靠 `Arrow.isPrimary / isMainLine`（已有資料、未在視覺上強化）。
3. **`[$LOG$]` 產出點角標** — 會產 disable reason 的 block 加 badge（reason 數），掃一眼知道「結論」散在主線哪幾個 block｜靠掃 VALUE 的 `[$LOG$]` + `KEY="disablereason"`。
4. **Index 匯流圖示** — Index 這種「兩線匯一點」的 block 用 Y 形匯流 icon，標主線/副線入口埠｜靠 Index 的 2 個 PREBLOCK + `COL1/COL2`。
5. **常駐 legend + 類別篩選** — 角落固定 input/tableop/function/output 四色圖例，點色塊只亮該類、其餘淡化｜靠 `TYPE_CATEGORY` 四分類（已有，缺圖例與篩選）。
6. **複雜度 heatmap overlay** — 用 block 底色深淺表示該 Function 條件複雜度（AND/OR 數、巢狀深度），紅=最該注意，空間化「哪裡最難懂」｜靠純讀 parse VALUE 數運算子（不執行）。
7. **縮放分級顯示（LOD）** — 縮小時 block 收成 group 色塊+數量、放大才顯 icon+label，大圖不糊不卡｜靠 zoom level + `BLOCK_GROUP` 聚合。
8. **mini-map 縮圖導航** — 角落全圖縮圖 + 目前視窗框，長鏈大圖不迷路｜靠 blocks 的 `POSX/POSY` 範圍。

⭐ 本輪最 non-obvious：**#6 複雜度 heatmap overlay**（把抽象複雜度變成畫布熱區）、**#1 BLOCK_GROUP 泳道分層**（改用 group 重新分帶，而非只吃原始 POSX/POSY）。

下一輪建議換：⑦ onboarding / 解釋性
