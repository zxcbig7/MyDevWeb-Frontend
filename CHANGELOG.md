# 開發紀錄與規劃

MyDevWeb 前端 —— 含 **RTD Rule Viewer**（半導體 RTD rule 視覺化 / 查案工具）與**個人網站**（首頁 / 開發筆記 / Dashboard / SQL Visualizer）。

本檔以「做了什麼」分功能領域記錄，不以日期排序。最後附**開發規劃（Roadmap）**。

---

## 一、核心功能（已穩定）

### 1. RTD Rule Viewer — Canvas 視覺化

- 自建 Canvas 畫布：**平移（pan）/ 縮放（zoom）/ 格線（grid）/ 小地圖（minimap）**。
- Block 依後端 `POSX/POSY` 佈局繪製；`PREBLOCK` 關係自動連成箭頭，區分**主線 / 副線**（同群組 MAIN 特別標色）。
- **Block Type 分類與圖示**：依類型對應 `/public/RTDIcons` 圖檔；支援**新舊兩套 ICON（Modern / Classic 切換）**。
- 互動：hover 提示、雙擊開詳情、右鍵 context、點擊定位。
- 穩定性 / 相容性：修復 minimap 點擊崩潰、行動裝置介面、Safari 與各瀏覽器相容、「防止網站死掉」等多項加固。

### 2. Block Inspector（詳情面板）

- 雙擊 Block 浮出**可拖曳 / 可縮放 / z-index 疊放**的詳情面板，支援同時開多個。
- 依 block 類型分派不同內容排版；**APF 條件語法上色**。
- 面板與來源 block 以虛線連線標示。
- 經多次 UI / resize / 排版優化。

### 3. 搜尋與 Rule 選擇

- **兩階段 Rule 選擇**：先選 Phase，再用 **EQP ID** 或 **Rule Name** 載入（兩者互斥邏輯）。
- **Rule 內關鍵字搜尋** → 命中 block 清單，可**逐筆跳轉定位（跳方塊）**。
- 機台（EQP）搜尋、下拉選單與搜尋渲染效率優化。

### 4. 資料層 / API

- **標準化 API 打法**：SWR（讀）+ axios，統一信封（success / code / message / data）拆解。
- **API 失敗自動彈出 Toast** 提示。
- **多環境控制（DEV / STAGE / PROD）**；DEV 支援 **Mock 假資料**，無後端也能開發。
- DTO → 前端 `RuleData` 轉換層。

### 5. 身份驗證（Auth）

- 從 **OIDC 認證** → **Google 驗證** → **GIS One Tap + redirect** 流程演進。
- 登入開關、權限分級、ProtectedRoute 保護路由。

### 6. 個人網站

- **首頁 / 關於我 / 開發筆記（Markdown 文章）/ Dashboard / 導覽頁**。
- **筆記關聯圖（Note Graph）**：以力導向圖呈現筆記之間的連結。
- 響應式與行動裝置介面、Icon / LOGO 更新。

### 7. SQL Visualizer

- 新增獨立的 **SQL 視覺化**頁面。

### 8. 部署 / CI-CD

- **Azure Static Web Apps**、**Docker** 容器化、**GitHub Actions** release workflow。
- harbor registry、docker login、WSL/bash PATH 等 pipeline 問題修正。
- 正式公開版本上線。

### 9. 工程基建

- **移除 type hard-code、統一型別**；Component 分割與架構化。
- **Tailwind CSS** 導入與多次升級。
- **效能**：route-level code splitting、memoization、React 最佳化。
- eslint 全面清理。

---

## 二、實驗性功能（開發中 / 待驗收）

> 以下為目前正在開發、尚未正式釋出的功能，行為與介面可能持續調整。

### 1. Tracker — 反藍 Log 查案

- **依賴圖（DAG）模型**：整條 rule 建一次去重的依賴圖，顯示時才即時投影成多元樹（lazy）；解析改用共用 tokenizer。
- **反查（Trace）**：輸入反藍 log → 列出觸發條件變數 → 逐層展開追到 root（DB 來源）；標記 root / 循環 / 共用節點。
- **Runtime Log 套用**：貼上實際值 → 各節點顯示值、命中路徑自動上色與展開。
- **一鍵複製**：把觸發點 + 依賴樹 + 相關 block 定義整理成 context pack，可貼給 AI 分析。
- **反向 Impact 查詢**：變數 → 受影響的哪些反藍 log（依賴圖反向走訪）。
- **URL deep link**：把查案現場（phase / rule / log / 模式 / 變數）寫進網址，可分享、可重現。
- **Clause 三值評估**：支援 `AND / OR / NOT / 括號` 複合條件的命中判定（成立 / 不成立 / 未知）。
- **連線視覺**：追蹤時點亮依賴路徑上的既有主 / 副線、淡化無關線；樹上的來源 block 名稱可雙擊開 inspector。

### 2. Canvas 編輯 — 以 group 為單位操作

- 單一 block 拖曳 + 對齊格線（snap）。
- **Shift 框選**（橡皮筋）成臨時 group → **整組拖曳**。
- **對齊 / 等距分佈** toolbar（左 / 右 / 上 / 下 / 置中 / 分佈）。
- 鍵盤：ESC 清除選取、方向鍵微調、雙擊已選 block 開整組 inspector。

### 3. 載入 = 重新讀取

- 按「載入」強制重抓最新內容，並把手動拖曳過的 block 位置**還原至原始佈局**。

### 4. 工程（實驗功能配套）

- 導入 **vitest 單元測試**（解析 / 反查 / 對齊等純函式）。
- Dev 環境連線改走 proxy（同源、免 CORS）。

---

## 三、開發規劃（Roadmap）

### 近期：把實驗功能穩定化

- Tracker（Impact / Deep Link / Clause 評估）、Canvas group 編輯 → 完成實機驗收後**從實驗轉正式**。
- 補 UI 互動測試，降低回歸風險。
- 整理 Tracker 操作說明 / 使用指引。

### 中期：編輯與查案能力深化

- **Block 佈局持久化**：拖曳 / 對齊後的位置存回後端，重開仍保留（需新增 endpoint 與儲存欄位）。
- **自動重排佈局（auto-layout）**：依依賴拓樸或群組一鍵排成乾淨版面。
- **跨 rule 影響分析**：變數 / log 在其他 rule 的影響面（需後端跨 rule 查詢）。
- **Rule 版本比對（diff）**：同一條 rule 不同版本的差異視覺化。

### 長期：平台化

- 查案知識沉澱：把常見反藍案例與根因整理成可查詢的案例庫。
- 更完整的權限與多人協作（分享查案現場已具雛形）。
- 效能與大型 rule（數百 block）下的互動優化。

---

> 註：本檔依功能彙整「做了什麼」，不逐筆列 commit；完整逐筆紀錄與時間線見 `git log`。
