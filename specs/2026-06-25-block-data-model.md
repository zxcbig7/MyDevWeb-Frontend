---
title: RTD Block 資料模型規格 — 一個 Block 儲存什麼
status: reference
created: 2026-06-25
updated: 2026-06-27
modules: [frontend, backend]
kind: data-model spec（整理現況；每欄都對齊真實型別 + file:line，非臆測）
sources:
  - src/components/RTDRuleViewer/types.ts
  - src/components/RTDRuleViewer/api.ts
  - src/components/RTDRuleViewer/dataTransform.ts
  - src/components/RTDRuleViewer/blockUtils.ts
  - src/components/RTDRuleViewer/BlockInspector.tsx
---

# RTD Block 資料模型 🧱

## Summary

一個 **Block** = RuleViewer canvas 上的一個節點。它從**後端儲存層**逐步收斂成畫布物件，共**四層表示**：

```
 儲存層（DB/Mock）        後端供給（合併 VALUE）       前端合併（每 Block 一筆）     Canvas 物件
  RTDRuleBlock    ──join──▶  RTDRuleBlockDTO   ──convert──▶  RuleData       ──build──▶  Block
  VALUE1..VALUE5   "\n"      ≡ 前端 RuleInfoDTO  DtosToData   └VALUES[]       Blocks      └raw
  (Models:52-72) (Ctrl:87)   (Models:75-91)    (dataTransform)(types:57-77)            (types:136)
```

- **Layer 0 RTDRuleBlock**（後端，§0）：真正的儲存形狀，**`VALUE` 拆成 `VALUE1~5` 五欄**；目前由 mock 供給、未接 Oracle。
- **Layer 1 RuleInfoDTO ≡ 後端 `RTDRuleBlockDTO`**（§1）：後端把 `VALUE1~5` 用 `\n` 合併成單一 `VALUE` 後回傳；**一個 Block 的多個條件展開成多列**（同 `BLOCK_NAME`）。
- **Layer 2 RuleData**（§2）：前端依 base block name 合併成一筆，多列條件收進 `VALUES[]`。
- **Layer 3 Block**（§往下）：加上畫布座標 / 尺寸 / icon 類型，供 canvas 繪製。

> 真相只有 Layer 0/1/2。Tracker 的依賴圖（`DepGraph`）、顯示樹（`ViewNode`）、Impact 結果都是**即時算的投影，不儲存**（見 §6）。

---

## 定義三層：DB 設定 → 後端定義 → 前端定義 🏗️

資料模型的**權威順序是 DB → 後端 → 前端**。DB 資料表是**唯一真實來源（source of truth）**，後端 model/DTO 與前端 types 都是它的投影。定義時**先定 DB schema**，後端、前端再對齊。下方 Layer 0~3 描述「執行期資料流」，本節描述「定義來源」。

| 定義層 | 是什麼 | 角色 |
|---|---|---|
| **① DB 設定** | Oracle 資料表 schema（見 §DB） | 權威來源，**先定** |
| **② 後端定義** | C# `RTDRuleBlock`（儲存形狀）+ `RTDRuleBlockDTO`（供給） | 讀 DB → 合併 VALUE → 供前端 |
| **③ 前端定義** | TS `RuleInfoDTO` / `RuleData` / `Block` | 收 DTO → 合併 → 畫布物件 |

---

## §DB — Oracle 資料表定義（權威來源 ⭐ 先定這個）

> 資料模型的**起點**：先在此把表結構定齊，後端 / 前端再對齊。DB schema 未定前，後端 model 的欄位/型別只是暫時對照（§0.1 是與現有 code 的比對，不是權威）。

**已由使用者確認（2026-06-27）**：

| DB 欄位 | DB 型別 | 可空 | 備註 |
|---|---|---|---|
| `BLOCK_GROUP` | `VARCHAR2(64)` | 待定 | Block 分組 |
| `BLOCK_SEQ` | `NUMBER` | 待定 | 組內順序（Block 層級） |
| `BLOCK_CODE` | `VARCHAR2(64)` | 待定 | ⏸️ 暫不納入資料模型 |
| `CLAIM_TIME` | `DATE` | 待定 | Block 最後更新時間 |

欄位尾段順序（使用者提供）：`… VALUE1, VALUE2, VALUE3, VALUE4, VALUE5, BLOCK_GROUP, BLOCK_SEQ, BLOCK_CODE, CLAIM_TIME`。

**待你定義**：完整欄位清單 + 各欄 DB 型別 / 長度 / 可空 / 主鍵 / index —— 涵蓋 `PHASE`、`RULE_NAME`、`BLOCK_NAME`、`BLOCK_TYPE`、`KEY`、`POSX`、`POSY`、`PREBLOCK`、`COLUMN1`、`COLUMN2`、`VALUE1~5` 等。給我表定義我就把這張表補滿，後端/前端再回對齊。

---

## §0 Layer 0 — 後端視角（儲存與供給）

來源：`MyDevWebBackend`（`Models/RTDRuleBlock.cs`、`Controllers/RuleViewerController.cs`、`Models/ApiResponse.cs`、`Data/RTDMockData.cs`）。

### 0.1 真正的儲存形狀 `RTDRuleBlock`（`RTDRuleBlock.cs:52-72`）

這是「DB 格式」的 block。與前端 DTO 最大差異：**`VALUE` 在儲存層是 5 個獨立欄位 `VALUE1~VALUE5`**，且座標型別不同。

| 欄位 | 後端型別 | 對前端的差異 |
|---|---|---|
| `PHASE` `RULE_NAME` `BLOCK_NAME` `BLOCK_TYPE` `BLOCK_GROUP` `BLOCK_SEQ` | `string`（非 null）| 前端視為 `string\|null` |
| `KEY` `PREBLOCK` `COLUMN1` `COLUMN2` | `string?` | 同 |
| `POSX` `POSY` | **`double`（非 null）** | 前端為 `number\|null`；實際永遠有值 |
| **`VALUE1`…`VALUE5`** | `string?` ×5 | **前端只看到合併後的單一 `VALUE`** |
| `CLAIM_TIME` | `DateTime?` | 見 0.3，回傳時必非 null |

#### 真實 DB schema（使用者提供）對照目前 model

真實 Oracle 表欄位尾段順序：`… VALUE1, VALUE2, VALUE3, VALUE4, VALUE5, BLOCK_GROUP, BLOCK_SEQ, BLOCK_CODE, CLAIM_TIME`。已知型別：

| DB 欄位 | DB 型別 | 目前 model | 落差 |
|---|---|---|---|
| `BLOCK_GROUP` | `VARCHAR2(64)` | `string` | ✓ |
| `BLOCK_SEQ` | `NUMBER` | `string`（C# 與 TS）| ⚠️ **型別漂移**：DB 是數字、code 當字串（建議轉 `number`，呼應 §9）。唯一數值用途（topo tiebreak）已在 `RuleContentSearch.tsx:78` 用 `Number()` 轉換 → **目前無 live bug**，僅型別不乾淨 |
| `BLOCK_CODE` | `VARCHAR2(64)` | **無** | ⏸️ **暫不納入**（使用者 2026-06-27 決定先不定義、先不用） |
| `CLAIM_TIME` | `DATE` | `DateTime?` | ✓ |

> ⏸️ **`BLOCK_CODE` 暫不納入**（使用者 2026-06-27 決定）：屬 Block 層級欄位，DB 來源表有（`VARCHAR2(64)`），但**先不定義語意、先不使用，不進資料模型**。日後要用再回來補語意（顯示 / 搜尋 / 依賴圖）。

### 0.2 `VALUE1~5` → `VALUE` 的合併規則（`RuleViewerController.cs:87`）

```csharp
VALUE = string.Join("\n", new[] { VALUE1, VALUE2, VALUE3, VALUE4, VALUE5 }.Where(v => v != null))
```

- 用 **`\n` 串接、跳過 `null`**（注意：是 `!= null`，空字串 `""` 仍會產生空白行）。
- **這就是前端 `VALUE` 會有換行、且搜尋採「空白不敏感」的根因**（§7）。一條 APF 表達式太長時，後端就靠 `VALUE1~5` 分欄存放。

### 0.3 其他供給時的加工（`RuleViewerController.cs`）

- **`CLAIM_TIME` 補預設**：`o.CLAIM_TIME ?? DateTime.Today.AddHours(12)`（`:88`）→ **DTO 回傳的 `CLAIM_TIME` 永遠非 null**（前端註解說可 null，實際不會）。
- **過濾大小寫不敏感**：phase / ruleName 都 `.ToLower()` 比對（`:71-72`）。
- **`fab` 被忽略**：route 有 `{fab}` 但 controller 從不依它過濾 → 這正是前端「F01/F02/F03 回相同資料」的後端根因（呼應 UX 體檢 R1）。

### 0.4 Endpoints（`[Route("api/{fab}/[controller]")]`）

| Method | Path | 回傳 | 來源 |
|---|---|---|---|
| GET | `/api/{fab}/RuleViewer/phases` | `RTDPhase[]` | `_rules` distinct PHASE |
| GET | `/api/{fab}/RuleViewer/{phase}/eqprules` | `RTDEqpRuleMapping[]` | `RTDMockData.eqpRuleMapping`（many-to-many）|
| GET | `/api/{fab}/RuleViewer/{phase}/rules` | `RTDRuleName[]` | `_rules` distinct RULE_NAME |
| GET | `/api/{fab}/RuleViewer/{phase}/{ruleName}` | **`RTDRuleBlockDTO[]`** | `_rules` 過濾 + VALUE 合併 |
| GET | `/api/{fab}/RuleViewer/ImportFile/{tableName}` | `ImportTableDTO` | **隨機 mock**（1000 列）|
| GET | `/api/{fab}/RuleViewer/GeneralTable/{tableName}` | `GeneralTableDTO` | **隨機 mock**（200 列）|

### 0.5 資料來源現況：**目前全 mock，尚未接 Oracle** ⚠️

- `_rules` = `RTDMockData.StressRuleInfo`（in-memory `Lazy<List<RTDRuleBlock>>`，`RuleViewerController.cs:12-16`）。
- `eqpRuleMapping` 為硬編清單；`_eqpRules = []` 是**未使用的死欄位**（`:18`）。
- Import / GeneralTable 端點回**隨機產生**資料，非真實表。
- 後端有 `OracleDbConnectionFactory`（`Tenant/`，用 `Oracle.ManagedDataAccess.Client`、per-tenant connection string），**但 RuleViewerController 完全沒用到它** → 為未來接 Oracle 預留。
- **規格意涵**：未來接真 DB 時，`RTDRuleBlock` 的欄位（含 `VALUE1~5`、`POSX/POSY`）就是預期的資料表 schema；屆時把 `_rules` 換成 Oracle 查詢即可，DTO / 前端不需改。

### 0.6 回應信封 `ApiResponse<T>`（`ApiResponse.cs`）

```jsonc
{ "success": true, "data": <T>, "message": "" }   // Ok(data)
{ "success": false, "data": null, "message": "..." } // Fail(msg)
```

> ⚠️ **契約落差**：後端信封**只有 `success / data / message`，沒有 `code`**；但前端 `APIResponse<T>` 型別宣告了 `code: number`（`api.ts:45-50`）→ 前端拿到的 `code` 實際是 `undefined`。目前 `useAPI` 沒讀 `code`，無功能影響，但**型別與實際不符**，建議擇一對齊（後端補 `code` 或前端拔掉）。

### 0.7 Mock 資料正好印證 §3 各型別語意（`RTDMockData.cs`）

| Mock block | BLOCK_TYPE | KEY | PREBLOCK | VALUE1 | 印證 |
|---|---|---|---|---|---|
| `DB_MAIN` | Database | `LOT_LIST` | null | null | input：KEY=DB 表名、無 VALUE |
| `FUNC_S1A` | Function | `HOLD_SEVERITY` | `DB_S1` | `IF COUNT(...)>3 AND ... THEN "HIGH" ELSE...` | function：KEY=輸出變數、VALUE=APF 表達式 |
| `FILTER_S1X` | Select | null | `FUNC_S1X` | `CONSTRAINT_FLAG != "FREE"` | select（舊名 Filter）：條件、KEY 可 null |
| `XREF_S1` | CrossRef | `IDX_CONSTRAINT` | **`FUNC_S1A,FILTER_S1X`** | `CONSTRAINT_FLAG` | ⚠️ **舊定義範例**：欄位值未依新語意更新（CrossRef 應 KEY=null、COL1/2=主/副線欄位陣列、VALUE=多筆欄位逗號，見 §3.2）；待一次盤重做 |

> `XREF_S1` 的 `PREBLOCK="FUNC_S1A,FILTER_S1X"` 實證了 §5 的「最多 2 個前置、`[0]`主線 `[1]`副線」，也對上「先 CrossRef join 再 Function 判斷」的拓樸鐵則。

---

## Layer 1 — `RuleInfoDTO`（後端原始列）

`GET /api/{fab}/RuleViewer/{phase}/{ruleName}` 回傳 `RuleInfoDTO[]`。後端已把 `VALUE1~5` 合併進單一 `VALUE`。
（型別 `types.ts:39-54`；欄位語意 `api.ts:120-145`）

| 欄位 | 型別 | 意義 | 備註 |
|---|---|---|---|
| `PHASE` | `string\|null` | 所屬 Phase | e.g. `"APF"` |
| `RULE_NAME` | `string\|null` | 所屬 Rule 名 | |
| `BLOCK_NAME` | `string\|null` | Block 名稱（**合併鍵**）| 同 Block 多條件 → 同名多列；可能帶陣列後綴 `Name[0]`（見 §5）|
| `BLOCK_TYPE` | `string\|null` | Block 類型 | 對應 `/public/RTDIcons` 圖檔名；列舉見 §4 |
| `BLOCK_GROUP` | `string\|null` | 分組 | e.g. `"G1"` |
| `BLOCK_SEQ` | `string\|null` | 組內排序 | 字串數字；topo 排序同層 tiebreak 用（`RuleContentSearch.tsx:101`）|
| `KEY` | `string\|null` | **依型別而異**（見 §3）| Function=輸出變數名 / Database=DB 表名 / CrossRef=null（不用） |
| `POSX` | `number\|null` | Canvas X 座標（px）| |
| `POSY` | `number\|null` | Canvas Y 座標（px）| |
| `PREBLOCK` | `string\|null` | 前置 Block 名 | 逗號分隔字串；前端**最多取前 2**（見 §5）|
| `COLUMN1` | `string\|null` | **依型別而異**（見 §3）| Database=欄位清單 / CrossRef=主線欄位陣列 / Function=null |
| `COLUMN2` | `string\|null` | **依型別而異**（見 §3）| CrossRef=副線欄位陣列 / Function=null |
| `VALUE` | `string\|null` | 條件表達式（APF）| `IF $LOG$ THEN ...`；後端已合併 VALUE1~5；結構見 §7 |
| `CLAIM_TIME` | `string\|null` | 最後更新時間 | **Block 層級**：每個 block 各自的最後更新時間 |

---

## Layer 2 — `RuleData` + `BlockValue`（前端合併後）

`convertDtosToData()`（`dataTransform.ts:15-52`）把同 `BLOCK_NAME`（去陣列後綴）的多列合併成一筆。

### `RuleData`（`types.ts:57-69`）— 每個 Block 一筆

| 欄位 | 型別 | 來源 / 變化 |
|---|---|---|
| `PHASE` | `string\|null` | DTO 同名，null → `""` |
| `RULE_NAME` | `string` | DTO 同名，null → `""` |
| `BLOCK_NAME` | `string` | **去陣列後綴**後的 base name（`"Func1[0]"`→`"Func1"`，`dataTransform.ts:10-13`） |
| `BLOCK_TYPE` | `string` | DTO 同名 |
| `BLOCK_GROUP` | `string` | DTO 同名 |
| `BLOCK_SEQ` | `string` | DTO 同名 |
| `POSX` / `POSY` | `number\|null` | DTO 同名（原始畫布座標）|
| `PREBLOCK` | `string[]\|null` | 逗號切開 → 各去陣列後綴 → **`.slice(0,2)`**（`dataTransform.ts:22-25`）。`[0]`=主線來源、`[1]`=副線來源（選用）|
| `VALUES` | `BlockValue[]` | 多列條件聚合；只有 `COLUMN1\|COLUMN2\|VALUE` 任一非空的列才推入（`dataTransform.ts:44-48`）|

### `BlockValue`（`types.ts:72-77`）— 一個 Block 內的「一條條件 / 一列」

| 欄位 | 型別 | 意義（依型別，見 §3）|
|---|---|---|
| `KEY` | `string\|null` | 輸出變數名 / DB 表名（CrossRef=null） |
| `COLUMN1` | `string\|null` | 欄位清單 / CrossRef 主線欄位陣列 / Output target |
| `COLUMN2` | `string\|null` | CrossRef 副線欄位陣列 / Source |
| `VALUE` | `string\|null` | APF 條件表達式 / CrossRef 要從副線併進主線的欄位（逗號） |

---

## Layer 3 — `Block`（Canvas 渲染物件，`types.ts:136-145`）

`buildBlocks()`（`blockUtils.ts:13-32`）由 `RuleData` 衍生：

| 欄位 | 來源 |
|---|---|
| `id` | `RuleData.BLOCK_NAME` |
| `x` / `y` | `POSX/POSY` **整體平移**：全圖最小 x,y 對齊到原點（`blockUtils.ts:16-20`）|
| `w` / `h` | 固定 `BLOCK_SIZE = 80`（`blockUtils.ts:8`）|
| `type` | `RuleData.BLOCK_TYPE`（→ icon 圖檔 + 分類色）|
| `label` | `RuleData.BLOCK_NAME`（畫在 icon 下方）|
| `raw` | 整包 `RuleData`（雙擊開 Inspector 用）|

> 渲染狀態（選取 / 命中 / dim / tracker 光環）不存在 Block 上，是繪製時由外部 Set 傳入算的（`blockUtils.ts:196-229`）。

---

## §3 欄位語意對照 — 每個 `BLOCK_TYPE` 的 `KEY / COLUMN1 / COLUMN2 / VALUE` ⭐

> ✅ **權威來源 = 你的模擬 DB 資料**（`RTDMockData.cs` `StressRuleInfo` / 前端 `stressRule.ts`），不是我的推測。
> 目前模擬資料**語意正確實證的有 5 種**（✅）：`Database`、`Import`、`Function`、`Select`（舊名 `Filter`）、`DispatchScreen`。
> `Union`、`Rule`、`Sort`、`Batch`、`Compress`、`MacroFunction`、`MacroExport`、`Cumulate`、`CrossRef` 九種由**使用者口述產品語意確認**（📝，見 §3.2 / §3.3 / §3.4）。前八者尚未進模擬資料；`CrossRef` 在 mock 有對應列但為**舊定義**，語意已更正、mock 待一次盤重做。
> 其餘 34 種**只存在於 `BlockTypes` enum（決定 icon），未出現於模擬資料** → 欄位語意尚未定義，**本規格不臆造**（待加入該型別的模擬/真實資料後再補）。

**標記**：✅ 模擬資料實證　📝 使用者口述產品語意（尚未進模擬資料，待補實證）　➖ 未出現於模擬資料（欄位語意 TBD，加入資料後才定義）

**證據出處**：模擬資料 `RTDMockData.cs:42-235`；型別專屬邏輯 `depGraph.ts:73,97-101`、`BlockInspector.tsx:240,783-786`。

### 3.1 input（🟧 橘）— Body=`DataSourceBody`（KEY 顯示為 `TBL`、COLUMN1 顯示為 `Columns`）

| type | KEY | COLUMN1 | COLUMN2 | VALUE | 標記 |
|---|---|---|---|---|---|
| `Database`(=Repository) | **DB 資料表名稱**（`HOLD_HIST`） | **該表的 Columns**，多筆逗號分隔（`LOT_ID, HOLD_FLAG, HOLD_COUNT, WAIT_TIME, ...`） | null | null | ✅ |
| `Import` | 匯入表名（`LOT_IMPORT_TBL`，傳 GeneralTable endpoint 供「View Data」）| 欄位清單（`LOT_ID, STEP, STATUS, ...`）| null | null | ✅ |
| `DataSource` | — | — | — | — | ➖ |
| `SQL` | — | — | — | — | ➖ |
| `Tag` | — | — | — | — | ➖ |
| `Data` | — | — | — | — | ➖ |
| `MacroImport` | — | — | — | — | ➖ |
| `MacroParameter` | — | — | — | — | ➖ |

### 3.2 tableop（🟩 綠）— Body=`FunctionBody`（除 `CrossRef` 用 `CrossRefBody`）

| type | KEY | COLUMN1 | COLUMN2 | VALUE1~5（合併後）| 標記 |
|---|---|---|---|---|---|
| `CrossRef` | null | **主線欄位陣列**（逗號分隔；取自 `[0]`主線 preblock） | **副線欄位陣列**（逗號分隔；取自 `[1]`副線 preblock） | **要從副線併進主線的欄位**（多筆，逗號） | 📝 |
| `Join` | — | — | — | — | ➖ |
| `Union` | null | **主線欄位陣列**（逗號分隔；取自 `[0]`主線 preblock）| **副線欄位陣列**（逗號分隔；取自 `[1]`副線 preblock）| null | 📝 |
| `Procedure` | — | — | — | — | ➖ |
| `MacroFunction` | **其他 Rule 名稱** | 待定 | 待定 | **該 Rule 的輸出欄位**（多筆，逗號） | 📝 |

> **`CrossRef` 與 `Union` 是僅有的兩種可帶 2 個 PREBLOCK 的 block**（`[0]`主線、`[1]`副線），且**欄位佈局相同**：`KEY=null`、`COLUMN1`=主線欄位陣列、`COLUMN2`=副線欄位陣列（皆逗號分隔，分別取自 `[0]`/`[1]` preblock）。差別在**運算語意**：
>
> - `CrossRef`：兩線**交叉參照 / join**。
> - `Union`：兩線欄位對位後**上下疊合**。
>
> CrossRef 與 Union 佈局相近（`KEY=null`、`COLUMN1`=主線陣列、`COLUMN2`=副線陣列），差別：**`CrossRef` 多一個 `VALUE`（多筆欄位、逗號），`Union` 無 `VALUE`**；運算上 CrossRef=交叉參照 / join、Union=上下疊合。
>
> CrossRef 三組欄位清單：`COLUMN1`=主線欄位、`COLUMN2`=副線欄位、`VALUE`=**要從副線併進主線的欄位**（皆逗號分隔）。
>
> 對應「先 CrossRef join 再 Function 判斷」拓樸鐵則（Function 仍恆為單一 PREBLOCK，見 §5b）。

### 3.3 function（🟦 藍）— Body=`FunctionBody`（COLUMN1=`Output`、COLUMN2=`Source`）

| type | KEY | COLUMN1 | COLUMN2 | VALUE | 標記 |
|---|---|---|---|---|---|
| `Function` | **輸出變數名**（`HOLD_RISK`；可多個 block 輸出同名，如 `disablereason`）| null | null | **APF 表達式** `IF…THEN…ELSE`（可含 `/*註解*/`、`COUNT()/SUM()/AVG()`、`[$LOG$]`）| ✅ 唯一會定義變數的 type（`depGraph.ts:97-101`）|
| `Select` | null | null | null | **布林條件式**（`HOLD_RISK != "OK" OR HOLD_PRIORITY != "P3"`）；副線去重用，不定義變數（舊名 `Filter`，僅命名規則差異、邏輯相同） | ✅ |
| `Batch` | **單一 column name** | **categories**：多個 column、逗號分隔 | 待定 | 待定 | 📝 |
| `Compress` | 待定 | **output columns**：多欄、逗號分隔 | **categories columns**：多欄、逗號分隔 | 待定 | 📝 |
| `Cumulate` | **要新增的 column**（一筆） | **一筆**：內容為 "Cumulative of …"（累計描述） | **categories columns**：多筆、逗號分隔 | 待定 | 📝 |
| `Delta` | — | — | — | — | ➖ |
| `Duration` | — | — | — | — | ➖ |
| `EventMaker` | — | — | — | — | ➖ |
| `HyperLink` | — | — | — | — | ➖ |
| `LoopBegin` | — | — | — | — | ➖ |
| `LoopEnd` | — | — | — | — | ➖ |
| `Percentage` | — | — | — | — | ➖ |
| `Product` | — | — | — | — | ➖ |
| `Rule` | null | null | null | **分號分隔的規則名清單** `規則1; 規則2; …`（引用其他 rule、聚合呼叫，非 APF 表達式；存於 `VALUE1~5`）| 📝 |
| `Snapshot` | — | — | — | — | ➖ |
| `Sort` | null | **排序欄位清單**（空格分隔，如 `WAIT_TIME HOLD_COUNT`） | **各欄排序方向**，與 COLUMN1 **位置對齊**：`1`=降冪 DESC、`0`=升冪 ASC，空格分隔（如 `1 0`） | null | 📝 |
| `TempMaker` | — | — | — | — | ➖ |

> **`Sort` 欄位語意特例**：`COLUMN1`/`COLUMN2` 是**位置對齊的兩個平行清單**（`COLUMN1[i]` 欄位 ↔ `COLUMN2[i]` 方向，`1`=DESC/`0`=ASC），兩者長度應一致。⚠️ 它仍走 function 分類的 `FunctionBody`，Inspector 預設標籤是 `Output`/`Source`，對 `Sort` 並不貼切 —— 之後若 §9 收斂成 `SortBlock` 變體，Inspector 應改顯示 `Sort by`/`Direction`。

### 3.4 output（🟨 黃）— Body=`ProcessBody`（COLUMN1 標籤=`Target`、COLUMN2 標籤=`Depends on`、含 ← 連線）

> 模擬資料只出現 `DispatchScreen`（終端 sink，斷尾豁免 `depGraph.ts:73`）。其餘 16 種圖表/輸出型別**未出現於模擬資料**。

| type | KEY | COLUMN1 | COLUMN2 | VALUE | 標記 |
|---|---|---|---|---|---|
| `DispatchScreen` | null | null | null | null（純終端 sink、不運算、一定是最後一個 block）| ✅ |
| `Action` | — | — | — | — | ➖ |
| `Bar` | — | — | — | — | ➖ |
| `Barline` | — | — | — | — | ➖ |
| `BoxPlot` | — | — | — | — | ➖ |
| `Gantt` | — | — | — | — | ➖ |
| `Line` | — | — | — | — | ➖ |
| `MacroExport` | null | **輸出的多個 column**（多筆，逗號） | null | null | 📝 |
| `Pie` | — | — | — | — | ➖ |
| `ResultTable` | — | — | — | — | ➖ |
| `StackBar` | — | — | — | — | ➖ |
| `StackBarLine` | — | — | — | — | ➖ |
| `StackTemporal` | — | — | — | — | ➖ |
| `Table` | — | — | — | — | ➖ |
| `Temporal` | — | — | — | — | ➖ |
| `XY` | — | — | — | — | ➖ |
| `XYTable` | — | — | — | — | ➖ |

### 3.5 general（⬜ 灰）— fallback `ProcessBody`

| type | KEY | COLUMN1 | COLUMN2 | VALUE | 標記 |
|---|---|---|---|---|---|
| `Annotation` | — | — | — | — | ➖ |

> `Annotation`（及任何不在 §4 分類表的 type）落 general fallback；未出現於模擬資料。

---

## §4 `BLOCK_TYPE` 全列舉（`types.ts:80-131`）+ 分類色（`BlockInspector.tsx:61-78`）

共 47 種，每種對應 `/public/RTDIcons/{New|Old}/{type}.png`。分類決定 Inspector 標頭色與預設 Body。（原 `Filter` 併入 `Select` —— 僅命名規則差異、邏輯相同，故不再單列。）

| 分類 | 色 | 型別 |
|---|---|---|
| **input** | 🟧 橘 | `Data` `DataSource` `Import` `MacroImport` `MacroParameter` `Database`(=Repository) `SQL` `Tag` |
| **tableop** | 🟩 綠 | `CrossRef` `Join` `MacroFunction` `Procedure` `Union` |
| **function** | 🟦 藍 | `Batch` `Compress` `Cumulate` `Delta` `Duration` `EventMaker` `Function` `HyperLink` `LoopBegin` `LoopEnd` `Percentage` `Product` `Rule` `Select` `Snapshot` `Sort` `TempMaker` |
| **output** | 🟨 黃 | `Action` `Bar` `Barline` `BoxPlot` `DispatchScreen` `Gantt` `Line` `MacroExport` `Pie` `ResultTable` `StackBar` `StackBarLine` `StackTemporal` `Table` `Temporal` `XY` `XYTable` |
| **general** | ⬜ 灰 | 任何未列入上表的 type（fallback）|

> 注意 `Repository` 的列舉值是字串 `"Database"`（`types.ts:114`）—— 即實際存的 `BLOCK_TYPE` 用 `Database`。
> `Annotation` / `Bar`… 等在列舉中但未分類者，落入 `general`。

---

## §5 合併與正規化規則（`dataTransform.ts`）

1. **跳過無名列**：`BLOCK_NAME` 為空的 DTO 直接略過（`:19`）。
2. **去陣列後綴**：`getBaseBlockName()` 把 `Foo[0]`→`Foo`（`:10-13`）；`BLOCK_NAME` 與 `PREBLOCK` 都套用。
3. **多列 → 一個 Block**：同 base name 第一次見到建空殼，後續列把條件 push 進 `VALUES`（`:28-48`）。
4. **VALUES 收錄條件**：僅當 `COLUMN1 || COLUMN2 || (VALUE 非空白)` 才推入（`:44`）—— 純 metadata 列不產生空 BlockValue。
5. **PREBLOCK 解析**：逗號分隔 → trim → 去後綴 → **`.slice(0,2)`**（`:22-25`）。`[0]`=主線（Inspector 橘 `●`）、`[1]`=副線（灰 `○`，`BlockInspector.tsx:352-360`）。空字串 → `null`。

---

## §5b 拓樸 / 語意規則（模擬資料的設計約束，`RTDMockData.cs:34-40`）

模擬資料刻意遵守下列 RTD 規則，可當「正式資料應長怎樣」的檢核基準：

1. **Function 一律單一 PREBLOCK** — 要合併兩股資料，先用 CrossRef join、再由 Function 判斷。
2. **只有 `CrossRef` 與 `Union` 可帶 2 個 PREBLOCK** — `[0]`主線、`[1]`副線，皆 `KEY=null`、`COLUMN1`=主線欄位陣列、`COLUMN2`=副線欄位陣列；差別：`CrossRef` 另有 `VALUE`（多筆欄位、逗號），`Union` 無 `VALUE`；運算上 `CrossRef`＝交叉參照 / join、`Union`＝上下疊合。其餘 block（含 Function）皆單一 PREBLOCK。
3. **`[$LOG$]` 只在主線產出**，且帶 `[$LOG$]` 的 block 其 `KEY` 一律 = `"disablereason"`；副線/副副線只算變數，經 CrossRef join 進主線後才判斷，不產 `[$LOG$]`。
4. **Select（舊名 Filter）放在（副）線做去重**，`KEY=null`、不定義變數。
5. **多個 Function 可輸出同一變數名**（`disablereason` 由 `FUNC_RSN1/2/3`＋`FUNC_DECIDE[0]` 共同輸出）→ 該變數有多個 def。
6. **陣列後綴 `[0]/[1]` = 同一 canvas block 的多個 facet**：`FUNC_DECIDE[0]`(KEY=`disablereason`) 與 `FUNC_DECIDE[1]`(KEY=`DISPATCH_DECISION`) 同 `BLOCK_SEQ`、同座標 → 合併成一個 block 的多條 `VALUES`。
7. **斷尾 block 不應出現在正式資料** — mock 內 `FUNC_DEADBRANCH_DEMO~DEMO3` 是刻意保留的測試案例（末端無下游），正式資料不該有。
8. **`DispatchScreen` 一定是最後一個 block**，純 sink、不運算。

---

## §7 `VALUE` 的內部結構（依型別不同）

`VALUE`（= `VALUE1~5` 合併）的內容**依 `BLOCK_TYPE` 不同**（見 §3）：
- `Function`：**APF 條件表達式** `IF…THEN…ELSE`（下述排版/上色只針對這種）。
- `Select`（舊名 `Filter`）：布林條件式（APF 子集）。
- `CrossRef`：`COLUMN1`/`COLUMN2`/`VALUE` 都是**欄位清單**（逗號分隔，非 APF 表達式）→ 不適用下述 APF 排版。
- `Rule`：**分號分隔的規則名清單** `規則1; 規則2; …`（引用其他 rule，非表達式）→ 不適用下述 APF 排版。
- `Union`：不用 `VALUE`（疊合欄位放 `COLUMN1`/`COLUMN2`，見 §3.2）。
- `Database` / `Import` / `DispatchScreen`：`null`。

以下針對 `Function` / `Select` 的 APF 字串，前端**不改寫資料**，只在顯示時：
- **排版**：`formatAPF()`（`BlockInspector.tsx:448-515`）在括號外的 `ELSE IF / AND / OR / THEN / ELSE` 前插換行縮排；字串字面值、`/* */`、`//` 註解原樣保留。
- **語法上色**：`tokenize()`（`apfParse.ts`）分 `comment / string / keyword / function / variable / text`（`BlockInspector.tsx:520-527`）。
- **結構元素**：`IF … THEN … (ELSE IF …) ELSE …`；log 進入點寫成 `$LOG_NAME$`（Tracker 用此辨識觸發條件，`BlockInspector.tsx:630-666`）；變數引用驅動依賴圖。

> 搜尋比對採「空白不敏感」：比對前 `\s+`→單空格（`RuleContentSearch.tsx:36`），所以跨 `formatAPF` 換行也能命中。

---

## §6 不儲存在 Block 上的東西（即時計算的投影）

寫規格時要分清「存的」與「算的」，避免誤以為 block 帶這些欄位：

| 概念 | 哪裡算 | 說明 |
|---|---|---|
| `DepGraph`（vars/logs/roots/ancestors）| `buildDepGraph(rules)`（`depGraph.ts`）| 整條 rule 建一次，所有 log 共用（`types.ts:206-212`）|
| `ViewNode` / `ExpandedDef` | 即時投影 | 顯示樹，不另存（`types.ts:214-234`）|
| `TrackerEdge` / `ImpactResult` | `computeTrace` / `computeImpact` | canvas 高亮邊、反向影響；即時算（`types.ts:240-281`）|
| 選取 / 命中 / dim / 光環 | 繪製時傳入 | `drawBlocks` 由外部 Set 決定（`blockUtils.ts:196-229`）|
| `runtimeValues`（已知變數）| 使用者輸入 | `(VAR: value)` 解析，模擬條件成立與否；不屬 block 資料 |

---

## §8 欄位屬性說明（每個欄位的型別 / 可空 / 格式 / 角色 / 約束）

涵蓋所有「儲存欄位」。型別差異以後端 `RTDRuleBlock`（Layer 0）為準，前端 `RuleInfoDTO/RuleData` 為輔。

| 欄位 | 後端型別 | 前端型別 | 可空 | 格式 / 約束 | 角色 | 範例 |
|---|---|---|---|---|---|---|
| `PHASE` | `string` | `string\|null`→`""` | 後端否 | 短碼 | 分區維度 | `"DEV"` `"APF"` |
| `RULE_NAME` | `string` | `string` | 後端否 | 識別字 | Rule 識別 | `"STRESS"` |
| `BLOCK_NAME` | `string` | `string` | 後端否 | 可帶 `[n]` 後綴（前端去除）| **合併鍵 / 節點 id** | `"FUNC_S1A"`、`"X[0]"`→`"X"` |
| `BLOCK_TYPE` | `string` | `string` | 後端否 | 須屬 §4 列舉（48）| 決定 icon + Body + 欄位語意 | `"Function"` |
| `BLOCK_GROUP` | `string`（DB `VARCHAR2(64)`）| `string` | 後端否 | 短碼，≤64 字元 | 視覺分組 | `"G1"` `"MAIN"` |
| `BLOCK_SEQ` | `string`（DB **`NUMBER`**）| `string` | 後端否 | ⚠️ DB 是數字、code 存字串（建議轉 number）| 組內排序、topo tiebreak | `"3"` |
| `BLOCK_CODE` | （DB `VARCHAR2(64)`，暫不納入） | 暫不納入 | — | ⏸️ 使用者決定先不定義、不使用 | Block 層級（擱置） | — |
| `KEY` | `string?` | `string\|null` | 是 | 依型別（§3）| Function 輸出變數 / DB 表名（CrossRef=null） | `"HOLD_RISK"` |
| `POSX` | **`double`** | `number\|null` | 後端否 | px；前端整體平移對齊原點 | canvas X | `240` |
| `POSY` | **`double`** | `number\|null` | 後端否 | px | canvas Y | `420` |
| `PREBLOCK` | `string?` | `string[]\|null` | 是 | 逗號分隔 → **最多 2**；`[0]`主線/`[1]`副線 | 依賴邊（拓樸）| `"FUNC_S1A,FILTER_S1X"` |
| `COLUMN1` | `string?` | `string\|null` | 是 | 依型別（§3）| 欄位清單 / 主線 key / Output | `"COL_LIST"` |
| `COLUMN2` | `string?` | `string\|null` | 是 | 依型別（§3）| 副線 key / Source | `"SOURCE_COL"` |
| `VALUE1`…`VALUE5` | `string?` ×5 | —（合併）| 是 | APF 片段 | 後端分欄存長表達式 | — |
| `VALUE`（合併後）| —（衍生）| `string\|null` | 是 | `VALUE1~5` 以 `\n` 串接（跳過 null）| APF 表達式 / 條件 / CrossRef 欄位清單 | `IF X=="Y" THEN ...` |
| `CLAIM_TIME` | `DateTime?`（DB `DATE`）| `string\|null` | 後端補預設→**非 null** | DB `DATE`；缺省=今天 12:00 | **Block 層級**最後更新（每 block 各自） | — |

**衍生 / 不入庫欄位**：`Block.{x,y,w,h,label,type,raw}`（canvas，§Layer3）；`VALUES[]`（前端聚合）；`DepGraph/ViewNode/TrackerEdge/runtimeValues`（即時算，§6）。

---

## §9 建議的目標資料結構（「應該轉成什麼」— 設計分析）

### 問題：現況是「stringly-typed + 欄位多載」

現在 `RuleData` 用同一組 `KEY/COLUMN1/COLUMN2/VALUE` 裝**所有型別**，**欄位意義隨 `BLOCK_TYPE` 漂移**（§3）。後果：
- 每個 consumer 都要 `if (type === "Function")…` 自己重判、重 parse（`depGraph.ts`、`BlockInspector`、search 各做一次）。
- 非法狀態可表示（Database 卻有 VALUE、Function 卻填 COLUMN1）→ 靠註解約束，編譯器擋不住。
- `VALUE` 是裸字串，每個功能各自 parse APF → 重工且不一致。

### 建議：依型別收斂成 **discriminated union（tagged union）+ APF AST**

```ts
type BlockBase = {
  id: string;                 // BLOCK_NAME（去 [n]）
  rule: { phase: string; name: string };
  group: string;              // BLOCK_GROUP
  seq: number;                // BLOCK_SEQ → number
  pos: { x: number; y: number };
  preBlocks: { primary?: string; secondary?: string };  // PREBLOCK[0]/[1]
  claimTime: string | null;   // CLAIM_TIME（Block 層級，每 block 各自；DB DATE）
  // BLOCK_CODE：使用者 2026-06-27 決定暫不納入，先不放
};

// 為「模擬資料實證的 5 種」+「使用者已確認語意的 9 種（Union/Rule/Sort/Batch/Compress/MacroFunction/MacroExport/Cumulate/CrossRef，📝 待進 mock）」定義專屬變體；其餘 34 種一律走 RawBlock，不預先臆造
type DatabaseBlock       = BlockBase & { kind: "database"; tableName: string; columns: string[] };  // KEY=DB 表名, COLUMN1=該表欄位（逗號）
type ImportBlock         = BlockBase & { kind: "import"; importTable: string; columns: string[] };   // KEY + COLUMN1
type FunctionBlock       = BlockBase & { kind: "function"; outputVar: string; expr: ApfExpr };       // KEY + VALUE(APF)
type SelectBlock         = BlockBase & { kind: "select"; condition: ApfExpr };                       // VALUE(布林)；舊名 Filter（僅命名差異）
type CrossRefBlock       = BlockBase & { kind: "crossref"; mainColumns: string[]; subColumns: string[]; mergeColumns: string[] };  // 📝 KEY=null, COLUMN1=主線欄位, COLUMN2=副線欄位, VALUE=要從副線併進主線的欄位（皆逗號）；與 Union 差在多了 VALUE
type MacroFunctionBlock  = BlockBase & { kind: "macroFunction"; ruleName: string; outputColumns: string[] };  // 📝 KEY=其他 Rule 名稱, VALUE=該 Rule 輸出欄位（逗號）；COLUMN1/2 待定
type MacroExportBlock    = BlockBase & { kind: "macroExport"; outputColumns: string[] };  // 📝 只有 COLUMN1=輸出的多個欄位（逗號）；KEY/COLUMN2/VALUE 皆 null
type CumulateBlock       = BlockBase & { kind: "cumulate"; newColumn: string; cumulativeOf: string; categories: string[] };  // 📝 KEY=要新增的欄(一筆), COLUMN1="Cumulative of …"(一筆), COLUMN2=categories（逗號）；VALUE 待定
type UnionBlock          = BlockBase & { kind: "union"; mainColumns: string[]; subColumns: string[] };  // 📝 COLUMN1=主線欄位, COLUMN2=副線欄位（2 個 preblock 上下疊合）
type RuleBlock           = BlockBase & { kind: "rule"; rules: string[] };                            // 📝 VALUE 以 ";" 切成規則名清單
type SortBlock           = BlockBase & { kind: "sort"; sortKeys: { column: string; dir: "asc"|"desc" }[] };  // 📝 COLUMN1=欄位（空格分隔）, COLUMN2=方向（1=desc/0=asc，位置對齊）→ zip 成 (欄位,方向) 對
type BatchBlock          = BlockBase & { kind: "batch"; key: string; categories: string[] };          // 📝 KEY=單一欄, COLUMN1=categories（逗號分隔多欄）；COLUMN2/VALUE 待定
type CompressBlock       = BlockBase & { kind: "compress"; outputColumns: string[]; categories: string[] };  // 📝 COLUMN1=output columns（逗號）, COLUMN2=categories columns（逗號）；KEY/VALUE 待定
type DispatchScreenBlock = BlockBase & { kind: "dispatchScreen" };                                   // 純 sink，無欄位
type RawBlock            = BlockBase & { kind: "raw"; blockType: BlockType; key: string|null; column1: string|null; column2: string|null; value: string|null };  // 未出現型別的安全 fallback

type RtdBlock = DatabaseBlock | ImportBlock | FunctionBlock | SelectBlock | CrossRefBlock | UnionBlock | RuleBlock | SortBlock | BatchBlock | CompressBlock | MacroFunctionBlock | MacroExportBlock | CumulateBlock | DispatchScreenBlock | RawBlock;

// APF 表達式：parse 一次，全站共用（取代到處 parseAPF 裸字串）
type ApfExpr = { clauses: { cond: ApfCond | null; result: ApfResult }[] };  // IF cond THEN result / ELSE
```

### 為什麼這樣轉（rationale）

1. **讓非法狀態無法表示** — `kind` 一收斂，欄位名即語意（`outputVar`/`tableAlias`/`mainKey`），不再靠記憶體哪欄是什麼。
2. **parse 一次** — `VALUE`→`ApfExpr` AST 在 boundary 做一次，§11/§12 的稽核功能（hardcode 偵測、where-used、lineage）全部接 AST，不各自重 parse（呼應藍圖）。
3. **型別安全的窮舉** — `switch (block.kind)` 編譯器強制處理所有變體；新增型別不會漏。
4. **Zod 逐變體驗證** — boundary 用 discriminated `z.union`，比現在「整包寬鬆」精準。

### 落地路徑（不動後端、漸進遷移）

- 後端 DTO / `RuleData` **不變**；在 `convertDtosToData` 之後加一個 `classifyBlock(raw: RuleData): RtdBlock` mapper（+ `parseApf(value): ApfExpr`）。
- 未定義型別 → 落 `RawBlock`，**現有畫面零破壞**。
- consumer 逐個從 `raw: RuleData` 改吃 `RtdBlock`（先 depGraph、再 inspector、再 search）。
- ⚠️ **前提**：模擬資料未出現的 34 種型別，其精確欄位在「待補來源」確認前，一律留在 `RawBlock`，**不預先展開變體**。

---

## 待補來源（把 ➖ 的 34 種補實前，不臆造）

目前模擬資料涵蓋 6 種 type，其中 **5 種語意正確**（✅：Database / Import / Function / Select（舊名 Filter）/ DispatchScreen）；`Union`、`Rule`、`Sort`、`Batch`、`Compress`、`MacroFunction`、`MacroExport`、`Cumulate`、`CrossRef` 已有使用者口述語意（📝；`CrossRef` 的 mock 列為舊定義，待重做），其餘 **34 種未出現（§3 標 ➖）**。要逐型補欄位定義，最直接的是 —— **你在模擬資料 `RTDMockData.cs` 補上該型別的範例列**（你正在做的事），或提供：
1. **模擬資料新增該型別的 block**（含真實 KEY / COLUMN / VALUE）→ 我據此回填 §3 與 §9 變體。
2. RTD / APF 產品規格（block 型別與欄位定義文件）。
3. Oracle 來源表欄位註解 / 資料字典（`USER_COL_COMMENTS`）—— 接 DB 後最權威。

---

## References
- **後端（Layer 0）**：`MyDevWebBackend/Models/RTDRuleBlock.cs:52-72`（儲存形狀 VALUE1~5）、`Controllers/RuleViewerController.cs:67-96`（VALUE 合併 `:87`、CLAIM_TIME 預設 `:88`、fab 忽略）、`Models/ApiResponse.cs`（信封無 `code`）、`Data/RTDMockData.cs`（現況 mock）、`Tenant/OracleDbConnectionFactory.cs`（Oracle 預留、未接）
- 型別專屬邏輯：`depGraph.ts:73`（DispatchScreen sink）、`:97-101`（僅 Function 定義變數）、`BlockInspector.tsx:240`（Import）、`:770-787`（各 Body 標籤）
- 型別：`types.ts`（DTO `:39-54`、RuleData `:57-69`、BlockValue `:72-77`、BlockType `:80-134`、Block `:136-145`）
- API + 欄位語意：`api.ts:120-145`
- 合併邏輯：`dataTransform.ts`
- Canvas 衍生：`blockUtils.ts:13-32`
- 顯示層欄位標籤：`BlockInspector.tsx:770-787`
- 拓樸鐵則背景：memory `rtd-function-single-preblock`
