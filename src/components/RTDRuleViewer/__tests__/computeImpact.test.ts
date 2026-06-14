// computeImpact 反向 impact 單測（spec ① Acceptance）。
// 用手建小 fixture：兩條獨立依賴鏈，精準驗證 scoping 隔離與路徑。
import { describe, it, expect } from "vitest";
import { buildDepGraph, computeImpact } from "../depGraph";
import type { RuleData } from "../types";

// ── fixture helpers ──
function base(BLOCK_NAME: string, BLOCK_TYPE: string, PREBLOCK: string[] | null, value: string | null, out: string | null): RuleData {
  return {
    PHASE: "T", RULE_NAME: "R", BLOCK_NAME, BLOCK_TYPE, BLOCK_GROUP: "G", BLOCK_SEQ: "1",
    POSX: 0, POSY: 0, PREBLOCK,
    VALUES: [{ KEY: null, COLUMN1: out, COLUMN2: null, VALUE: value }],
  };
}
const db = (name: string, col: string) => base(name, "Database", null, null, col);
const fn = (name: string, pre: string[], out: string, value: string) => base(name, "Function", pre, value, out);
const action = (name: string, pre: string[], value: string) => base(name, "Action", pre, value, null);
// 終端 sink：真實 RTD 每條 rule 都以 DispatchScreen 收尾 → 讓上游 log/function block 不被當孤島（Tracker 不分析孤島）
const ds = (name: string, pre: string[]) => base(name, "DispatchScreen", pre, null, null);

// 鏈 1：COL_A →(F1) VAR_C →(LOG1) [$ALARM$]
// 鏈 2：COL_G →(F3) VAR_E →(LOG2) [$WARN$]   ← 與鏈 1 完全獨立
const RULES: RuleData[] = [
  db("DB1", "COL_A"),
  fn("F1", ["DB1"], "VAR_C", 'IF COL_A == "1" THEN "x" ELSE "y"'),
  action("LOG1", ["F1"], 'IF VAR_C == "x" THEN [$ALARM$]'),
  db("DB2", "COL_G"),
  fn("F3", ["DB2"], "VAR_E", 'IF COL_G == "1" THEN "y" ELSE "n"'),
  action("LOG2", ["F3"], 'IF VAR_E == "y" THEN [$WARN$]'),
  ds("DS", ["LOG1", "LOG2"]),   // 終端 sink → LOG1/LOG2 非孤島
];

describe("computeImpact", () => {
  const g = buildDepGraph(RULES);

  it("root 欄位 → 反向可達其鏈上的 log，路徑 [target, ..., trigger var]", () => {
    const r = computeImpact(g, "COL_A");
    expect(r.found).toBe(true);
    expect(r.logs.map((l) => l.logName)).toEqual(["ALARM"]);
    expect(r.logs[0].path.vars).toEqual(["COL_A", "VAR_C"]);
    expect(r.edges.length).toBeGreaterThan(0);
  });

  it("中間變數 → 受影響 log（更短路徑）", () => {
    const r = computeImpact(g, "VAR_C");
    expect(r.logs.map((l) => l.logName)).toEqual(["ALARM"]);
    expect(r.logs[0].path.vars).toEqual(["VAR_C"]);
  });

  it("scoping 隔離：另一條鏈的變數只影響自己的 log", () => {
    expect(computeImpact(g, "COL_G").logs.map((l) => l.logName)).toEqual(["WARN"]);
    expect(computeImpact(g, "VAR_E").logs.map((l) => l.logName)).toEqual(["WARN"]);
  });

  it("不存在的變數 → found:false、空結果", () => {
    const r = computeImpact(g, "NOPE_VAR");
    expect(r.found).toBe(false);
    expect(r.logs).toEqual([]);
    expect(r.edges).toEqual([]);
  });

  it("無受影響 log 的變數 → found:true 但 logs 空", () => {
    // 加一個沒被任何 log 鏈用到的孤兒：被 F1 引用但... 改用真正未被 log 觸及的情境
    const orphanRules: RuleData[] = [
      db("DBX", "COL_X"),
      fn("FX", ["DBX"], "VAR_X", 'IF COL_X == "1" THEN "a" ELSE "b"'),
      ds("DSX", ["FX"]),   // 終端 sink → FX 非孤島；VAR_X 仍無 log 觸及
      // VAR_X 沒有任何 log 觸發引用
    ];
    const gx = buildDepGraph(orphanRules);
    const r = computeImpact(gx, "COL_X");
    expect(r.found).toBe(true);
    expect(r.logs).toEqual([]);
  });

  it("同名變數但跨 PREBLOCK 子樹：不誤報到非上游的 log", () => {
    // 兩條鏈都有名為 SHARED 的中間變數，但各自定義在不同子樹。
    // 查 COL_A 鏈的 SHARED 來源（F1S），只應影響 ALARM，不應牽到 WARN。
    const rules: RuleData[] = [
      db("DB1", "COL_A"),
      fn("F1S", ["DB1"], "SHARED", 'IF COL_A == "1" THEN "x" ELSE "y"'),
      action("LOG1", ["F1S"], 'IF SHARED == "x" THEN [$ALARM$]'),
      db("DB2", "COL_G"),
      fn("F2S", ["DB2"], "SHARED", 'IF COL_G == "1" THEN "p" ELSE "q"'),
      action("LOG2", ["F2S"], 'IF SHARED == "p" THEN [$WARN$]'),
      ds("DS", ["LOG1", "LOG2"]),   // 終端 sink → log block 非孤島
    ];
    const gs = buildDepGraph(rules);
    // COL_A 只在鏈 1 → 只影響 ALARM
    expect(computeImpact(gs, "COL_A").logs.map((l) => l.logName)).toEqual(["ALARM"]);
    // COL_G 只在鏈 2 → 只影響 WARN
    expect(computeImpact(gs, "COL_G").logs.map((l) => l.logName)).toEqual(["WARN"]);
  });
});
