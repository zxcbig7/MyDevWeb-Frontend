// ============================================================
// generalTable.ts
// TableInspector 雙格式正規化層（spec: 2026-06-17-table-inspector-general-col）
//   - parseGeneralColTable：general-col 寬表 pivot 成正常表
//   - normalizeTableSource：兩種來源格式 → { columns, rows } 餵 TableInspector
// ============================================================

export type TableRow = Record<string, string | null>;

export type ParsedTable = {
  columns: string[];
  types: string[]; // 各欄型別（本版僅解析、不使用於排序/對齊）
  rows: TableRow[];
};

// 兩種來源格式（union）
export type TableSource =
  | { kind: "columns-rows"; columns: string[]; rows: string[][] }
  | { kind: "general-col"; raw: string[][]; tableName?: string };

const META_COLS = 2; // [TABLE_NAME, TYPE]
const MAX_DATA_COLS = 25;

// 取一列的資料欄部分（去掉前兩個 meta 欄，上限 25）
const dataSlice = (row: string[] | undefined): string[] =>
  (row ?? []).slice(META_COLS, META_COLS + MAX_DATA_COLS);

// 欄名去重：重複者加序號（c1, c1_2, c1_3…）
function dedupeColumns(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    return n === 1 ? name : `${name}_${n}`;
  });
}

/**
 * general-col 寬表 pivot。
 * 輸入 raw：每列 = [TABLE_NAME, TYPE, COL1..COL25]，TYPE ∈ columns/type/data。
 * 給 tableName 時只取該表的列（多表混在一起的情況）。
 */
export function parseGeneralColTable(
  raw: string[][],
  tableName?: string,
): ParsedTable {
  const rows0 = tableName ? raw.filter((r) => r[0] === tableName) : raw;
  const byType = (t: string): string[][] =>
    rows0.filter((r) => (r[1] ?? "").trim().toLowerCase() === t);

  const colRow = byType("columns")[0];
  const typeRow = byType("type")[0];
  const dataRows = byType("data");

  // 欄名：取到第一個空值為止（trim 尾欄）；缺 columns 列 → fallback COL1..COLN
  let columns: string[] = [];
  if (colRow) {
    for (const cell of dataSlice(colRow)) {
      const name = (cell ?? "").trim();
      if (name === "") break; // 連續欄名，遇空即截斷
      columns.push(name);
    }
  } else if (dataRows.length > 0) {
    const n = Math.min(
      MAX_DATA_COLS,
      Math.max(...dataRows.map((r) => dataSlice(r).length)),
    );
    columns = Array.from({ length: n }, (_, i) => `COL${i + 1}`);
  }
  columns = dedupeColumns(columns);

  const N = columns.length;
  const types = dataSlice(typeRow)
    .slice(0, N)
    .map((t) => (t ?? "").trim());

  const rows: TableRow[] = dataRows.map((r) => {
    const vals = dataSlice(r);
    const obj: TableRow = {};
    columns.forEach((col, i) => {
      const v = vals[i];
      obj[col] = v === undefined ? null : v; // 不足補 null；超過 N 自然截斷
    });
    return obj;
  });

  return { columns, types, rows };
}

/** 既有 {Columns, Rows} → ParsedTable（zip） */
function fromColumnsRows(columns: string[], rows: string[][]): ParsedTable {
  const cols = dedupeColumns(columns);
  const parsed: TableRow[] = rows.map((row) => {
    const obj: TableRow = {};
    cols.forEach((col, i) => {
      const v = row[i];
      obj[col] = v === undefined ? null : v;
    });
    return obj;
  });
  return { columns: cols, types: [], rows: parsed };
}

/** 兩種來源格式統一正規化成 ParsedTable（餵 TableInspector） */
export function normalizeTableSource(src: TableSource): ParsedTable {
  if (src.kind === "general-col") {
    return parseGeneralColTable(src.raw, src.tableName);
  }
  return fromColumnsRows(src.columns, src.rows);
}
