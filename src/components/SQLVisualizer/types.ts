export type StmtType = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "FOR_LOOP" | "OTHER";

export interface JoinRelation {
  leftTable: string;
  rightTable: string;
  joinType: string;
  onClause: string;
}

export interface ParsedStatement {
  index: number;
  type: StmtType;
  raw: string;
  brief: string;
  tables: string[];
  targetTable?: string;
  joins: JoinRelation[];
  conditions: string[];
  caseClauses: string[];
  startLine: number;
  endLine: number;
}

export interface TableStat {
  name: string;
  readCount: number;
  writeCount: number;
  truncateCount: number;
}

export interface SqlAnalysis {
  statements: ParsedStatement[];
  tableStats: Record<string, TableStat>;
  allJoins: { left: string; right: string; type: string }[];
  totalSelect: number;
  totalInsert: number;
  totalUpdate: number;
  totalDelete: number;
  totalTruncate: number;
  totalForLoop: number;
}
