// 框選 / 對齊 / 分佈 純函式單測（spec 2026-06-14）。
import { describe, it, expect } from "vitest";
import { blocksInRect } from "../blockUtils";
import { alignBlocks, distributeBlocks } from "../alignUtils";
import type { Block, RuleData } from "../types";

const mk = (id: string, x: number, y: number, w = 80, h = 80): Block => ({
  id, x, y, w, h, type: "Function", label: id, raw: {} as RuleData,
});

describe("blocksInRect", () => {
  const A = mk("A", 0, 0);       // 0..80
  const B = mk("B", 200, 0);     // 200..280
  const C = mk("C", 40, 40);     // 40..120

  it("框內 / 部分重疊的 block 回傳，框外的不選", () => {
    // rect 0..100 → A 全包、C 部分重疊、B 在外
    expect(blocksInRect({ x: 0, y: 0, w: 100, h: 100 }, [A, B, C])).toEqual(["A", "C"]);
  });

  it("完全在框外 → 空", () => {
    expect(blocksInRect({ x: 500, y: 500, w: 50, h: 50 }, [A, B, C])).toEqual([]);
  });

  it("邊緣相接（不重疊）不算選中", () => {
    // rect 結束在 x=0，A 從 x=0 開始 → 不重疊（嚴格 > / <）
    expect(blocksInRect({ x: -50, y: 0, w: 50, h: 80 }, [A])).toEqual([]);
  });
});

describe("alignBlocks", () => {
  // A(0,0) B(50,30) C(20,60)，皆 80x80
  const make = () => [mk("A", 0, 0), mk("B", 50, 30), mk("C", 20, 60)];

  it("left → 全部對齊最小 x", () => {
    const bs = make(); alignBlocks(bs, "left");
    expect(bs.map((b) => b.x)).toEqual([0, 0, 0]);
  });
  it("right → 全部對齊最大右緣", () => {
    const bs = make(); alignBlocks(bs, "right");        // maxR = 50+80 = 130
    expect(bs.map((b) => b.x)).toEqual([50, 50, 50]);   // 130-80
  });
  it("top / bottom", () => {
    const t = make(); alignBlocks(t, "top");            // minY = 0
    expect(t.map((b) => b.y)).toEqual([0, 0, 0]);
    const b2 = make(); alignBlocks(b2, "bottom");       // maxB = 60+80 = 140
    expect(b2.map((b) => b.y)).toEqual([60, 60, 60]);   // 140-80
  });
  it("centerX / centerY → 對齊 bbox 中線", () => {
    const cx = make(); alignBlocks(cx, "centerX");      // minX0 maxR130 → cx65 → x=65-40=25
    expect(cx.map((b) => b.x)).toEqual([25, 25, 25]);
    const cy = make(); alignBlocks(cy, "centerY");      // minY0 maxB140 → cy70 → y=70-40=30
    expect(cy.map((b) => b.y)).toEqual([30, 30, 30]);
  });
  it("<2 個 → 不動", () => {
    const bs = [mk("A", 5, 7)]; alignBlocks(bs, "left");
    expect([bs[0].x, bs[0].y]).toEqual([5, 7]);
  });
});

describe("distributeBlocks", () => {
  it("horizontal → 首尾固定、中間中心等距（≥3）", () => {
    // 中心：A=40, C=90, B=240 → 排序 A,C,B；中間 C 應移到 center 140 → x=100
    const A = mk("A", 0, 0), C = mk("C", 50, 0), B = mk("B", 200, 0);
    distributeBlocks([A, C, B], "horizontal");
    expect(C.x).toBe(100);
    expect([A.x, B.x]).toEqual([0, 200]); // 首尾不動
  });
  it("<3 個 → 不動", () => {
    const A = mk("A", 0, 0), B = mk("B", 50, 0);
    distributeBlocks([A, B], "horizontal");
    expect([A.x, B.x]).toEqual([0, 50]);
  });
});
