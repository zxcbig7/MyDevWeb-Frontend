// ============================================================
// blockUtils.ts
// Block 的建構、圖片快取、命中測試、繪製邏輯
// ============================================================

import type { Block, BlockType, RuleData } from "./types";

export const BLOCK_SIZE = 80;

const LAYOUT_PADDING = 0; // 對齊後距離左上角的留白

// ── 建構 Block 陣列 ─────────────────────────────────────────
export function buildBlocks(data: RuleData[]): Block[] {
  if (data.length === 0) return [];

  // 計算所有 block 的最小 x, y，然後整體平移讓最左上角對齊 LAYOUT_PADDING
  const minX = Math.min(...data.map((r) => r.POSX ?? 0));
  const minY = Math.min(...data.map((r) => r.POSY ?? 0));
  const dx = LAYOUT_PADDING - minX;
  const dy = LAYOUT_PADDING - minY;

  return data.map((r) => ({
    id: r.BLOCK_NAME,
    x: (r.POSX ?? 0) + dx,
    y: (r.POSY ?? 0) + dy,
    w: BLOCK_SIZE,
    h: BLOCK_SIZE,
    type: r.BLOCK_TYPE as Block["type"],
    label: r.BLOCK_NAME,
    raw: r,
  }));
}

// ── Icon 新舊版本切換 ─────────────────────────────────────────────
const ICON_DIR_BASE = "/RTDIcons";
const ICON_DIR_OLD = ICON_DIR_BASE + "/RTDIconsOld";
const ICON_DIR_NEW = ICON_DIR_BASE + "/RTDIconsNew";

function getIconSrc(type: BlockType, useNewIcons: boolean = true): string {
  return `${useNewIcons ? ICON_DIR_NEW : ICON_DIR_OLD}/${type}.png`;
}

// ── 圖片快取（新舊各一份） ───────────────────────────────────
const BLOCK_IMAGE_CACHE_NEW: Partial<Record<BlockType, HTMLImageElement>> = {};
const BLOCK_IMAGE_CACHE_OLD: Partial<Record<BlockType, HTMLImageElement>> = {};

export function getBlockImage(type: BlockType, useNewIcons: boolean = true): HTMLImageElement {
  const cache = useNewIcons ? BLOCK_IMAGE_CACHE_NEW : BLOCK_IMAGE_CACHE_OLD;
  let img = cache[type];
  if (!img) {
    img = new Image();
    img.src = getIconSrc(type, useNewIcons);
    cache[type] = img;
  }
  return img;
}

// ── 取得 Block 中心點 ────────────────────────────────────────
export function blockCenter(b: Block) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h / 2,
  };
}

// ── Hit Test：判斷滑鼠是否點到某個 Block ─────────────────────
export function hitTestBlock(wx: number, wy: number, blocks: Block[]): Block | null {
  let best: Block | null = null;
  let bestDist = Infinity;

  // 為何不直接回傳第一個命中？
  // block 可能互相重疊，用「距中心最近」而非「z-order 最上層」
  // 能讓使用者更容易點中視覺上明顯的 block
  for (const b of blocks) {
    if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
      // (dx² + dy²) 即平方距離（省略 sqrt，比較大小用途相同且較快）
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = (wx - cx) ** 2 + (wy - cy) ** 2;

      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
  }

  return best;
}

// ── 繪製單一 Block ───────────────────────────────────────────
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  b: Block,
  highlighted: boolean,
  isMatched: boolean,
  isSelected: boolean,
  trackerRole?: "log" | "var",
  useNewIcons: boolean = true
) {
  const R = 4; // block 圓角半徑

  // 外層 save/restore：控制 globalAlpha；內層 save/restore：控制 clip（圖片裁圓角）
  // 兩層分開是因為 clip 狀態與透明度需要獨立管理
  ctx.save();

  // 未命中（沒被 tracker / 搜尋掃到）→ 整體半透明，淡到幾乎隱形（只留淡影當背景脈絡）
  // tracker 光環在外層 restore 之後才畫，不受此 alpha 影響，命中的框 / 線仍清晰
  if (!isMatched) ctx.globalAlpha = 0.22;

  // 白底 + 圖片（clip 至圓角矩形）
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, R);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const img = getBlockImage(b.type, useNewIcons);
  if (img.complete && img.naturalWidth > 0) {
    if (!isMatched) ctx.filter = "grayscale(1)";
    ctx.drawImage(img, b.x, b.y, b.w, b.h);
    ctx.filter = "none";
  }
  ctx.restore();

  // 邊框
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(34,197,94,0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4, R + 2);
    ctx.stroke();
    ctx.restore();
  } else if (highlighted) {
    ctx.save();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(37,99,235,0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4, R + 2);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, R);
    ctx.stroke();
  }

  // Label 文字
  ctx.fillStyle = isMatched ? "rgba(0, 0, 0, 0.53)" : "rgba(0, 0, 0, 0.25)";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h + 4);

  ctx.restore();

  // Tracker 光環刻意在外層 restore 之後繪製
  // 原因：restore 已重設 globalAlpha，光環不會被淡化
  // 即使 block 因「未命中搜尋」而變暗，tracker 高亮仍清晰可見
  if (trackerRole) {
    const isLog = trackerRole === "log";
    ctx.save();
    ctx.strokeStyle  = isLog ? "#f59e0b" : "#a855f7";
    ctx.lineWidth    = 2.5;
    ctx.shadowColor  = isLog ? "rgba(245,158,11,0.8)" : "rgba(168,85,247,0.8)";
    ctx.shadowBlur   = 14;
    ctx.beginPath();
    ctx.roundRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, R + 3);
    ctx.stroke();
    ctx.restore();
  }
}

// ── 繪製所有 Block ───────────────────────────────────────────
export function drawBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  inspectedIds: Set<string>,
  matchedIds: Set<string> | null,
  selectedId?: string | null,
  trackerLogIds?: Set<string>,
  trackerVarIds?: Set<string>,
  useNewIcons: boolean = true
) {
  const trackerActive = (trackerLogIds?.size ?? 0) > 0 || (trackerVarIds?.size ?? 0) > 0;

  blocks.forEach((b) => {
    // 計算「是否有關聯」——決定要不要 dim
    // 優先序：Viewer 搜尋 → Tracker → 兩者皆無（全亮）
    let isMatched: boolean;
    if (matchedIds !== null) {
      isMatched = matchedIds.has(b.id);
    } else if (trackerActive) {
      isMatched = (trackerLogIds?.has(b.id) ?? false) || (trackerVarIds?.has(b.id) ?? false);
    } else {
      isMatched = true;
    }

    drawBlock(
      ctx,
      b,
      inspectedIds.has(b.id),
      isMatched,
      !!selectedId && b.id === selectedId,
      trackerLogIds?.has(b.id) ? "log" : trackerVarIds?.has(b.id) ? "var" : undefined,
      useNewIcons
    );
  });
}
