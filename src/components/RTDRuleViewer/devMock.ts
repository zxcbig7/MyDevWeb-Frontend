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
//   APF_FORMAT→ APF_NORMALIZER,    APF_FIELD_MAPPER,  APF_RECIPE_BUILDER
// ============================================================

import { BlockTypes, type RuleData, type EqpRuleListDTO } from "./types";

// ── DEV Phase（主副線視覺測試） ───────────────────────────────
export const DEV_MOCK_PHASE = "DEV";
export const DEV_MOCK_RULE_NAME = "__DEV_Example__";
export const DEV_MOCK_RULE_NAME_ICON = "__DEV_Example_ICONS__";


// #region 各種 Block 類型示例（10 欄 grid，每格 100px）
function iconBlock(name: string, type: string, col: number, row: number): RuleData {
  return {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME_ICON,
    BLOCK_NAME: name, BLOCK_TYPE: type,
    BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "Key Test", POSX: col * 100, POSY: row * 100,
    PREBLOCK: null, VALUES: [
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
export const MOCK_PHASES = ["DEV", "APF_FORMAT"] as const;
export type MockPhase = typeof MOCK_PHASES[number];

export const MOCK_RULES_BY_PHASE: Record<MockPhase, string[]> = {
  DEV: ["APF_NORMALIZER", "APF_FIELD_MAPPER", "APF_RECIPE_BUILDER"],
  APF_FORMAT: ["APF_NORMALIZER", "APF_FIELD_MAPPER", "APF_RECIPE_BUILDER"],
};

// ── EQP ↔ Rule 對照表（所有 Phase 平鋪） ────────────────────
export const MOCK_EQP_RULES: EqpRuleListDTO[] = [
  { PHASE: DEV_MOCK_PHASE, EQP_ID: "TOOL-DEV-MOCKRULE", RULE_NAME: DEV_MOCK_RULE_NAME },
  { PHASE: DEV_MOCK_PHASE, EQP_ID: "TOOL-DEV-IconRule", RULE_NAME: DEV_MOCK_RULE_NAME_ICON },
  { PHASE: "APF_FORMAT", EQP_ID: "APF-FMT-001", RULE_NAME: "APF_NORMALIZER" },
  { PHASE: "APF_FORMAT", EQP_ID: "APF-FMT-002", RULE_NAME: "APF_FIELD_MAPPER" },
  { PHASE: "APF_FORMAT", EQP_ID: "APF-FMT-003", RULE_NAME: "APF_RECIPE_BUILDER" },
  { PHASE: "APF_FORMAT", EQP_ID: "APF-FMT-004", RULE_NAME: "APF_RECIPE_BUILDER" },
  { PHASE: "APF_FORMAT", EQP_ID: "APF-FMT-004", RULE_NAME: "APF_FIELD_MAPPER" },
];

// DEV 資料整理
export const DEV_MOCK_RULES: RuleData[] = [
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Repository1", BLOCK_TYPE: BlockTypes.Repository, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.apf", POSX: 300, POSY: 100, PREBLOCK: null, VALUES: [
      { COLUMN1: "col1,col2,col3", COLUMN2: null, VALUE: null },
    ],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "MacroImport01", BLOCK_TYPE: BlockTypes.MacroImport, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 400, POSY: 100, PREBLOCK: null, VALUES: [],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Index01", BLOCK_TYPE: BlockTypes.Index, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 400, POSY: 300, PREBLOCK: ["MacroImport01", "Repository1"],
    VALUES: [
      { COLUMN1: "col1,col2,col3", COLUMN2: "col1,col2,col3", VALUE: null },
    ],
  },
  {
    PHASE: "DEV", RULE_NAME: DEV_MOCK_RULE_NAME,
    BLOCK_NAME: "Function1", BLOCK_TYPE: BlockTypes.Function, BLOCK_GROUP: "G1", BLOCK_SEQ: "1",
    KEY: "test.txt", POSX: 600, POSY: 300, PREBLOCK: ["Index01"],
    VALUES: [
      { COLUMN1: "col1", COLUMN2: null, VALUE: "null" },
      { COLUMN1: "col2", COLUMN2: null, VALUE: "null" },
      { COLUMN1: "col3", COLUMN2: null, VALUE: "null" },
    ],
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

// CaseQuery 實驗用
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
  "DEV": DEV_MOCK_RULES,
};
