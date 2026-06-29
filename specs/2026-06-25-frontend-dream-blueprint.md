---
title: 前端夢想藍圖 — MyDevWeb / RuleViewer 開發方向許願清單
status: draft
created: 2026-06-25
updated: 2026-06-25
modules: [frontend, backend, infra, ai]
kind: vision / wishlist（非單一功能規格，是方向 backlog；不走 stub）
---

# 前端夢想藍圖 🌌

> 「盡可能幫助所有操作這個網站的人，盡可能榨乾所有創意。」
>
> 這份文件不是要全做，而是把**現有架構能長成的所有樣子**攤開來，當作未來幾年的選單。
> 每個點子都標了：**一句話 pitch｜幫到誰｜現有 stack 可行性 tier**。
> 挑的時候用文末的「優先級透鏡」過濾即可。

可行性 tier 定義（基於現有 stack，不引入第二套重量級框架的前提）：

- **🟢 T1**：現有依賴 + 幾天內可動的 PoC（純前端或薄後端）
- **🟡 T2**：要設計、要動後端 / 資料模型，或要引入一個輕量 lib
- **🔴 T3**：moonshot，要大改架構 / 自研引擎 / 重後端，但夢想就是要有遠的

---

## 0. 先講「為誰做」— 五種人

整份藍圖圍繞這五種操作這個網站的人。每個點子至少服務其中一種。

| 代號 | 人 | 他在這站想幹嘛 | 現在的痛 |
|---|---|---|---|
| 👁 **Reader** | 訪客 / 讀者 / 招募方 | 看 Notes、看 blog、看你的作品、看你會什麼 | 入口分散、沒導引、看完就走 |
| ✍️ **Author** | Vic 自己寫內容 | 寫筆記、連 wiki-link、整理知識 | 寫作在站外（編輯器），站內只能讀 |
| 🔍 **Analyst** | RTD rule 分析師 / 工程師 | 看懂規則拓樸、追 impact、查 case | 工具強但學習曲線陡、狀態難分享 |
| 🛠 **Maintainer** | Vic 自己維護 code | 加功能、debug、看站健康度 | 沒有站內 dashboard，靠 terminal |
| 🎮 **Player** | 來放鬆 / 被勾住的人 | Sudoku、玩具、互動 demo | 玩具只有一個，藏得深 |

---

## 1. RTD RuleViewer — 把皇冠級工具推到極限 🔍

> 這是全站最有護城河的東西（領域知識 + 力導向圖 + canvas 互動）。其他都可被取代，這個不行。

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 1.1 | **時間軸 / 版本 diff** | 兩個版本的規則圖疊圖，新增節點綠、刪除紅、改動黃，拉時間軸看演化 | Analyst | 🟡 |
| 1.2 | **影響半徑熱力** | 點任一節點，下游受影響節點按距離漸層上色（1 跳深、3 跳淺），秒懂「動這條會炸到哪」 | Analyst | 🟢 |
| 1.3 | **路徑追蹤 / 走查模式** | 給一筆 case 的輸入，動畫高亮它實際走過的 PREBLOCK → Function 路徑（呼應「Function 單一 PREBLOCK」鐵則）| Analyst | 🟡 |
| 1.4 | **規則健康度檢查器** | 自動掃 dead rule、循環依賴、孤兒節點、過深巢狀，列成「lint 報告」 | Analyst / Maintainer | 🟡 |
| 1.5 | **自然語言問規則** | 「哪些規則會影響核保結果？」→ LLM 把問題轉成圖查詢，高亮答案子圖 | Analyst | 🔴 |
| 1.6 | **可分享的圖狀態 deep-link** | 把目前的縮放 / 選取 / 篩選編碼進 URL，貼給同事打開就是同一視角（你已有 impact deeplink，擴成全圖狀態）| Analyst | 🟢 |
| 1.7 | **圖 → 文件匯出** | 一鍵把選取子圖匯成 Mermaid / PNG / PDF，貼進 PR 或規格文件 | Analyst / Maintainer | 🟢 |
| 1.8 | **mini-map + 麵包屑** | 大圖角落放縮圖導航 + 目前鑽取路徑麵包屑，解決「迷路在節點海」 | Analyst | 🟢 |
| 1.9 | **規則模擬器（what-if）** | 沙盒裡改一條規則的條件，即時預覽圖結構與 impact 變化，不碰真資料 | Analyst | 🔴 |
| 1.10 | **多圖佈局切換** | force / 階層（dagre）/ 環形 / 矩陣熱圖 四種佈局一鍵切，不同問題用不同視角 | Analyst | 🟡 |

---

## 2. Notes → 個人知識作業系統 🧠（做一個自己的 Obsidian Web）

> 你已經有 wiki-link + NoteGraph + markdown render。差「寫」和「活」。

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 2.1 | **站內編輯器** | 直接在站內寫 / 改筆記（Monaco 或 milkdown），即時預覽 + wiki-link 自動補全 | Author | 🟡 |
| 2.2 | **反向連結面板** | 每篇筆記底部列「哪些筆記連到我」，知識網真正雙向 | Author / Reader | 🟢 |
| 2.3 | **全站全文搜尋 + 模糊比對** | Cmd+K 喚出搜尋，標題 / 內文 / 標籤 fuzzy match，鍵盤直達（用 fuse.js，前端就能做）| 全部 | 🟢 |
| 2.4 | **語意搜尋（embedding）** | 「我之前寫過 k8s 滾動更新的東西嗎」→ 向量檢索找意思相近的筆記，不靠關鍵字 | Author / Reader | 🔴 |
| 2.5 | **知識圖譜進階** | NoteGraph 加：標籤分群上色、孤島偵測、最短路徑「這兩個概念怎麼連起來的」 | Author | 🟡 |
| 2.6 | **每日筆記 / Daily Note** | 進站一鍵開今天的 daily note，串成時間軸，當輕量 journal | Author | 🟢 |
| 2.7 | **Spaced-repetition 卡片** | 筆記裡 `?` 標記自動生成複習卡，間隔重複幫你記住自己寫的東西 | Author | 🟡 |
| 2.8 | **AI 筆記助理** | 選一段文字 → 摘要 / 找相關筆記 / 生成 wiki-link 建議 / 「幫我補這段」 | Author | 🔴 |
| 2.9 | **大綱 / TOC 浮動側欄** | 長文右側浮動目錄 + 閱讀進度條 + scroll-spy | Reader | 🟢 |
| 2.10 | **筆記發佈控制** | 草稿 / 公開 / 私人三態（你已有 `VITE_SHOW_PRIVATE`），公開的才進 sitemap | Author | 🟢 |

---

## 3. AI / LLM 整合 🤖（你是 LLM 框架的人，這是最自然的延伸）

> 你整個 LLMDevFramework 的方法論可以「吃自己的狗糧」，變成站上活的功能。

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 3.1 | **站內 Copilot 浮窗** | 右下角常駐 AI，問「這站有什麼」「帶我看 RTD 怎麼用」「這條規則在幹嘛」，能讀當前頁 context | 全部 | 🟡 |
| 3.2 | **規格 / CodeMap 生成器 UI** | 把你 LLMDevFramework 的 `/sdd`、CodeMap、`/kg` 做成站上可填表單 → 產 markdown 下載，給別人也能用你的方法論 | Reader / Maintainer | 🟡 |
| 3.3 | **Prompt 實驗室** | 貼 prompt → 串你的 prompt-principles 自動 self-check 給分 + 改寫建議（`/prompt-improve` web 版）| Reader | 🟡 |
| 3.4 | **SQL 自然語言互譯** | 「找出上個月所有失敗 case」↔ SQL 雙向，接 SQL Visualizer 直接畫出來 | Analyst | 🔴 |
| 3.5 | **筆記 → 教學自動生成** | 選幾篇相關筆記 → AI 串成一篇結構化教學（套 write-tutorial skill 的格式）| Author | 🔴 |
| 3.6 | **語音問答** | Web Speech API 唸問題、唸答案，通勤 / 免手操作模式 | 全部 | 🟡 |
| 3.7 | **AI 即時翻譯層** | 整站內容對 Reader 一鍵切英 / 日，履歷展示給海外看 | Reader | 🟡 |

> ⚠️ 安全護欄：所有 LLM 呼叫走後端代理（金鑰 NEVER 進前端，呼應 frontend CLAUDE.md），前端只拿 stream。

---

## 4. SQL Visualizer & 開發者工具箱 🛠

> 把零散小工具升級成「線上 dev 瑞士刀」，順便當技術展示。

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 4.1 | **SQL 執行計畫視覺化** | 貼 EXPLAIN PLAN → 畫成樹狀 / 火焰圖，標出 full scan 紅點 | Analyst | 🟡 |
| 4.2 | **SQL → ER 圖** | 從 query 推斷涉及的 table 關聯，自動畫 ER（接力導向圖引擎）| Analyst | 🟡 |
| 4.3 | **PL/SQL 拓樸圖** | 呼應 OracleSQL domain 的 RTD 拓樸：貼 package → 畫 procedure 呼叫圖 | Analyst | 🔴 |
| 4.4 | **Regex / Cron / JWT / Base64 玩具盤** | 一頁多個常用小工具，即時預覽，開發者天天用 | Maintainer / Reader | 🟢 |
| 4.5 | **JSON / YAML 互轉 + diff + 樹狀瀏覽** | 大 JSON 摺疊瀏覽 + 兩份 diff，接你 YAML Review 的場景 | Maintainer | 🟢 |
| 4.6 | **API 沙盒** | 站內打自家 API 的輕量 Postman，存 request 收藏 | Maintainer | 🟡 |
| 4.7 | **Tailwind Cheatsheet 升級成 playground** | 即時編 class 看效果 + 複製，現有 cheatsheet 加互動 | Maintainer / Reader | 🟢 |

---

## 5. 殼層 / 平台化 🏗（apps/blog、apps/devconsole 已是微前端雛形）

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 5.1 | **統一命令面板 Cmd+K** | 全站任何頁按 Cmd+K：跳頁 / 搜筆記 / 開工具 / 執行動作，鍵盤駕駛整站 | 全部 | 🟢 |
| 5.2 | **可拖拉儀表板首頁** | Homepage 變 widget 看板（最近筆記 / RTD 捷徑 / GitHub 活動 / 待辦），各人自訂 | Reader / Maintainer | 🟡 |
| 5.3 | **外掛式 app 註冊表** | 新工具只要丟進 `apps/` + 註冊 manifest 就自動出現在側欄，真正插件化 | Maintainer | 🟡 |
| 5.4 | **Module Federation** | blog / devconsole 真正獨立部署、獨立發版，主殼動態載入 | Maintainer | 🔴 |
| 5.5 | **devconsole 變站務後台** | 內容管理、feature flag 開關、使用統計，自己當自己的 admin | Maintainer | 🟡 |

---

## 6. 體驗 / 個人化 / 無障礙 ♿🎨

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 6.1 | **深色 / 淺色 / 護眼主題切換** | design-tokens 已是單一來源，加一層 theme switch + 跟隨系統 + 記憶 | 全部 | 🟢 |
| 6.2 | **可調主題色 / 多 brand** | 讓使用者選強調色，token 即時換（呼應 design-tokens 架構）| Reader | 🟡 |
| 6.3 | **全鍵盤可達 + a11y 過 WCAG AA** | focus ring、aria、跳至主內容、對比達標；力導向圖補鍵盤導航 | 全部（尤其輔具）| 🟡 |
| 6.4 | **i18n 中英雙語** | 介面 + 內容雙語，履歷國際化 | Reader | 🟡 |
| 6.5 | **動效編排** | 頁面轉場 / 圖節點入場用一致的 motion 設計（View Transitions API）| Reader | 🟢 |
| 6.6 | **首屏導覽（onboarding tour）** | 第一次來的人有 spotlight 導覽「這站有什麼、RTD 怎麼用」 | Reader / Analyst | 🟢 |
| 6.7 | **可讀性偏好** | 字級 / 行距 / 襯線切換、專注閱讀模式（隱藏側欄）| Reader | 🟢 |

---

## 7. 效能 / 離線 / PWA ⚡

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 7.1 | **PWA + 離線 Notes** | 裝成 app、離線讀已快取筆記，地鐵也能看 | Reader / Author | 🟡 |
| 7.2 | **大圖虛擬化 / WebGL 升級** | RTD 大圖節點上千時改 GPU 渲染（現有 force-graph 有 WebGL 模式可開）| Analyst | 🟡 |
| 7.3 | **預抓 / 智慧 prefetch** | hover 連結就預載該頁 chunk + SWR 資料，點下去即現 | 全部 | 🟢 |
| 7.4 | **效能預算 + Lighthouse CI** | build 時擋 bundle 膨脹 / 分數退步，接你現有 GitHub Actions | Maintainer | 🟡 |
| 7.5 | **圖片自動最佳化** | Notes 圖片自動 WebP / 多尺寸 / lazy + blur 佔位 | Reader | 🟢 |

---

## 8. 協作 / 社群 / 互動 👥

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 8.1 | **筆記留言 / 註記** | 登入者可在筆記段落留 inline 評論，知識共筆 | Reader / Author | 🟡 |
| 8.2 | **RTD 圖即時協作** | 多人同時看同一張圖、看得到彼此游標與選取（Yjs / WebSocket）| Analyst | 🔴 |
| 8.3 | **分享快照** | 任何視圖 → 生成唯讀分享連結（含到期），對外展示不洩內網 | Analyst | 🟡 |
| 8.4 | **訪客留言牆 / 反應** | 輕量「這篇有用 👍」+ 訪客提問，當作互動入口 | Reader | 🟢 |

---

## 9. 觀測 / 站務健康 📊（Maintainer 的儀表板）

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 9.1 | **站內 Status 頁** | 前端聚合 backend / DB / ArgoCD 健康，串你的 k8s infra | Maintainer | 🟡 |
| 9.2 | **前端錯誤回報** | ErrorBoundary 捕捉 → 上報 → 站務後台看趨勢（Sentry 或自建薄端點）| Maintainer | 🟡 |
| 9.3 | **隱私友善 analytics** | 自架輕量統計（哪些筆記熱門 / 跳出點），不靠 GA、不吃 cookie | Maintainer | 🟡 |
| 9.4 | **部署資訊浮水印** | footer 顯示 build version / commit / 環境（dev/stg/prod 一眼分辨）| Maintainer | 🟢 |

---

## 10. Moonshots / 玩心 🚀🎮（榨乾創意專區）

> 不一定有用，但會讓人記住這站、讓你做得開心。

| # | 點子 | Pitch | Tier |
|---|---|---|---|
| 10.1 | **「我的技能星圖」首頁** | 把技能 / 專案 / 筆記接成一張可探索的星座圖，滑鼠飛過去點亮，當作互動式履歷 | 🟡 |
| 10.2 | **RTD 規則玩成解謎遊戲** | 把「找出讓 case 通過的規則路徑」做成關卡，邊玩邊懂領域 | 🔴 |
| 10.3 | **Sudoku 宇宙** | Solver 升級成：每日挑戰 / 計時排行 / 解題步驟動畫 / 變體（殺手 / 對角）| 🟡 |
| 10.4 | **終端機彩蛋** | 按 `~` 喚出站內偽終端，打 `help` 列彩蛋指令、`open ruleviewer` 直達 | 🟢 |
| 10.5 | **生成式視覺背景** | 首頁用 canvas/WebGL 跑一個跟你 design-tokens 同色系的流體 / 粒子背景 | 🟢 |
| 10.6 | **時間旅行模式** | 用 git 歷史重播「這個站 / 這篇筆記怎麼長出來的」縮時 | 🔴 |
| 10.7 | **把整站做成可被 LLM 讀的 MCP server** | 開個 endpoint 讓別人的 Claude 直接查你的筆記 / 規則，你的知識變成可被 AI 調用的服務 | 🔴 |

---

## 11. 原始資料搜尋 / 稽核 / 資料品質 🔬（Analyst & Maintainer 的日常救命瑞士刀）

> 種子來自你：「比較**原始資料**的搜尋看有無 hardcode」。這一整類的共同精神是：
> **不看渲染後的漂亮圖，直接打底層 source-of-truth，做搜尋 / 比對 / 抓壞味道。**
> 力導向圖負責「理解」，這節負責「稽核與清理」。⭐ = 你點名的種子。

### 11a. 搜尋原始資料

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 11.1 | **全域原始資料搜尋（raw grep）** | 直接搜底層規則 / SQL 原文（非渲染後），支援 regex、整字、大小寫、欄位 / 類型篩選。回答「這個值 / 欄位 / table 到底散在哪些規則」 | Analyst | 🟢 |
| 11.2 ⭐ | **Hardcode 偵測器** | 掃原始資料抓寫死的字面值：magic number、寫死日期、env-specific ID、門檻值、寫死代碼，按類型分群。提示「`0.85` 在 12 條規則出現，建議抽成參數」 | Analyst / Maintainer | 🟡 |
| 11.3 ⭐ | **搜尋結果比較（diff search）** | 同一關鍵字在兩個來源各搜一次（dev↔prod、版本 A↔B、規則群 A↔B），並排 diff：誰多、誰少、同位置不同值 | Analyst | 🟡 |
| 11.4 | **字面值 / 常數清冊** | 自動抽出所有「看起來該是設定值」的字面值，集中成可搜尋清冊，當稽核底稿 / 抽參數的待辦 | Analyst | 🟡 |
| 11.5 | **搜尋收藏 + 命名查詢** | 把常打的稽核查詢存起來（「找所有寫死日期」），一鍵重跑、排程重跑 | Analyst | 🟢 |

### 11b. 比對與漂移

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 11.6 | **環境漂移報告（drift）** | dev / stg / prod 三環境原始資料差異總表：「prod 有 stg 沒有」「同名但內容不同」，部署前先抓出沒同步的規則 | Maintainer / Analyst | 🟡 |
| 11.7 | **規則 side-by-side diff** | 選兩條規則並排逐行高亮差異（GitHub diff 風），找 copy-paste 後忘了同步改的地方 | Analyst | 🟢 |
| 11.8 | **時間點快照比對** | 某日 snapshot ↔ 今天，列出期間所有變動（表格版的 §1.1，適合做交接 / 稽核軌跡） | Analyst | 🟡 |

### 11c. 壞味道 lint 與驗證

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 11.9 | **命名一致性檢查** | 同概念多種寫法（`cust_id` / `customerId` / `CUST_NO`）、不符規範的命名一次列出 | Analyst | 🟡 |
| 11.10 | **規則複雜度量表** | 每條規則的巢狀深度 / 條件數 / 依賴數 → 排行「最該重構的前 10 條」 | Analyst | 🟡 |
| 11.11 | **領域 lint 規則庫** | 像 ESLint 但對 RTD：禁 hardcode、必須有註解、條件數上限、PREBLOCK 拓樸違規…，CI 可擋 | Analyst / Maintainer | 🔴 |
| 11.12 | **樣本回放驗證** | 餵一批歷史 case → 跑規則 → 標出行為異常 / 跟期望不符的，當回歸測試 | Analyst | 🔴 |
| 11.13 | **預覽式批次取代** | 跨規則 find/replace（含 regex），先給 diff + impact 預覽，確認才套（NEVER 直接改） | Analyst | 🟡 |
| 11.14 | **稽核報告匯出** | 把上面任何掃描結果（hardcode / 漂移 / 命名）匯成 Excel / PDF，交付稽核或貼 PR | Analyst / Maintainer | 🟢 |

---

## 12. 跨規則關係分析 🕸（種子：「rule 之間的關聯」）

> 單條規則人人會看；難的是**規則「之間」的隱性關係**——誰遮蔽誰、誰跟誰其實是同一家、改 A 會不會讓 B 默默失效。
> 這節直接複用現有的力導向圖引擎，只是換一種「邊」的定義。⭐ = 你點名的種子。

| # | 點子 | Pitch | 幫誰 | Tier |
|---|---|---|---|---|
| 12.1 ⭐ | **交叉引用 where-used** | 點任一 table / column / Function / 常數 → 列出所有引用它的規則 + 一鍵跳轉。「動這個欄位前先看誰在用」 | Analyst | 🟢 |
| 12.2 ⭐ | **重複 / 近似規則偵測** | 用結構雜湊 + fuzzy 比對找 copy-paste 與高度相似規則，提示「這兩條 90% 像，可合併」 | Analyst | 🟡 |
| 12.3 ⭐ | **規則衝突偵測** | 找對同一情境給出**相反結論**、或條件重疊但結果不同的規則對，攤出矛盾 | Analyst | 🔴 |
| 12.4 ⭐ | **遮蔽 / 順序敏感分析（shadowing）** | 哪些規則被前面的規則攔截、永遠觸發不到（dead branch）；呼應 PREBLOCK 拓樸（先 Index join 再 Function 判斷） | Analyst | 🔴 |
| 12.5 | **覆蓋 / 缺口分析** | 條件空間有沒有「沒被任何規則覆蓋的洞」或「被重複覆蓋的區」，找漏網與冗餘 | Analyst | 🔴 |
| 12.6 | **規則親緣圖** | 以「相似度」當邊另畫一張圖，自動把規則分成家族群，看哪些規則本質上是一掛的 | Analyst | 🟡 |
| 12.7 | **共享依賴聚類** | 依「共用哪些 table / Function」自動分群規則，看模組邊界與耦合熱點 | Analyst / Maintainer | 🟡 |
| 12.8 | **規則 → 規則 影響鏈** | 超越單跳：改 A 連動 B、B 連動 C 的完整鏈路高亮（接 §1.2 影響半徑，但跨規則層級） | Analyst | 🟡 |
| 12.9 | **資料血緣 lineage** | 選一個輸出欄位 → 回溯經過哪些規則、由哪些輸入算出；反向：改這輸入會動到哪些輸出 | Analyst | 🔴 |
| 12.10 | **孤兒 / 死引用偵測** | 沒被任何 PREBLOCK 指到的 Function、引用不存在 table/column 的規則、沒人用的規則 | Analyst / Maintainer | 🟡 |
| 12.11 | **規則 × table 影響矩陣** | rule×table 矩陣熱圖，一眼看「哪條規則碰最多表」「哪張表被最多規則依賴」（§1.10 矩陣佈局的稽核版） | Analyst | 🟡 |

> 共用基礎：§11 / §12 大量功能其實是同一個 **原始資料索引 + 查詢引擎**長出來的不同視圖。建議先把「把底層規則資料抽成可查詢索引」這層蓋好（一次建設、§11+§12 全沾光），再分頭做各視圖。

---

## 優先級透鏡 🔭（怎麼從這份選單挑）

別照 tier 挑，照下面四問挑：

1. **護城河優先**：能讓 RTD RuleViewer 更不可取代的（§1）擺第一 —— 那是別人抄不走的。
2. **複利優先**：一次建設、多處受惠的基礎建設（Cmd+K §5.1、主題 §6.1、全文搜尋 §2.3、theme/token）—— 蓋一次，後面每個功能都沾光。
3. **吃自己狗糧**：把 LLMDevFramework 方法論變成站上活功能（§3.2 / §3.3 / §10.7）—— 既展示又自用，故事性最強。
4. **日常痛點優先**：§11 / §12 這類稽核 / 搜尋 / 跨規則工具是你**每天**在做的事，省的是自己的時間，回報最直接、最有感。
5. **快樂稅**：每季留一個 moonshot（§10）給自己，做不膩才走得遠。

> 🔑 §11 + §12 共用同一塊基礎：**把底層規則資料抽成可查詢索引**。先蓋這層（一次建設），hardcode 偵測 / where-used / diff search / 跨規則關係全沾光 —— 這是整份藍圖 CP 值最高的單一基礎建設。

### 建議的「第一波」三選（複利 + 護城河 + 日常痛點）

- 🟢 **Cmd+K 命令面板 + 全文搜尋**（§5.1 + §2.3）—— 一次升級全站操作體驗，所有人受惠
- 🟡 **規則資料索引層 → 先做 raw grep + where-used**（§11.1 + §12.1）—— 蓋好索引，後續稽核功能全部接著長
- 🟢 **影響半徑熱力 + 可分享圖狀態**（§1.2 + §1.6）—— 直接加深 RTD 護城河，成本低

---

## 落地建議

- 這份是 **vision backlog**，不是單一 spec。真要做某條 → 對那條跑 `/sdd` 產可實作規格 + CodeMap，再進 stub。
- 共用基礎（搜尋引擎、命令面板、主題、AI 代理層）建議先抽 **共用 lib / context**，避免每個功能各搞一套（呼應 frontend paved stack 的「NEVER 各自 axios.create()」精神）。
- 所有 AI / 外部呼叫 **走後端代理**，前端 NEVER 持金鑰。

## References

- 現有架構：`MyDevWebFrontend/CLAUDE.md`、`src/App.tsx`（路由全貌）
- 前端統一 stack：`LLMDevFramework/React & Typescript/CLAUDE.md` + `frontend-resources.md`
- 既有 RTD 相關 spec：`specs/2026-06-13-tracker-impact-deeplink-clause-eval.md`、`specs/2026-06-14-canvas-group-block-select-drag.md`
- 方法論來源：`LLMDevFramework/`（sdd / prompt-principles / karpathy-guidelines）
