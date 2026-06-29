import { type ReactElement, type ReactNode } from "react";
import { cn } from "../../utils/clsx";
import { GAP, type SpaceTier } from "../../lib/spacing";

type GridCols = 1 | 2 | 3 | 4 | 5 | 6;

interface GridProps {
  cols?: GridCols;
  gap?: SpaceTier;
  className?: string;
  children: ReactNode;
}

// 靜態 class map（Tailwind 不會生成 `grid-cols-${n}` 動態值，故用固定對照）
const COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

// 網格：欄距 / 列距由父層 gap 統一給
export const Grid = ({
  cols = 2,
  gap = "default",
  className,
  children,
}: GridProps): ReactElement => (
  <div className={cn("grid", COLS[cols], GAP[gap], className)}>{children}</div>
);

// Tailwind JIT hint：
// grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6
