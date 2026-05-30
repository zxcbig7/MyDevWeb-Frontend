// ============================================================
// types.ts
// 所有共用型別定義集中在這裡
// ============================================================

// ── API 回傳的原始資料結構 ──────────────────────────────────

// 單一資料源：Phase
export interface PhaseDTO {
  PHASE: string;
};


// 單一資料源： Rule
export interface RuleListDTO {
  RULE_NAME: string;
};

// 單一資料源：包含 Phase / EQP / Rule 的完整對照
export interface EqpRuleListDTO {
  PHASE: string;
  EQP_ID: string;
  RULE_NAME: string;
};

// 取得 Rule 所有資訊
export interface RuleInfoDTO {
  PHASE: string | null;
  RULE_NAME: string | null;
  BLOCK_NAME: string | null;
  BLOCK_TYPE: string | null;
  BLOCK_GROUP: string | null;
  BLOCK_SEQ: string | null;
  KEY: string | null;
  POSX: number | null;
  POSY: number | null;
  PREBLOCK: string | null;
  COLUMN1: string | null;
  COLUMN2: string | null;
  VALUE: string | null;
  CLAIM_TIME: string | null;
};

// ── 資料轉換後的 Block 資料 ─────────────────────────────────
export type RuleData = {
  PHASE: string | null;
  RULE_NAME: string;
  BLOCK_NAME: string;
  BLOCK_TYPE: string;
  BLOCK_GROUP: string;
  BLOCK_SEQ: string;
  POSX: number | null;
  POSY: number | null;
  /** 前置 Block 名稱，長度 0-2。[0] = 主線來源，[1] = 副線來源（選用） */
  PREBLOCK: string[] | null;
  VALUES: BlockValue[];
};

// ── 合併後單一條件的 Value ──────────────────────────────────
export interface BlockValue {
  KEY: string | null;
  COLUMN1: string | null;
  COLUMN2: string | null;
  VALUE: string | null;
};

// ── Block 類型（對應 /public/ Icons 圖片名稱） ────────
export const BlockTypes = {
  // 正式類型
  Action: "Action",
  Annotation: "Annotation",
  Bar: "Bar",
  Barline: "Barline",
  Batch: "Batch",
  BoxPlot: "BoxPlot",
  Compress: "Compress",
  Cumulate: "Cumulate",
  Data: "Data",
  DataSource: "DataSource",
  Delta: "Delta",
  DispatchScreen: "DispatchScreen",
  Duration: "Duration",
  EventMaker: "EventMaker",
  Filter: "Filter",
  Function: "Function",
  Gantt: "Gantt",
  HyperLink: "HyperLink",
  Import: "Import",
  Index: "Index",
  Join: "Join",
  Line: "Line",
  LoopBegin: "LoopBegin",
  LoopEnd: "LoopEnd",
  MacroExport: "MacroExport",
  MacroFunction: "MacroFunction",
  MacroImport: "MacroImport",
  MacroParameter: "MacroParameter",
  Percentage: "Percentage",
  Pie: "Pie",
  Procedure: "Procedure",
  Product: "Product",
  Repository: "Database",
  ResultTable: "ResultTable",
  Rule: "Rule",
  Select: "Select",
  Snapshot: "Snapshot",
  Sort: "Sort",
  SQL: "SQL",
  StackBar: "StackBar",
  StackBarLine: "StackBarLine",
  StackTemporal: "StackTemporal",
  Table: "Table",
  Tag: "Tag",
  TempMaker: "TempMaker",
  Temporal: "Temporal",
  Union: "Union",
  XY: "XY",
  XYTable: "XYTable",
} as const;

// 包裝成 enum 這樣就不用處理 string
export type BlockType = (typeof BlockTypes)[keyof typeof BlockTypes];


export type Block = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BlockType;
  label: string;
  raw: RuleData;
};

// ── 箭頭 ────────────────────────────────────────────────────
export type Arrow = {
  from: string;
  to: string;
  isPrimary: boolean;
  isMainLine: boolean;
};

export type ArrowRenderStyle = {
  isPrimary: boolean;
  scale: number;
};

// ── 連線方向 ────────────────────────────────────────────────
export const Sides = {
  LEFT: "left",
  RIGHT: "right",
  BOTTOM: "bottom",
  TOP: "top"
} as const;

export type Side = (typeof Sides)[keyof typeof Sides];

// ── RuleView 暴露給父層的 handle ────────────────────────────
export type RuleViewHandle = {
  focusBlockById: (id: string) => void;
  openInspectorById: (id: string) => void;
};
