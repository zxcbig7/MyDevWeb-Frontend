// ============================================================
// canvasUtils.ts
// Grid 繪製、Minimap 繪製、Snap 對齊
// ============================================================

import type { Block } from "./types";
import { BLOCK_SIZE } from "./blockUtils";

export const GRID_SIZE = BLOCK_SIZE / 2;

// ── Grid 繪製 ────────────────────────────────────────────────
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: { translateX: number; translateY: number; scale: number },
  size: { w: number; h: number }
) {
  const grid = GRID_SIZE;

  // 反推目前可視的 world 範圍
  // Canvas 渲染公式：screen = translateX + world * scale
  // 反推：world = (screen - translateX) / scale
  // screen 左邊界 = 0  → world 左邊 = -translateX / scale
  // screen 右邊界 = w  → world 右邊 = (w - translateX) / scale
  // floor/ceil + *grid 確保格線對齊，不會在邊緣留下半格空白
  const startX = Math.floor((-view.translateX) / view.scale / grid) * grid;
  const endX   = Math.ceil((size.w - view.translateX) / view.scale / grid) * grid;
  const startY = Math.floor((-view.translateY) / view.scale / grid) * grid;
  const endY   = Math.ceil((size.h - view.translateY) / view.scale / grid) * grid;

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1 / view.scale; // 縮放後線條仍維持 1px 視覺寬

  ctx.beginPath();
  for (let x = startX; x <= endX; x += grid) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += grid) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX,   y);
  }
  ctx.stroke();
}

// ── Snap 對齊（拖曳放開時吸附到格線） ──────────────────────
export function snap(value: number, grid: number) {
  return Math.round(value / grid) * grid;
}

// ── 取得所有 Block 的世界座標邊界 ───────────────────────────
export function getWorldBounds(blocks: Block[]) {
  const PADDING = 50;

  const xs = blocks.flatMap((b) => [b.x, b.x + b.w]);
  const ys = blocks.flatMap((b) => [b.y, b.y + b.h]);

  return {
    minX: Math.min(...xs) - PADDING,
    maxX: Math.max(...xs) + PADDING,
    minY: Math.min(...ys) - PADDING,
    maxY: Math.max(...ys) + PADDING,
  };
}

// ── Minimap 繪製 ─────────────────────────────────────────────
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  view: { translateX: number; translateY: number; scale: number },
  canvas: HTMLCanvasElement,
  viewportSize: { w: number; h: number }
) {
  if (blocks.length === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = getWorldBounds(blocks);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;

  // 計算讓所有 block 完整塞進 minimap canvas 的縮放比例
  // Math.min 取較小的一邊，確保最長邊不超出 canvas
  // * FIT_RATIO 留下一點邊距，不讓內容緊貼邊框
  const FIT_RATIO = 0.85;
  const scale = Math.min(
    canvas.width  / worldW,
    canvas.height / worldH
  ) * FIT_RATIO;

  const worldWpx = worldW * scale;
  const worldHpx = worldH * scale;

  // 計算 world 內容在 minimap canvas 內的置中偏移（ox, oy）
  // (canvas.width - worldWpx) / 2   → 水平置中剩餘空間
  // - bounds.minX * scale            → 修正 world 起點不在 (0,0) 的偏移
  // 最終：minimap 像素 = world * scale + ox
  const ox = (canvas.width  - worldWpx) / 2 - bounds.minX * scale;
  const oy = (canvas.height - worldHpx) / 2 - bounds.minY * scale;

  // 繪製 Block 縮圖
  ctx.fillStyle = "#9ca3af";
  blocks.forEach((b) => {
    ctx.fillRect(
      b.x * scale + ox,
      b.y * scale + oy,
      b.w * scale,
      b.h * scale
    );
  });

  // 將主 canvas 的可視範圍換算到 world 座標系
  // vx,vy：視窗左上角對應的 world 座標（screen=0 → world = -translate/scale）
  // vw,vh：視窗在 world 中的寬高（screen size / scale）
  const vx = -view.translateX / view.scale;
  const vy = -view.translateY / view.scale;
  const vw = viewportSize.w / view.scale;
  const vh = viewportSize.h / view.scale;

  ctx.strokeStyle = "rgba(30, 110, 110, 0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    vx * scale + ox,
    vy * scale + oy,
    vw * scale,
    vh * scale
  );
}
