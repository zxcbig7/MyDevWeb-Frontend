// apfEval 三值評估單測（spec ③ Acceptance）。
import { describe, it, expect } from "vitest";
import { parseCond, evalCond } from "../apfEval";

describe("parseCond + evalCond", () => {
  it("單一比較：parse → cmp，命中 / 不命中 / 無值", () => {
    const n = parseCond('HOLD_RISK == "RISK"');
    expect(n.kind).toBe("cmp");
    expect(evalCond(n, { HOLD_RISK: "RISK" })).toBe("yes");
    expect(evalCond(n, { HOLD_RISK: "SAFE" })).toBe("no");
    expect(evalCond(n, {})).toBe("unknown");
  });

  it("數值比較：兩端可轉數字走數值序", () => {
    const n = parseCond("WAIT_TIME > 120");
    expect(evalCond(n, { WAIT_TIME: "200" })).toBe("yes");
    expect(evalCond(n, { WAIT_TIME: "60" })).toBe("no");
  });

  it("AND：任一 no → no；全 yes → yes；含 unknown → unknown", () => {
    const n = parseCond('A_FLAG == "Y" AND B_FLAG == "Y"');
    expect(n.kind).toBe("and");
    expect(evalCond(n, { A_FLAG: "Y", B_FLAG: "Y" })).toBe("yes");
    expect(evalCond(n, { A_FLAG: "Y", B_FLAG: "N" })).toBe("no");
    expect(evalCond(n, { A_FLAG: "N" })).toBe("no");          // 短路 no
    expect(evalCond(n, { A_FLAG: "Y" })).toBe("unknown");     // B 無值
  });

  it("OR：任一 yes → yes；全 no → no；含 unknown → unknown", () => {
    const n = parseCond('A_FLAG == "Y" OR B_FLAG == "Y"');
    expect(n.kind).toBe("or");
    expect(evalCond(n, { A_FLAG: "N", B_FLAG: "Y" })).toBe("yes");
    expect(evalCond(n, { A_FLAG: "N", B_FLAG: "N" })).toBe("no");
    expect(evalCond(n, { A_FLAG: "N" })).toBe("unknown");
  });

  it("NOT：yes↔no、unknown 維持", () => {
    const n = parseCond('NOT HOLD_RISK == "RISK"');
    expect(n.kind).toBe("not");
    expect(evalCond(n, { HOLD_RISK: "RISK" })).toBe("no");
    expect(evalCond(n, { HOLD_RISK: "SAFE" })).toBe("yes");
    expect(evalCond(n, {})).toBe("unknown");
  });

  it("巢狀括號：(A AND B) OR C", () => {
    const n = parseCond('(AA == "1" AND BB == "2") OR CC == "3"');
    expect(n.kind).toBe("or");
    expect(evalCond(n, { AA: "1", BB: "X", CC: "3" })).toBe("yes");  // C 成立
    expect(evalCond(n, { AA: "X", BB: "X", CC: "X" })).toBe("no");   // 全不成立
    expect(evalCond(n, { AA: "1", BB: "2", CC: "X" })).toBe("yes");  // A∧B 成立
  });

  it("precedence：A OR B AND C = A OR (B AND C)", () => {
    const n = parseCond('AA == "1" OR BB == "1" AND CC == "1"');
    expect(n.kind).toBe("or");
    expect(evalCond(n, { AA: "1", BB: "0", CC: "0" })).toBe("yes");  // A 成立
    expect(evalCond(n, { AA: "0", BB: "1", CC: "1" })).toBe("yes");  // B∧C 成立
    expect(evalCond(n, { AA: "0", BB: "1", CC: "0" })).toBe("no");   // 都不成立
  });

  it("NOT + 括號：NOT (A AND B)", () => {
    const n = parseCond('NOT (AA == "1" AND BB == "2")');
    expect(n.kind).toBe("not");
    expect(evalCond(n, { AA: "1", BB: "2" })).toBe("no");
    expect(evalCond(n, { AA: "1", BB: "X" })).toBe("yes");
  });

  it("函式呼叫子條件 → unknown，不拖垮整條 OR", () => {
    const n = parseCond('COUNT(HOLD_FLAG, 5) > 3 OR HOLD_RISK == "RISK"');
    expect(n.kind).toBe("or");
    expect(evalCond(n, { HOLD_RISK: "RISK" })).toBe("yes");      // 另一側成立
    expect(evalCond(n, { HOLD_RISK: "SAFE" })).toBe("unknown");  // 函式 unknown + 另側 no
  });

  it("字串內的 AND/OR 不被當結構關鍵字", () => {
    const n = parseCond('MSG == "A AND B OR C"');
    expect(n.kind).toBe("cmp");
    expect(evalCond(n, { MSG: "A AND B OR C" })).toBe("yes");
  });

  it("註解內的關鍵字被忽略", () => {
    const n = parseCond('/* OR fallback */ HOLD_RISK == "RISK"');
    expect(n.kind).toBe("cmp");
    expect(evalCond(n, { HOLD_RISK: "RISK" })).toBe("yes");
  });

  it("空 / 純識別字（無運算子）→ unknown", () => {
    expect(parseCond("").kind).toBe("unknown");
    expect(parseCond("HOLD_FLAG").kind).toBe("unknown");
  });
});
