// ============================================================
// spacing.ts
// 間距設計 token — 全站 spacing 單一來源（對照 radius.ts）
//
// 三條鐵則：
//   1. 間距由「父層」用 gap 給，子元件 0 外距（NEVER 在子元件寫 mb/mt 把自己往外推）
//   2. 只走 4px grid 整數階，禁用 half-step（gap-1.5 / py-0.5）與 inline px
//   3. 三層級節奏，越外層越大：tight < default < loose（間距相等=同組，變大=換組）
//
// padding = 容器與自身內容的呼吸（容器擁有）；gap = 兄弟元件之間（父層給）。
// ============================================================

// 4px grid（Tailwind 預設，1 = 4px）：tight=8 / default=16 / loose 視 gap/pad 而定

// 兄弟元件「之間」的距離 → 套在父層 flex/grid 容器
export const GAP = {
  tight:   "gap-2", //  8px — icon↔文字、tag 內、緊鄰元素
  default: "gap-4", // 16px — 卡片內元素、表單欄位之間
  loose:   "gap-8", // 32px — 區塊 / section 之間
} as const;

// 容器「內距」→ 容器與自身內容的呼吸（卡片 / 面板 / 按鈕擁有）
export const PAD = {
  tight:   "p-2", //  8px
  default: "p-4", // 16px — 卡片標準內距
  loose:   "p-6", // 24px — 面板 / 頁面區塊
} as const;

export type SpaceTier = keyof typeof GAP;

// tier → px（對照 / 與 antd token 換算用；antd ConfigProvider 見 src/App.tsx）
export const GAP_PX: Record<SpaceTier, number> = { tight: 8, default: 16, loose: 32 };
export const PAD_PX: Record<SpaceTier, number> = { tight: 8, default: 16, loose: 24 };

// Tailwind JIT hint（讓 content 掃描保留這些 class，對照 radius.ts 作法）：
// gap-2 gap-4 gap-8 p-2 p-4 p-6
