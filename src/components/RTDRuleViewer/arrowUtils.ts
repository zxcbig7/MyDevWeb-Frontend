// ============================================================
// arrowUtils.ts
// Arrow 的建構與繪製邏輯
// ============================================================

import type { Arrow, ArrowRenderStyle, Block, Side, RuleData } from "./types";
import { blockCenter } from "./blockUtils";

// ── 建構箭頭陣列 ─────────────────────────────────────────────
export function buildArrows(data: RuleData[]): Arrow[] {
  const groupMap = new Map(data.map((r) => [r.BLOCK_NAME, r.BLOCK_GROUP]));

  return data.flatMap((r) => {
    if (!r.PREBLOCK || r.PREBLOCK.length === 0) return [];

    const arrows: Arrow[] = [];
    const toIsMain = r.BLOCK_GROUP === "MAIN";

    arrows.push({
      from: r.PREBLOCK[0],
      to: r.BLOCK_NAME,
      isPrimary: true,
      isMainLine: toIsMain && groupMap.get(r.PREBLOCK[0]) === "MAIN",
    });

    if (r.PREBLOCK.length >= 2) {
      arrows.push({
        from: r.PREBLOCK[1],
        to: r.BLOCK_NAME,
        isPrimary: false,
        isMainLine: toIsMain && groupMap.get(r.PREBLOCK[1]) === "MAIN",
      });
    }

    return arrows;
  });
}

// ── 取得 Block 某一邊的中心點 ────────────────────────────────
export function getSideCenter(b: Block, side: Side) {
  switch (side) {
    case "left":   return { x: b.x,           y: b.y + b.h / 2 };
    case "right":  return { x: b.x + b.w,     y: b.y + b.h / 2 };
    case "top":    return { x: b.x + b.w / 2, y: b.y };
    case "bottom": return { x: b.x + b.w / 2, y: b.y + b.h };
  }
}

// ── 依照 from / to 的相對位置決定連線邊 ─────────────────────
export function decideConnectionSides(
  from: Block,
  to: Block
): { fromSide: Side; toSide: Side } {
  const c1 = blockCenter(from);
  const c2 = blockCenter(to);

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  // EPS：水平 / 垂直判斷的緩衝區
  // 只有「水平差距明顯大於垂直差距 + EPS」才走水平連線
  // 避免兩 block 幾乎正斜 45° 時，連線方向因浮點數微差而不穩定
  const EPS = 5;
  if (Math.abs(dx) > Math.abs(dy) + EPS) {
    return dx > 0
      ? { fromSide: "right", toSide: "left" }
      : { fromSide: "left",  toSide: "right" };
  }

  // 垂直
  return dy > 0
    ? { fromSide: "bottom", toSide: "top" }
    : { fromSide: "top",    toSide: "bottom" };
}

// ── 繪製單一箭頭 ─────────────────────────────────────────────
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  style: ArrowRenderStyle
) {
  const { isPrimary, scale } = style;
  const headLen = (isPrimary ? 10 : 8) / scale;

  const dx = x2 - x1;
  const dy = y2 - y1;
  // atan2 回傳箭頭方向角（弧度），範圍 -π ~ π
  // 以終點 (x2,y2) 為基準，朝 (dx,dy) 方向射出
  const angle = Math.atan2(dy, dx);

  // 線段
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 箭頭兩翼端點
  // 以箭頭尖端 (x2,y2) 為原點，往反方向旋轉 ±30°（π/6）延伸 headLen
  // cos/sin(angle ± π/6) 分別算出兩翼在 x/y 軸的分量
  const xA = x2 - headLen * Math.cos(angle - Math.PI / 6);
  const yA = y2 - headLen * Math.sin(angle - Math.PI / 6);
  const xB = x2 - headLen * Math.cos(angle + Math.PI / 6);
  const yB = y2 - headLen * Math.sin(angle + Math.PI / 6);

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(xA, yA);
  ctx.lineTo(xB, yB);
  ctx.closePath();

  // 主線：實心；副線：空心
  if (isPrimary) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

// ── 繪製所有箭頭 ─────────────────────────────────────────────
// dimUnrelated：tracker 運作時，把「不在 relatedKeys（依賴路徑）上」的主/副線淡化，凸顯追蹤鏈
export function drawArrows(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  arrows: Arrow[],
  scale: number,
  dimUnrelated = false,
  relatedKeys?: Set<string>
) {
  const MAIN_COLOR      = "#1F2937"; // 兩端都是 MAIN：最深灰（粗、最醒目，但不用藍）
  const PRIMARY_COLOR   = "#374151"; // 一般主線：深灰
  const SECONDARY_COLOR = "#9CA3AF"; // 副線：淺灰

  arrows.forEach((a) => {
    const from = blocks.find((b) => b.id === a.from);
    const to   = blocks.find((b) => b.id === a.to);
    if (!from || !to) return;

    const { fromSide, toSide } = decideConnectionSides(from, to);
    const start = getSideCenter(from, fromSide);
    const end   = getSideCenter(to,   toSide);

    const color = a.isMainLine ? MAIN_COLOR : (a.isPrimary ? PRIMARY_COLOR : SECONDARY_COLOR);

    ctx.save();

    // tracker 運作中：沒關聯到追蹤鏈的主/副線淡化
    if (dimUnrelated && !relatedKeys?.has(`${a.from}|${a.to}`)) {
      ctx.globalAlpha = 0.12;
    }

    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = (a.isMainLine ? 2.2 : a.isPrimary ? 1.5 : 1.2) / scale;

    // 副線：虛線；主線 / MAIN 線：實線
    ctx.setLineDash(a.isPrimary ? [] : [6 / scale, 3 / scale]);

    drawArrow(ctx, start.x, start.y, end.x, end.y, {
      isPrimary: a.isPrimary,
      scale,
    });

    ctx.restore();
  });
}
