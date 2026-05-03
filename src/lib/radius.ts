// ============================================================
// radius.ts
// 圓角設計 token 與嵌套計算
// 公式：外圓角 = 內圓角 + Padding
// ============================================================

// Tailwind v4 預設 rounded 對應的 px 值
export const RADIUS = {
  none:  0,
  sm:    2,
  base:  4,
  md:    6,
  lg:    8,
  xl:    12,
  "2xl": 16,
  "3xl": 24,
  full:  9999,
} as const;

export type RadiusKey = keyof typeof RADIUS;

// px → Tailwind class（找最近的值）
const PX_TO_CLASS: [number, string][] = [
  [0,    "rounded-none"],
  [2,    "rounded-sm"],
  [4,    "rounded"],
  [6,    "rounded-md"],
  [8,    "rounded-lg"],
  [12,   "rounded-xl"],
  [16,   "rounded-2xl"],
  [24,   "rounded-3xl"],
  [9999, "rounded-full"],
];

/**
 * 根據內層圓角和兩者之間的 padding，計算外層應使用的圓角 class
 * @param innerKey  內層元素的圓角 token（對應 RADIUS 的 key）
 * @param paddingPx 外層 padding（px）
 * @returns Tailwind rounded class string
 */
export function nestedRadius(innerKey: RadiusKey, paddingPx: number): string {
  const innerPx = RADIUS[innerKey];
  if (innerPx === 9999) return "rounded-full";

  const outerPx = innerPx + paddingPx;

  return PX_TO_CLASS.reduce((best, curr) =>
    Math.abs(curr[0] - outerPx) < Math.abs(best[0] - outerPx) ? curr : best
  )[1];
}

// ============================================================
// 語意化 token（靜態字串，Tailwind JIT 可靜態分析）
//
// 使用場景：
//   btn    → 按鈕、input、小元素
//   card   → 卡片（包住 btn 的容器，padding p-4 = 16px）
//   panel  → 面板容器（包住 card，padding p-4 = 16px）
//   page   → 全版容器（包住 panel，padding p-6 = 24px）
//
// 換算：
//   btn   = rounded-lg  (8px)
//   card  = rounded-2xl (16px) ← nestedRadius('lg',  8)  = 8+8=16
//   panel = rounded-3xl (24px) ← nestedRadius('lg', 16)  = 8+16=24
//   page  = rounded-3xl (24px) ← nestedRadius('xl', 12)  = 12+12=24
// ============================================================

// Tailwind JIT hint（讓 purge 保留這些 class）：
// rounded-none rounded-sm rounded rounded-md rounded-lg rounded-xl rounded-2xl rounded-3xl rounded-full

export const R = {
  btn:   "rounded-lg",   // 8px  — button, input, badge
  card:  "rounded-2xl",  // 16px — 卡片（wraps btn, p-2）
  panel: "rounded-3xl",  // 24px — 面板容器（wraps btn, p-4）
} as const;

export type RToken = keyof typeof R;

// Tailwind padding class → px（常用值）
export const PADDING_PX: Record<string, number> = {
  "p-0":   0, "p-px":  1,
  "p-0.5": 2, "p-1":   4,
  "p-1.5": 6, "p-2":   8,
  "p-2.5": 10, "p-3":  12,
  "p-4":   16, "p-5":  20,
  "p-6":   24, "p-8":  32,
  "p-10":  40, "p-12": 48,
};
