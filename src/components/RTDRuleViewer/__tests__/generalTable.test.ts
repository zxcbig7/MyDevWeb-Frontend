// general-col 寬表 pivot + 雙格式正規化單測（spec: 2026-06-17-table-inspector-general-col）
import { describe, it, expect } from "vitest";
import {
  parseGeneralColTable,
  normalizeTableSource,
} from "../generalTable";

// 一列 = [TABLE_NAME, TYPE, ...cols]
const row = (type: string, ...cols: string[]): string[] => ["T", type, ...cols];

describe("parseGeneralColTable", () => {
  it("基本 pivot：columns 列 → 欄名、data 列 → 資料列", () => {
    const raw = [
      row("columns", "c1", "c2", "c3"),
      row("type", "number", "int", "string"),
      row("data", "1", "2", "C"),
      row("data", "1", "3", "D"),
    ];
    const { columns, types, rows } = parseGeneralColTable(raw);
    expect(columns).toEqual(["c1", "c2", "c3"]);
    expect(types).toEqual(["number", "int", "string"]);
    expect(rows).toEqual([
      { c1: "1", c2: "2", c3: "C" },
      { c1: "1", c2: "3", c3: "D" },
    ]);
  });

  it("尾部未使用欄被砍掉（遇第一個空值截斷）", () => {
    const raw = [
      row("columns", "c1", "c2", "", "c4"), // c2 後遇空 → 只取 c1,c2
      row("data", "a", "b", "x", "y"),
    ];
    const { columns, rows } = parseGeneralColTable(raw);
    expect(columns).toEqual(["c1", "c2"]);
    expect(rows).toEqual([{ c1: "a", c2: "b" }]);
  });

  it("data 列不足補 null、超過截斷", () => {
    const raw = [
      row("columns", "c1", "c2", "c3"),
      row("data", "a"), // 不足 → c2/c3 = null
      row("data", "a", "b", "c", "d"), // 超過 → d 被截斷
    ];
    const { rows } = parseGeneralColTable(raw);
    expect(rows[0]).toEqual({ c1: "a", c2: null, c3: null });
    expect(rows[1]).toEqual({ c1: "a", c2: "b", c3: "c" });
  });

  it("缺 columns 列 → fallback COL1..COLN（取最長 data 列）", () => {
    const raw = [
      row("data", "a", "b"),
      row("data", "a", "b", "c"),
    ];
    const { columns, rows } = parseGeneralColTable(raw);
    expect(columns).toEqual(["COL1", "COL2", "COL3"]);
    expect(rows[0]).toEqual({ COL1: "a", COL2: "b", COL3: null });
  });

  it("重複欄名 → 加序號", () => {
    const raw = [row("columns", "c", "c", "c"), row("data", "1", "2", "3")];
    const { columns, rows } = parseGeneralColTable(raw);
    expect(columns).toEqual(["c", "c_2", "c_3"]);
    expect(rows[0]).toEqual({ c: "1", c_2: "2", c_3: "3" });
  });

  it("超過 25 欄 → 上限 25", () => {
    const many = Array.from({ length: 30 }, (_, i) => `c${i + 1}`);
    const raw = [["T", "columns", ...many]];
    const { columns } = parseGeneralColTable(raw);
    expect(columns).toHaveLength(25);
    expect(columns[24]).toBe("c25");
  });

  it("TYPE 大小寫不敏感", () => {
    const raw = [
      ["T", "COLUMNS", "c1"],
      ["T", "Data", "v"],
    ];
    const { columns, rows } = parseGeneralColTable(raw);
    expect(columns).toEqual(["c1"]);
    expect(rows).toEqual([{ c1: "v" }]);
  });

  it("給 tableName → 只取該表的列", () => {
    const raw = [
      ["T1", "columns", "c1"],
      ["T1", "data", "a"],
      ["T2", "columns", "x1"],
      ["T2", "data", "z"],
    ];
    const { columns, rows } = parseGeneralColTable(raw, "T2");
    expect(columns).toEqual(["x1"]);
    expect(rows).toEqual([{ x1: "z" }]);
  });

  it("空 raw → 空表", () => {
    const { columns, rows } = parseGeneralColTable([]);
    expect(columns).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe("normalizeTableSource", () => {
  it("columns-rows 格式 → zip 成 rows", () => {
    const res = normalizeTableSource({
      kind: "columns-rows",
      columns: ["a", "b"],
      rows: [
        ["1", "2"],
        ["3"], // 不足補 null
      ],
    });
    expect(res.columns).toEqual(["a", "b"]);
    expect(res.rows).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: null },
    ]);
  });

  it("general-col 格式 → 委派 parseGeneralColTable", () => {
    const res = normalizeTableSource({
      kind: "general-col",
      raw: [row("columns", "c1"), row("data", "v")],
    });
    expect(res.columns).toEqual(["c1"]);
    expect(res.rows).toEqual([{ c1: "v" }]);
  });
});
