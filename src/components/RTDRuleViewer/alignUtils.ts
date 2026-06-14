// ============================================================
// alignUtils.ts
// 選取 block 的對齊 / 等距分佈（純函式，就地改 b.x/b.y；呼叫端負責 snap + redraw）
// spec: 2026-06-14-canvas-group-block-select-drag.md
// ============================================================

import type { Block, AlignOp, DistributeAxis } from "./types";

/**
 * 對齊一組 block（需 ≥2 才有意義）。
 * left/right/top/bottom = 對齊到群組 bounding box 外緣；centerX/centerY = 對齊到 bbox 中線。
 */
export function alignBlocks(blocks: Block[], op: AlignOp): void {
  if (blocks.length < 2) return;
  const minX = Math.min(...blocks.map((b) => b.x));
  const maxR = Math.max(...blocks.map((b) => b.x + b.w));
  const minY = Math.min(...blocks.map((b) => b.y));
  const maxB = Math.max(...blocks.map((b) => b.y + b.h));
  const cx = (minX + maxR) / 2;
  const cy = (minY + maxB) / 2;
  for (const b of blocks) {
    switch (op) {
      case "left":    b.x = minX; break;
      case "right":   b.x = maxR - b.w; break;
      case "top":     b.y = minY; break;
      case "bottom":  b.y = maxB - b.h; break;
      case "centerX": b.x = cx - b.w / 2; break;
      case "centerY": b.y = cy - b.h / 2; break;
    }
  }
}

/**
 * 等距分佈一組 block（需 ≥3）。沿 axis 依中心排序、首尾固定、中間 block 中心等距重排。
 */
export function distributeBlocks(blocks: Block[], axis: DistributeAxis): void {
  if (blocks.length < 3) return;
  const horiz = axis === "horizontal";
  const center = (b: Block): number => (horiz ? b.x + b.w / 2 : b.y + b.h / 2);
  const sorted = [...blocks].sort((a, b) => center(a) - center(b));
  const n = sorted.length;
  const first = center(sorted[0]);
  const last = center(sorted[n - 1]);
  for (let i = 1; i < n - 1; i++) {
    const c = first + ((last - first) * i) / (n - 1);
    if (horiz) sorted[i].x = c - sorted[i].w / 2;
    else sorted[i].y = c - sorted[i].h / 2;
  }
}
