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
export interface ImportTableDTO {
  TableName: string;
  Columns: string[];
  Rows: string[][];
}

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

// ── Tracker 依賴圖（DAG）─ 整條 rule 建一次，所有 log 共用 ────
// spec: specs/2026-06-07-tracker-dep-graph.md
// 唯一真相是圖；顯示用的多元樹（ViewNode）是它的即時投影，不另存。

/** 一條依賴邊：算某變數時引用到的上游變數 */
export type DepRef = {
  varName: string;                 // 指向另一個 VarNode
  role: "cond" | "result";         // 出現在條件 / 結果位置
  snippet: string;                 // 顯示用，如 "HOLD_COUNT > 10"
};

/** 變數的一個定義：哪個 Function block 算出它、依賴誰 */
export type VarDef = {
  block: string;                   // BLOCK_NAME
  blockType: string;               // 目前一律 Function
  deps: DepRef[];
};

/** 變數節點（全域去重，key = varName）。defs 為空 = root（DB 欄位 / 外部輸入）*/
export type VarNode = {
  name: string;
  defs: VarDef[];
};

/** 反藍 log 的進入點（同一 log 可由多個 block / clause 觸發）*/
export type LogEntry = {
  logName: string;
  triggers: { block: string; clauseCond: string; deps: DepRef[] }[];
};

/** 整條 rule 的依賴圖 */
export type DepGraph = {
  vars: Map<string, VarNode>;
  logs: Map<string, LogEntry>;
  roots: string[];                          // 全域 root（無任何 Function 定義 = DB 欄位），已排序
  ancestors: Map<string, Set<string>>;      // 每個 block 沿 PREBLOCK 反向可達的上游 block 集合
};

// ── 顯示用節點（即時算，不存）──────────────────────────────
export type ViewStatus = "normal" | "root" | "cycle" | "shared";

export type ViewNode = {
  varName: string;
  edge: DepRef;                    // 連到父節點那條邊（snippet / role / runtime 值掛這）
  status: ViewStatus;
};

/** 變數展開後、依定義 block 分組的一層 */
export type ExpandedDef = {
  block: string;
  blockType: string;
  children: ViewNode[];
};

/** Tracker canvas 連線：沿真實依賴鏈的 block→block 邊，depth = 對照 tree 的層次顏色 */
export type TrackerEdge = {
  from: string;    // 引用變數的 block（上游 / 父）
  to: string;      // 定義該變數的 block（下游 / 子）
  depth: number;   // 子變數在 tree 的深度（0=blue, 1=emerald, 2=purple, …）
};
