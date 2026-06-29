---
title: RTD RuleViewer 優先級 backlog — 192 點發想的收斂
status: draft
created: 2026-06-26
modules: [frontend, backend]
kind: 收斂彙整（從 rule-viewer-idea-log.md 的 192 點挑出該先做的；全 read-only、不改 rule、不跑演算法）
source: rule-viewer-idea-log.md（12 軸 ×2 圈 = 192 點）
---

# RuleViewer 優先級 backlog 🎯

整夜 24 輪、192 點發想（[idea log](rule-viewer-idea-log.md)）的收斂。
**最大發現：192 點其實坐在 5 塊地基上。** 蓋好地基，大半功能變成「接上去」的薄層。
所以這份不照軸排，照「**先蓋什麼、它解鎖什麼**」排。

---

## 一、5 塊地基（蓋一次、大量功能受惠）

| 地基 | 是什麼 | 解鎖了哪些 log 點子 | 成本 |
|---|---|---|---|
| **F1 · APF parser → AST**（最高槓桿）| 把 `VALUE` parse 成一棵 clause AST，全站共用，不再到處 re-parse | 決策樹攤平、條件原子化、結果值域、聚合函式清單、複雜度、偽碼匯出、大半 lint | 🟡 M |
| **F2 · 跨 rule 索引層** | 把所有 rule 抽成可查詢索引（變數/表/[$LOG$]/拓樸）| 變數字典、where-used、table 熱度、影響清單、近似偵測、共享變數圖、lint roll-up | 🟡 M |
| **F3 · deep-link 擴充**（已存在、只擴）| 現有 URL state 已存 fab/phase/rule/log/mode/var | 唯讀分享快照、精準指向連結、導覽錄製、embed、session restore | 🟢 S |
| **F4 · annotation 層**（BLOCK_NAME 錨、與 rule 解耦）| 外掛在 block 上、不碰 rule 資料 | 附註、討論串、審閱模式、交接包、watchlist | 🟡 M |
| **F5 · 偏好持久化**（localStorage）| 一個 `usePersistentState` | 全部 ⑧ 個人化、icon/面板/主題記憶（修 UX 體檢 V5）| 🟢 S |

> F1 + F2 是真正的護城河地基——RTD 領域知識編進去後別人抄不走。**強烈建議第一波就做這兩塊。**

---

## 二、Top 12 該做的（每個都打包了多個 log 點子）

🟢S/🟡M/🔴L＝成本；lens＝護城河/複利/日常痛點/快贏

| # | 項目 | lens | 打包的 log 點子 | 靠什麼 | 成本 |
|---|---|---|---|---|---|
| 1 | **決策樹攤平 + 結論字典**（一條 rule 在說什麼）| 護城河 | ①決策樹、③跳結論、⑦rule總結 | F1 + `[$LOG$]` | 🟡 |
| 2 | **影響半徑 / where-used**（改這欄/變數會炸到誰）| 日常痛點 | ⑪table熱度、⑩影響清單給變更單、③輸入欄位使用點 | F2 | 🟡 |
| 3 | **拓樸鐵則 lint + Problems 面板**（保證正式資料乾淨）| 日常痛點 | ⑥全部、⑫#1 Problems、⑪lint roll-up、BLOCK_CODE 檢查 | F1+F2 §5b | 🟡 |
| 4 | **多 rule 分頁 + 跨 tab 變數聯動**（你最初的點子）| 日常痛點 | ②分頁、split、跨tab變數聯動、相關rule推薦 | F3 | 🟡 |
| 5 | **hardcode / 常數清冊**（調參點一覽）| 日常痛點 | ①常數側欄、⑥hardcode、⑪變數命名歧異 | F1 | 🟢 |
| 6 | **唯讀分享快照 + 精準指向連結** | 複利 | ⑨#1快照、⑨#5精準連結、⑨導覽錄製 | F3 | 🟢 |
| 7 | **APF 註解 → 說明層**（零維護的使用者文件）| 快贏 | ⑦#2註解層、⑦glossary、⑦結論釋義 | F1 comment token | 🟢 |
| 8 | **變數 watchlist**（跨任何 rule 自動高亮，像 debugger）| 日常痛點 | ⑧#5 watchlist、③跳引用 | F4 | 🟡 |
| 9 | **視覺快贏組**：深色主題 + legend 篩選 + minimap + breadcrumb | 快贏 | ⑤legend/minimap、⑫breadcrumb、UX 體檢主題 | design-tokens | 🟢 |
| 10 | **偏好持久化**（icon/面板/主題/分頁記憶）| 快贏 | ⑧#1、UX 體檢 V5 | F5 | 🟢 |
| 11 | **複雜度 + 離結論距離 著色 overlay**（哪裡最該注意）| 護城河 | ⑤複雜度熱圖、⑤離結論距離、①分支爆炸點 | F1 | 🟡 |
| 12 | **跨 rule 變數字典 + 共享變數關係圖**（rule 家族）| 複利 | ⑪變數字典、④共享變數圖、④近似偵測 | F2 | 🟡 |

---

## 三、建議的第一波（蓋地基 + 3 個立即有感）

1. **先蓋 F1（APF AST）+ F2（跨 rule 索引）** — 兩塊地基，之後 #1/#2/#3/#5/#11/#12 全部變薄層。
2. 接著做這 3 個立即有感、成本低的：
   - 🟡 **#1 決策樹攤平 + 結論字典** — 直接回答「這條 rule 到底在幹嘛」，護城河。
   - 🟡 **#2 影響半徑 / where-used** — 接 Oracle 後天天用、最省命的稽核。
   - 🟢 **#7 APF 註解 → 說明層** + **#9 視覺快贏** — 低成本、CP 值最高的「看起來高級又好懂」。

---

## 四、刻意不做（守住你的鐵則）

- ❌ 修改 rule（編輯、批次取代）
- ❌ 跑 rule 演算法（what-if、runtime 模擬、死分支/衝突/覆蓋——都需評估條件真值）
- 這些在 192 點發想時已全程排除。

## References
- 發想全庫：`rule-viewer-idea-log.md`（192 點、含每點資料來源與去重註記）
- 資料模型：`2026-06-25-block-data-model.md`（F1/F2 的欄位依據、§5b 拓樸鐵則、BLOCK_CODE 缺口）
- UX 體檢：`docs/ux-audit-operations-2026-06-25.md`（主題/focus/loading 等快贏）
- 方向藍圖：`2026-06-25-frontend-dream-blueprint.md`
