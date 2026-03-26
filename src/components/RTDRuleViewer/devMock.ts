// ============================================================
// devMock.ts
// 開發用假資料
//
// 設計原則：
//   每筆 VALUES 只做一件事：用判斷式決定一個變數的值
//   COLUMN1 = 被設定的變數名稱
//   VALUE   = 決定該變數值的單一運算式（可含 IF/ELSE）
//
// 結構：
//   DEV       → __DEV_主副線範例__（主副線視覺測試）
//   APF_CHECK → APF_LOT_VALIDATOR, APF_RECIPE_CHECK, APF_LOT_SCHEDULER
// ============================================================

import { BlockTypes, type EqpRuleDTO, type RuleData } from "./types";

// ── DEV Phase（主副線視覺測試） ───────────────────────────────
export const DEV_MOCK_PHASE = "DEV";
export const DEV_MOCK_RULE_NAME = "__DEV_Example__";
export const DEV_MOCK_RULE_NAME_ICON = "__DEV_Example_ICONS__";

export const DEV_MOCK_RULES: RuleData[] = [
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Repository1", BLOCK_TYPE: BlockTypes.Repository, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.apf", POSX: 300, POSY: 100, PRE_BLOCK: null, VALUES: [
      { COLUMN1: "col1,col2,col3", COLUMN2: null, VALUE: null },
    ],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "MacroImport01", BLOCK_TYPE: BlockTypes.MacroImport, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 400, POSY: 100, PRE_BLOCK: null, VALUES: [],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Index01", BLOCK_TYPE: BlockTypes.Index, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 400, POSY: 300, PRE_BLOCK: ["MacroImport01", "Repository1"],
    VALUES: [
      { COLUMN1: "col1,col2,col3", COLUMN2: "col1,col2,col3", VALUE: null },
    ],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Function1", BLOCK_TYPE: BlockTypes.Function, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 600, POSY: 300, PRE_BLOCK: ["Index01"],
    VALUES: [
      { COLUMN1: "col1", COLUMN2: null, VALUE: "null" },
      { COLUMN1: "col2", COLUMN2: null, VALUE: "null" },
      { COLUMN1: "col3", COLUMN2: null, VALUE: "null" },
    ],
  },

];

// #region 各種 Block 類型示例（10 欄 grid，每格 100px）
function iconBlock(name: string, type: string, col: number, row: number): RuleData {
  return {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME_ICON,
    BLOCK_NAME: name, BLOCK_TYPE: type,
    BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "Key Test", POSX: col * 100, POSY: row * 100,
    PRE_BLOCK: null, VALUES: [
      { COLUMN1: null, COLUMN2: null, VALUE: '"Key Test"' },
      { COLUMN1: "Col1", COLUMN2: null, VALUE: '"Key Test"' },
      { COLUMN1: "Col2", COLUMN2: "Col3", VALUE: '"Key Test"' },
    ],
  };
}

export const DEV_MOCK_RULE_ICON: RuleData[] = [
  // Input (row 0)
  iconBlock("Data", BlockTypes.Data, 0, 0),
  iconBlock("DataSource", BlockTypes.DataSource, 1, 0),
  iconBlock("Import", BlockTypes.Import, 2, 0),
  iconBlock("MacroImport", BlockTypes.MacroImport, 3, 0),
  iconBlock("MacroParameter", BlockTypes.MacroParameter, 4, 0),
  iconBlock("Repository", BlockTypes.Repository, 5, 0),
  iconBlock("SQL", BlockTypes.SQL, 6, 0),
  iconBlock("Tag", BlockTypes.Tag, 7, 0),

  // Data (row 1)
  iconBlock("Index", BlockTypes.Index, 0, 1),
  iconBlock("Join", BlockTypes.Join, 1, 1),
  iconBlock("MacroFunction", BlockTypes.MacroFunction, 2, 1),
  iconBlock("Procedure", BlockTypes.Procedure, 3, 1),
  iconBlock("Union", BlockTypes.Union, 4, 1),

  // Function (row 2–3)
  iconBlock("Batch", BlockTypes.Batch, 0, 2),
  iconBlock("Compress", BlockTypes.Compress, 1, 2),
  iconBlock("Cumulate", BlockTypes.Cumulate, 2, 2),
  iconBlock("Delta", BlockTypes.Delta, 3, 2),
  iconBlock("Duration", BlockTypes.Duration, 4, 2),
  iconBlock("EventMaker", BlockTypes.EventMaker, 5, 2),
  iconBlock("Filter", BlockTypes.Filter, 6, 2),
  iconBlock("Function", BlockTypes.Function, 7, 2),
  iconBlock("HyperLink", BlockTypes.HyperLink, 8, 2),
  iconBlock("LoopBegin", BlockTypes.LoopBegin, 9, 2),
  iconBlock("LoopEnd", BlockTypes.LoopEnd, 0, 3),
  iconBlock("Percentage", BlockTypes.Percentage, 1, 3),
  iconBlock("Product", BlockTypes.Product, 2, 3),
  iconBlock("Rule", BlockTypes.Rule, 3, 3),
  iconBlock("Select", BlockTypes.Select, 4, 3),
  iconBlock("Snapshot", BlockTypes.Snapshot, 5, 3),
  iconBlock("Sort", BlockTypes.Sort, 6, 3),
  iconBlock("TempMaker", BlockTypes.TempMaker, 7, 3),

  // Output (row 4–5)
  iconBlock("Action", BlockTypes.Action, 0, 4),
  iconBlock("Bar", BlockTypes.Bar, 1, 4),
  iconBlock("Barline", BlockTypes.Barline, 2, 4),
  iconBlock("BoxPlot", BlockTypes.BoxPlot, 3, 4),
  iconBlock("DispatchScreen", BlockTypes.DispatchScreen, 4, 4),
  iconBlock("Gantt", BlockTypes.Gantt, 5, 4),
  iconBlock("Line", BlockTypes.Line, 6, 4),
  iconBlock("MacroExport", BlockTypes.MacroExport, 7, 4),
  iconBlock("Pie", BlockTypes.Pie, 8, 4),
  iconBlock("ResultTable", BlockTypes.ResultTable, 9, 4),
  iconBlock("StackBar", BlockTypes.StackBar, 0, 5),
  iconBlock("StackBarLine", BlockTypes.StackBarLine, 1, 5),
  iconBlock("StackTemporal", BlockTypes.StackTemporal, 2, 5),
  iconBlock("Table", BlockTypes.Table, 3, 5),
  iconBlock("Temporal", BlockTypes.Temporal, 4, 5),
  iconBlock("XY", BlockTypes.XY, 5, 5),
  iconBlock("XYTable", BlockTypes.XYTable, 6, 5),

  // Other (row 6)
  iconBlock("Annotation", BlockTypes.Annotation, 0, 6),
];
// #endregion

// ── APF Phase 定義 ────────────────────────────────────────────
export const MOCK_PHASES = ["APF_CHECK"] as const;
export type MockPhase = typeof MOCK_PHASES[number];

export const MOCK_RULES_BY_PHASE: Record<MockPhase, string[]> = {
  APF_CHECK: ["APF_LOT_VALIDATOR", "APF_RECIPE_CHECK", "APF_LOT_SCHEDULER"],
};

// ── 機台 ↔ Rule 對照表（各 Phase） ──────────────────────────
export const MOCK_EQP_RULES: EqpRuleDTO[] = [
  { PHASE: DEV_MOCK_PHASE, EQP_ID: "TOOL-DEV-001", RULE_NAME: DEV_MOCK_RULE_NAME },
  { PHASE: DEV_MOCK_PHASE, EQP_ID: "TOOL-DEV-002", RULE_NAME: DEV_MOCK_RULE_NAME_ICON },

  { PHASE: "APF_CHECK", EQP_ID: "EQP-A01", RULE_NAME: "APF_LOT_VALIDATOR" },
  { PHASE: "APF_CHECK", EQP_ID: "EQP-A02", RULE_NAME: "APF_LOT_VALIDATOR" },
  { PHASE: "APF_CHECK", EQP_ID: "EQP-B01", RULE_NAME: "APF_RECIPE_CHECK" },
  { PHASE: "APF_CHECK", EQP_ID: "EQP-C01", RULE_NAME: "APF_LOT_SCHEDULER" },
  // 一台機台對應三條 Rule 的測試案例
  { PHASE: "EQP_CHOSE_CHECK", EQP_ID: "EQP_1", RULE_NAME: "APF_LOT_VALIDATOR" },
  { PHASE: "EQP_CHOSE_CHECK", EQP_ID: "EQP_2", RULE_NAME: "APF_LOT_SCHEDULER" },
  { PHASE: "EQP_CHOSE_CHECK", EQP_ID: "EQP_2", RULE_NAME: "APF_RECIPE_CHECK" },
];

// ── APF_CHECK / APF_LOT_VALIDATOR ────────────────────────────
//
// 變數依賴鏈（往前追蹤示意）：
//   LOG_LEVEL  ← HOLD_REASON  ← HOLD_FLAG   ← LOT_ID   (3 層)
//   LOG_LEVEL  ← HOLD_REASON  ← WAIT_HR     ← STAGE    ← LOT_ID  (4 層)
//   NOTIFY_FLAG← HOLD_REASON  ← LOT_GRADE   ← LOT_ID
//
// 反藍 Log 格式：THEN "[$拒絕理由$]"
//   [$ALREADY_ON_HOLD$]   — 批次已在 Hold 狀態
//   [$WAIT_OVER_LIMIT$]   — 等待時間超過上限
//   [$LOT_FORMAT_INVALID$]— Lot ID 格式錯誤
//
//   START → GET_LOT_ATTR → GET_WAIT_INFO → CHECK_HOLD
//             → LOT_VALID   ─(主)→ MERGE_VAL → LOG_RESULT → END
//             ↘ LOT_INVALID ─(副)↗
const APF_LOT_VALIDATOR: RuleData[] = [
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "START_LOT_VAL", BLOCK_TYPE: "START", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "1",
    KEY: null, POSX: 300, POSY: 50, PRE_BLOCK: null, VALUES: [],
  },
  {
    // 從 DB 取得批次基本屬性（LOT_ID 為輸入參數）
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "GET_LOT_ATTR", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "2",
    KEY: "LOT_ID", POSX: 300, POSY: 200, PRE_BLOCK: ["START_LOT_VAL"],
    VALUES: [
      { COLUMN1: "STAGE", COLUMN2: "LOT_ID", VALUE: "GetCurrentStage(LOT_ID)" },
      { COLUMN1: "LOT_GRADE", COLUMN2: "LOT_ID", VALUE: "GetLotGrade(LOT_ID)" },
      { COLUMN1: "HOLD_FLAG", COLUMN2: "LOT_ID", VALUE: "GetHoldFlag(LOT_ID)" },
    ],
  },
  {
    // 依 STAGE 取得等待時間與上限（STAGE 來自上一個 Block）
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "GET_WAIT_INFO", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "3",
    KEY: "STAGE", POSX: 300, POSY: 370, PRE_BLOCK: ["GET_LOT_ATTR"],
    VALUES: [
      { COLUMN1: "MAX_WAIT_HR", COLUMN2: "STAGE", VALUE: "GetMaxWaitHours(STAGE, LOT_GRADE)" },
      { COLUMN1: "WAIT_HR", COLUMN2: "STAGE", VALUE: "GetWaitHours(LOT_ID, STAGE)" },
    ],
  },
  {
    // 判斷是否需要 Hold，THEN 寫入反藍 Log（[$...$] 格式）
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "CHECK_HOLD", BLOCK_TYPE: "DECISION", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "4",
    KEY: "DISABLE_REASON", POSX: 300, POSY: 540, PRE_BLOCK: ["GET_WAIT_INFO"],
    VALUES: [
      {
        COLUMN1: "HOLD_REASON", COLUMN2: "HOLD_FLAG",
        VALUE: 'IF HOLD_FLAG = "Y"                    THEN "HOLD"\nELSE IF WAIT_HR > MAX_WAIT_HR           THEN "OVERTIME"\nELSE IF ValidateLotFmt(LOT_ID) = "FAIL" THEN "INVALID"\nELSE "PASS"'
      },
      {
        COLUMN1: "DISABLE_REASON", COLUMN2: "HOLD_FLAG",
        VALUE: 'IF HOLD_FLAG = "Y"                    THEN "[$ALREADY_ON_HOLD$]"\nELSE IF WAIT_HR > MAX_WAIT_HR           THEN "[$WAIT_OVER_LIMIT$]"\nELSE IF ValidateLotFmt(LOT_ID) = "FAIL" THEN "[$LOT_FORMAT_INVALID$]"\nELSE ""'
      },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "LOT_VALID", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "5",
    KEY: null, POSX: 130, POSY: 730, PRE_BLOCK: ["CHECK_HOLD"],
    VALUES: [
      { COLUMN1: "LOT_STATUS", COLUMN2: null, VALUE: '"VALID"' },
      { COLUMN1: "PASS_MSG", COLUMN2: "LOT_ID", VALUE: 'ConcatMsg("LOT_OK", LOT_ID)' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "LOT_INVALID", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "6",
    KEY: null, POSX: 470, POSY: 730, PRE_BLOCK: ["CHECK_HOLD"],
    VALUES: [
      { COLUMN1: "LOT_STATUS", COLUMN2: "HOLD_REASON", VALUE: "HOLD_REASON" },
      { COLUMN1: "HOLD_MSG", COLUMN2: "HOLD_REASON", VALUE: 'FormatHoldMsg(LOT_ID, HOLD_REASON)' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "MERGE_VAL", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "7",
    KEY: null, POSX: 300, POSY: 910,
    PRE_BLOCK: ["LOT_VALID", "LOT_INVALID"], // [0]=主線 [1]=副線
    VALUES: [
      { COLUMN1: "MERGE_STATUS", COLUMN2: "LOT_STATUS", VALUE: 'MergeValidation(LOT_STATUS, HOLD_REASON)' },
      { COLUMN1: "NOTIFY_FLAG", COLUMN2: "LOT_GRADE", VALUE: 'IF LOT_GRADE = "A" AND HOLD_REASON != "PASS" THEN "Y" ELSE "N"' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "LOG_RESULT", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "8",
    KEY: null, POSX: 300, POSY: 1080, PRE_BLOCK: ["MERGE_VAL"],
    VALUES: [
      { COLUMN1: "LOG_LEVEL", COLUMN2: "HOLD_REASON", VALUE: 'IF HOLD_REASON = "PASS" THEN "INFO" ELSE "HOLD"' },
      { COLUMN1: "LOG_DETAIL", COLUMN2: "HOLD_REASON", VALUE: 'IF HOLD_REASON = "PASS" THEN LOT_ID ELSE ConcatStr(LOT_ID, HOLD_REASON)' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_VALIDATOR",
    BLOCK_NAME: "END_LOT_VAL", BLOCK_TYPE: "END", BLOCK_GROUP: "VALIDATE", BLOCK_SEQ: "9",
    KEY: null, POSX: 300, POSY: 1240, PRE_BLOCK: ["LOG_RESULT"], VALUES: [],
  },
];

// ── APF_CHECK / APF_RECIPE_CHECK ─────────────────────────────
//
// 變數依賴鏈：
//   ALERT_FLAG  ← VER_STATUS  ← RECIPE_VER  ← RECIPE_NAME  (3 層)
//   ALERT_FLAG  ← VER_STATUS  ← EXPIRY_DATE ← RECIPE_VER   ← RECIPE_NAME  (4 層)
//
// 反藍 Log 格式：
//   [$RECIPE_VER_MISSING$]  — Recipe 版本不存在
//   [$RECIPE_EXPIRED$]      — Recipe 版本已過期
//   [$RECIPE_APPLY_FAIL$]   — 套用 Recipe 失敗
//
//   START → GET_RECIPE_VER → CHECK_VER_VALID → APPLY_RECIPE   ─(主)→ MERGE_RECIPE → END
//                                            ↘ DEFAULT_RECIPE ─(副)↗
const APF_RECIPE_CHECK: RuleData[] = [
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "START_RCP_CHK", BLOCK_TYPE: "START", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "1",
    KEY: "LOTLIST.sql", POSX: 300, POSY: 50, PRE_BLOCK: null, VALUES: [],
  },
  {
    // 取得 Recipe 版本與到期日（RECIPE_NAME 為輸入參數）
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "GET_RECIPE_VER", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "2",
    KEY: "RECIPE_NAME", POSX: 300, POSY: 200, PRE_BLOCK: ["START_RCP_CHK"],
    VALUES: [
      { COLUMN1: "RECIPE_VER", COLUMN2: "RECIPE_NAME", VALUE: "GetRecipeVersion(RECIPE_NAME, EQUIP_CODE)" },
      { COLUMN1: "EXPIRY_DATE", COLUMN2: "RECIPE_VER", VALUE: "GetRecipeExpiry(RECIPE_VER)" },
      { COLUMN1: "$ChamberID", COLUMN2: "EQUIP_CODE", VALUE: "GetChamber(EQUIP_CODE)" },
    ],
  },
  {
    // 判斷版本有效性，THEN 寫入對應反藍 Log
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "CHECK_VER_VALID", BLOCK_TYPE: "DECISION", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "3",
    KEY: "DISABLE_REASON", POSX: 300, POSY: 370, PRE_BLOCK: ["GET_RECIPE_VER"],
    VALUES: [
      {
        COLUMN1: "VER_STATUS", COLUMN2: "RECIPE_VER",
        VALUE: 'IF RECIPE_VER = "" OR RECIPE_VER = "N/A" THEN "MISSING"\nELSE IF EXPIRY_DATE < TODAY()           THEN "EXPIRED"\nELSE "APPLY_LATEST"'
      },
      {
        COLUMN1: "DISABLE_REASON", COLUMN2: "RECIPE_VER",
        VALUE: 'IF RECIPE_VER = "" OR RECIPE_VER = "N/A" THEN "[$RECIPE_VER_MISSING$]"\nELSE IF EXPIRY_DATE < TODAY()           THEN "[$RECIPE_EXPIRED$]"\nELSE ""'
      },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "APPLY_RECIPE", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "4",
    KEY: null, POSX: 140, POSY: 560, PRE_BLOCK: ["CHECK_VER_VALID"],
    VALUES: [
      { COLUMN1: "APPLY_STATUS", COLUMN2: "RECIPE_VER", VALUE: "ApplyRecipe(RECIPE_NAME, RECIPE_VER)" },
      { COLUMN1: "EQUIP_PARAM", COLUMN2: "$ChamberID", VALUE: "SetEquipParam($ChamberID, RECIPE_VER)" },
    ],
  },
  {
    // VER_STATUS 非 APPLY_LATEST → 套用 Default
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "DEFAULT_RECIPE", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "5",
    KEY: null, POSX: 460, POSY: 560, PRE_BLOCK: ["CHECK_VER_VALID"],
    VALUES: [
      { COLUMN1: "APPLY_STATUS", COLUMN2: "VER_STATUS", VALUE: 'IF VER_STATUS = "MISSING" OR VER_STATUS = "EXPIRED" THEN ApplyDefaultRecipe(EQUIP_CODE) ELSE "SKIP"' },
      { COLUMN1: "FALLBACK_LOG", COLUMN2: "DISABLE_REASON", VALUE: "FormatWarn(DISABLE_REASON, RECIPE_NAME, EQUIP_CODE)" },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "MERGE_RECIPE", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "6",
    KEY: null, POSX: 300, POSY: 740,
    PRE_BLOCK: ["APPLY_RECIPE", "DEFAULT_RECIPE"], // [0]=主線 [1]=副線
    VALUES: [
      { COLUMN1: "VERIFY_STATUS", COLUMN2: "EQUIP_CODE", VALUE: "VerifyRecipeApplied(EQUIP_CODE)" },
      { COLUMN1: "DISABLE_REASON", COLUMN2: "APPLY_STATUS", VALUE: 'IF APPLY_STATUS = "FAIL" AND RECIPE_VER != "SKIP" THEN "[$RECIPE_APPLY_FAIL$]" ELSE ""' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_RECIPE_CHECK",
    BLOCK_NAME: "END_RCP_CHK", BLOCK_TYPE: "END", BLOCK_GROUP: "RECIPE", BLOCK_SEQ: "7",
    KEY: null, POSX: 300, POSY: 900, PRE_BLOCK: ["MERGE_RECIPE"], VALUES: [],
  },
];

// ── APF_CHECK / APF_LOT_SCHEDULER ────────────────────────────
//
// 變數依賴鏈：
//   ALERT_FLAG  ← SCHED_STATUS ← EQUIP_STATUS ← EQUIP_CODE   (3 層)
//   WRITE_STATUS← SCHEDULE_TIME← SCHED_STATUS  ← LOT_GRADE   ← LOT_ID  (4 層)
//   ALERT_FLAG  ← SCHED_STATUS ← MAX_QUEUE     ← EQUIP_CODE  (3 層)
//
// 反藍 Log 格式：
//   [$EQUIP_DOWN$]      — 設備故障無法排程
//   [$EQUIP_NOT_READY$] — A 級批次需要設備 IDLE，但設備忙碌
//   [$QUEUE_FULL$]      — 排程佇列已滿
//
//   START → GET_LOT_INFO → GET_EQUIP_INFO → ASSESS_SCHED →
//             → HIGH_PRI_PATH ─(主)→ MERGE_SCHED → UPDATE_SCHEDULE → END
//             → NORM_PRI_PATH ─(副)↗
const APF_LOT_SCHEDULER: RuleData[] = [
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "START_SCHED", BLOCK_TYPE: "START", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "1",
    KEY: null, POSX: 300, POSY: 50, PRE_BLOCK: null, VALUES: [],
  },
  {
    // 取得批次屬性（LOT_ID, EQUIP_CODE 為輸入參數）
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "GET_LOT_INFO", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "2",
    KEY: "LOT_ID", POSX: 300, POSY: 200, PRE_BLOCK: ["START_SCHED"],
    VALUES: [
      { COLUMN1: "LOT_GRADE", COLUMN2: "LOT_ID", VALUE: "GetLotGrade(LOT_ID)" },
      { COLUMN1: "MAX_WAIT", COLUMN2: "LOT_GRADE", VALUE: "GetMaxWaitHours(LOT_GRADE)" },
    ],
  },
  {
    // 取得設備狀態與佇列深度（依 EQUIP_CODE）
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "GET_EQUIP_INFO", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "3",
    KEY: "EQUIP_CODE", POSX: 300, POSY: 370, PRE_BLOCK: ["GET_LOT_INFO"],
    VALUES: [
      { COLUMN1: "EQUIP_STATUS", COLUMN2: "EQUIP_CODE", VALUE: "GetEquipStatus(EQUIP_CODE)" },
      { COLUMN1: "QUEUE_DEPTH", COLUMN2: "EQUIP_CODE", VALUE: "GetQueueDepth(EQUIP_CODE)" },
      { COLUMN1: "MAX_QUEUE", COLUMN2: "EQUIP_CODE", VALUE: "GetMaxQueueSize(EQUIP_CODE)" },
    ],
  },
  {
    // 判斷是否可排程，THEN 寫入反藍 Log
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "ASSESS_SCHED", BLOCK_TYPE: "DECISION", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "4",
    KEY: "DISABLE_REASON", POSX: 300, POSY: 540, PRE_BLOCK: ["GET_EQUIP_INFO"],
    VALUES: [
      {
        COLUMN1: "SCHED_STATUS", COLUMN2: "EQUIP_STATUS",
        VALUE: 'IF EQUIP_STATUS = "DOWN"                         THEN "FAIL"\nELSE IF LOT_GRADE = "A" AND EQUIP_STATUS != "IDLE"  THEN "WAIT"\nELSE IF QUEUE_DEPTH >= MAX_QUEUE                   THEN "FULL"\nELSE "OK"'
      },
      {
        COLUMN1: "DISABLE_REASON", COLUMN2: "EQUIP_STATUS",
        VALUE: 'IF EQUIP_STATUS = "DOWN"                         THEN "[$EQUIP_DOWN$]"\nELSE IF LOT_GRADE = "A" AND EQUIP_STATUS != "IDLE"  THEN "[$EQUIP_NOT_READY$]"\nELSE IF QUEUE_DEPTH >= MAX_QUEUE                   THEN "[$QUEUE_FULL$]"\nELSE ""'
      },
    ],
  },
  {
    // SCHED_STATUS = "OK" 且 LOT_GRADE = "A" → 高優先排程
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "HIGH_PRI_PATH", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "5",
    KEY: null, POSX: 120, POSY: 730, PRE_BLOCK: ["ASSESS_SCHED"],
    VALUES: [
      { COLUMN1: "PRIORITY", COLUMN2: "LOT_GRADE", VALUE: '"HIGH"' },
      { COLUMN1: "SCHEDULE_TIME", COLUMN2: "SCHED_STATUS", VALUE: 'IF SCHED_STATUS = "OK" THEN "IMMEDIATE" ELSE "SKIP"' },
      { COLUMN1: "ASSIGN_FLAG", COLUMN2: "SCHED_STATUS", VALUE: 'IF SCHED_STATUS = "OK" THEN "Y" ELSE "N"' },
    ],
  },
  {
    // LOT_GRADE != "A" → 一般優先排程
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "NORM_PRI_PATH", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "6",
    KEY: null, POSX: 480, POSY: 730, PRE_BLOCK: ["ASSESS_SCHED"],
    VALUES: [
      { COLUMN1: "PRIORITY", COLUMN2: "LOT_GRADE", VALUE: 'IF LOT_GRADE = "B" THEN "NORMAL" ELSE "LOW"' },
      { COLUMN1: "SCHEDULE_TIME", COLUMN2: "MAX_WAIT", VALUE: "CalcNextSlot(EQUIP_CODE, MAX_WAIT)" },
      { COLUMN1: "ASSIGN_FLAG", COLUMN2: "SCHED_STATUS", VALUE: 'IF SCHED_STATUS = "OK" THEN "Y" ELSE "N"' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "MERGE_SCHED", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "7",
    KEY: null, POSX: 300, POSY: 920,
    PRE_BLOCK: ["HIGH_PRI_PATH", "NORM_PRI_PATH"], // [0]=主線 [1]=副線
    VALUES: [
      { COLUMN1: "MERGE_RESULT", COLUMN2: "SCHEDULE_TIME", VALUE: "MergeSchedule(LOT_ID, SCHEDULE_TIME, ASSIGN_FLAG)" },
      { COLUMN1: "EQUIP_RESERVE", COLUMN2: "ASSIGN_FLAG", VALUE: 'IF ASSIGN_FLAG = "Y" THEN ReserveEquip(EQUIP_CODE, SCHEDULE_TIME) ELSE "SKIP"' },
      { COLUMN1: "NOTIFY_FLAG", COLUMN2: "SCHED_STATUS", VALUE: 'IF SCHED_STATUS != "OK" THEN "Y" ELSE "N"' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "UPDATE_SCHEDULE", BLOCK_TYPE: "PROCESS", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "8",
    KEY: null, POSX: 300, POSY: 1090, PRE_BLOCK: ["MERGE_SCHED"],
    VALUES: [
      { COLUMN1: "WRITE_STATUS", COLUMN2: "SCHEDULE_TIME", VALUE: "WriteSchedule(LOT_ID, EQUIP_CODE, SCHEDULE_TIME, PRIORITY)" },
      { COLUMN1: "NOTIFY_SENT", COLUMN2: "DISABLE_REASON", VALUE: 'IF DISABLE_REASON != "" THEN SendAlert(LOT_ID, DISABLE_REASON) ELSE "SKIP"' },
    ],
  },
  {
    PHASE: "APF_CHECK", RULE_NAME: "APF_LOT_SCHEDULER",
    BLOCK_NAME: "END_SCHED", BLOCK_TYPE: "END", BLOCK_GROUP: "SCHED", BLOCK_SEQ: "9",
    KEY: null, POSX: 300, POSY: 1250, PRE_BLOCK: ["UPDATE_SCHEDULE"], VALUES: [],
  },
];

// ── 變數資料來源 Mock（實際由後端 API 提供） ──────────────────

export type VariableSource = {
  variable: string;
  varType: "INPUT" | "COMPUTED" | "LOCAL";
  description?: string;
  sourceTable?: string;
  sourceColumn?: string;
  filterConditions?: string;
  sqlHint?: string;
};

export const MOCK_VAR_SOURCES: Record<string, VariableSource> = {
  LOT_ID: { variable: "LOT_ID", varType: "INPUT", description: "呼叫端傳入的批次 ID" },
  EQUIP_CODE: { variable: "EQUIP_CODE", varType: "INPUT", description: "呼叫端傳入的設備代碼" },
  EQUIP_ID: { variable: "EQUIP_ID", varType: "INPUT", description: "呼叫端傳入的設備 ID" },
  RECIPE_NAME: { variable: "RECIPE_NAME", varType: "INPUT", description: "呼叫端傳入的 Recipe 名稱" },
  STEP_ID: { variable: "STEP_ID", varType: "INPUT", description: "呼叫端傳入的製程步驟 ID" },
  SOURCE_PATH: { variable: "SOURCE_PATH", varType: "INPUT", description: "呼叫端傳入的 APF 原始資料路徑" },
  OUTPUT_FORMAT: { variable: "OUTPUT_FORMAT", varType: "INPUT", description: "呼叫端指定的輸出格式" },
  FILE_SIZE: {
    variable: "FILE_SIZE", varType: "COMPUTED",
    sourceTable: "FILE_SYSTEM", sourceColumn: "FILE_SIZE_BYTES",
    filterConditions: "FILE_PATH = :source_path",
    sqlHint: "SELECT FILE_SIZE_BYTES\nFROM FILE_SYSTEM\nWHERE FILE_PATH = :source_path",
  },
  RECIPE_VER: {
    variable: "RECIPE_VER", varType: "COMPUTED",
    sourceTable: "RECIPE_MASTER", sourceColumn: "VERSION",
    filterConditions: "RECIPE_NAME = :recipe_name\nAND EQUIP_CODE = :equip_code\nAND EFFECTIVE_DATE <= SYSDATE",
    sqlHint: "SELECT VERSION\nFROM RECIPE_MASTER\nWHERE RECIPE_NAME = :recipe_name\n  AND EQUIP_CODE = :equip_code\n  AND EFFECTIVE_DATE <= SYSDATE\nORDER BY EFFECTIVE_DATE DESC\nFETCH FIRST 1 ROWS ONLY",
  },
  LOT_GRADE: {
    variable: "LOT_GRADE", varType: "COMPUTED",
    sourceTable: "WIP_LOT", sourceColumn: "GRADE",
    filterConditions: "LOT_ID = :lot_id",
    sqlHint: "SELECT GRADE\nFROM WIP_LOT\nWHERE LOT_ID = :lot_id",
  },
  HOLD_FLAG: {
    variable: "HOLD_FLAG", varType: "COMPUTED",
    sourceTable: "WIP_LOT", sourceColumn: "HOLD_FLAG",
    filterConditions: "LOT_ID = :lot_id",
    sqlHint: "SELECT HOLD_FLAG\nFROM WIP_LOT\nWHERE LOT_ID = :lot_id",
  },
  EQUIP_STATUS: {
    variable: "EQUIP_STATUS", varType: "COMPUTED",
    sourceTable: "EQP_STATUS", sourceColumn: "STATUS",
    filterConditions: "EQUIP_CODE = :equip_code\nAND RECORD_TIME = (\n  SELECT MAX(RECORD_TIME) FROM EQP_STATUS\n  WHERE EQUIP_CODE = :equip_code\n)",
    sqlHint: "SELECT STATUS\nFROM EQP_STATUS\nWHERE EQUIP_CODE = :equip_code\n  AND RECORD_TIME = (\n    SELECT MAX(RECORD_TIME) FROM EQP_STATUS\n    WHERE EQUIP_CODE = :equip_code\n  )",
  },
  WAIT_HR: {
    variable: "WAIT_HR", varType: "COMPUTED",
    sourceTable: "WIP_QUEUE", sourceColumn: "WAIT_HOURS",
    filterConditions: "LOT_ID = :lot_id AND STAGE = :stage",
    sqlHint: "SELECT WAIT_HOURS\nFROM WIP_QUEUE\nWHERE LOT_ID = :lot_id\n  AND STAGE = :stage",
  },
  MAX_WAIT_HR: {
    variable: "MAX_WAIT_HR", varType: "COMPUTED",
    sourceTable: "STAGE_CONFIG", sourceColumn: "MAX_WAIT_HOURS",
    filterConditions: "STAGE = :stage AND LOT_GRADE = :lot_grade",
    sqlHint: "SELECT MAX_WAIT_HOURS\nFROM STAGE_CONFIG\nWHERE STAGE = :stage\n  AND LOT_GRADE = :lot_grade",
  },
  QUEUE_DEPTH: {
    variable: "QUEUE_DEPTH", varType: "COMPUTED",
    sourceTable: "EQP_QUEUE", sourceColumn: "QUEUE_COUNT",
    filterConditions: "EQUIP_CODE = :equip_code",
    sqlHint: "SELECT QUEUE_COUNT\nFROM EQP_QUEUE\nWHERE EQUIP_CODE = :equip_code",
  },
  MAX_QUEUE: {
    variable: "MAX_QUEUE", varType: "COMPUTED",
    sourceTable: "EQP_CONFIG", sourceColumn: "MAX_QUEUE_SIZE",
    filterConditions: "EQUIP_CODE = :equip_code",
    sqlHint: "SELECT MAX_QUEUE_SIZE\nFROM EQP_CONFIG\nWHERE EQUIP_CODE = :equip_code",
  },
  APPLY_STATUS: {
    variable: "APPLY_STATUS", varType: "COMPUTED",
    sourceTable: "RECIPE_APPLY_LOG", sourceColumn: "STATUS",
    filterConditions: "RECIPE_NAME = :recipe_name AND EQUIP_CODE = :equip_code",
    sqlHint: "SELECT STATUS\nFROM RECIPE_APPLY_LOG\nWHERE RECIPE_NAME = :recipe_name\n  AND EQUIP_CODE = :equip_code\nORDER BY APPLY_TIME DESC\nFETCH FIRST 1 ROWS ONLY",
  },
};

// ── 統一查詢入口 ──────────────────────────────────────────────
export const MOCK_RULE_DATA: Record<string, RuleData[]> = {
  "APF_LOT_VALIDATOR": APF_LOT_VALIDATOR,
  "APF_RECIPE_CHECK": APF_RECIPE_CHECK,
  "APF_LOT_SCHEDULER": APF_LOT_SCHEDULER,
};
