// root 變數溯源單測：columnSources 索引 / resolveColumnSources scoping / closure rootSources / 報告 TABLE 資訊。
// fixture：兩條獨立鏈皆有 HOLD_FLAG 欄位，驗證只溯源到 refBlock 的 PREBLOCK 上游。
import { describe, it, expect } from "vitest";
import { buildDepGraph, resolveColumnSources, collectLogClosure, buildLogReport } from "../depGraph";
import type { RuleData } from "../types";

// ── fixture helpers ──
function block(BLOCK_NAME: string, BLOCK_TYPE: string, PREBLOCK: string[] | null, VALUES: RuleData["VALUES"]): RuleData {
  return {
    PHASE: "T", RULE_NAME: "R", BLOCK_NAME, BLOCK_TYPE, BLOCK_GROUP: "G", BLOCK_SEQ: "1",
    POSX: 0, POSY: 0, PREBLOCK, VALUES,
  };
}
const db = (name: string, table: string, cols: string) =>
  block(name, "Database", null, [{ KEY: table, COLUMN1: cols, COLUMN2: null, VALUE: null }]);
const fn = (name: string, pre: string[], out: string, value: string) =>
  block(name, "Function", pre, [{ KEY: out, COLUMN1: null, COLUMN2: null, VALUE: value }]);
const action = (name: string, pre: string[], value: string) =>
  block(name, "Action", pre, [{ KEY: null, COLUMN1: null, COLUMN2: null, VALUE: value }]);
const ds = (name: string, pre: string[]) =>
  block(name, "DispatchScreen", pre, []);

// 鏈 1：DB_MAIN(LOT_LIST: LOT_ID,HOLD_FLAG,WAIT_HR) → F1(VAR_C←HOLD_FLAG,WAIT_HR) → LOG1 [$ALARM$]
// 鏈 2：DB_OTHER(OTHER_TBL: HOLD_FLAG,COL_G)        → F2(VAR_E←COL_G)             → LOG2 [$WARN$]
const RULES: RuleData[] = [
  db("DB_MAIN", "LOT_LIST", "LOT_ID, HOLD_FLAG, WAIT_HR"),
  fn("F1", ["DB_MAIN"], "VAR_C", 'IF HOLD_FLAG == "Y" AND WAIT_TIMEX == "1" THEN "x" ELSE "y"'),
  action("LOG1", ["F1"], 'IF VAR_C == "x" THEN [$ALARM$]'),
  db("DB_OTHER", "OTHER_TBL", "HOLD_FLAG, COL_G"),
  fn("F2", ["DB_OTHER"], "VAR_E", 'IF COL_G == "1" THEN "y" ELSE "n"'),
  action("LOG2", ["F2"], 'IF VAR_E == "y" THEN [$WARN$]'),
  ds("DS", ["LOG1", "LOG2"]),
];

describe("root 變數溯源（columnSources）", () => {
  const g = buildDepGraph(RULES);

  it("buildDepGraph 建欄位索引：欄位 → 資料型 block（含表名）", () => {
    const srcs = g.columnSources.get("HOLD_FLAG") ?? [];
    expect(srcs.map((s) => s.block).sort()).toEqual(["DB_MAIN", "DB_OTHER"]);
    expect(srcs.find((s) => s.block === "DB_MAIN")?.table).toBe("LOT_LIST");
  });

  it("resolveColumnSources 只回 refBlock 上游的來源（同名欄位不跨鏈）", () => {
    const fromF1 = resolveColumnSources(g, "HOLD_FLAG", "F1");
    expect(fromF1.map((s) => s.block)).toEqual(["DB_MAIN"]);
    const fromF2 = resolveColumnSources(g, "HOLD_FLAG", "F2");
    expect(fromF2.map((s) => s.block)).toEqual(["DB_OTHER"]);
  });

  it("上游找不到資料型 block → 空陣列（來源不明）", () => {
    expect(resolveColumnSources(g, "WAIT_TIMEX", "F1")).toEqual([]);
  });

  it("collectLogClosure：root 記錄來源、來源 block 進 closure.blocks", () => {
    const c = collectLogClosure(g, "ALARM");
    expect(c.rootSources.get("HOLD_FLAG")?.[0]).toMatchObject({
      block: "DB_MAIN", blockType: "Database", table: "LOT_LIST", column: "HOLD_FLAG",
    });
    expect(c.rootSources.get("WAIT_TIMEX")).toEqual([]); // 來源不明仍列為 root
    expect(c.blocks.has("DB_MAIN")).toBe(true);
    expect(c.blocks.has("DB_OTHER")).toBe(false); // 另一條鏈不進來
  });

  it("buildLogReport：依賴樹 [root ← TABLE.col]、Block 定義列 Table/Columns、Root 區帶來源", () => {
    const report = buildLogReport(g, RULES, "ALARM");
    expect(report).toContain("[root ← LOT_LIST.HOLD_FLAG @ DB_MAIN(Database)]");
    expect(report).toContain("### DB_MAIN  (Database, group G)");
    expect(report).toContain("- Table：`LOT_LIST`");
    expect(report).toContain("- Columns：LOT_ID, HOLD_FLAG, WAIT_HR");
    expect(report).toContain("- HOLD_FLAG ← LOT_LIST.HOLD_FLAG @ DB_MAIN(Database)");
    expect(report).toContain("- WAIT_TIMEX（來源不明：上游找不到資料型 block）");
  });
});
