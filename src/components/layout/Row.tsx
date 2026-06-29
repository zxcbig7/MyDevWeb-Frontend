import { type ReactElement, type ReactNode } from "react";
import { cn } from "../../utils/clsx";
import { GAP, type SpaceTier } from "../../lib/spacing";

interface RowProps {
  gap?: SpaceTier;
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  className?: string;
  children: ReactNode;
}

const ALIGN: Record<NonNullable<RowProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const JUSTIFY: Record<NonNullable<RowProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

// 水平排列：間距由父層 gap 統一給；wrap 時換行間距也走同一把尺
export const Row = ({
  gap = "default",
  align = "center",
  justify = "start",
  wrap = false,
  className,
  children,
}: RowProps): ReactElement => (
  <div
    className={cn(
      "flex",
      wrap && "flex-wrap",
      GAP[gap],
      ALIGN[align],
      JUSTIFY[justify],
      className,
    )}
  >
    {children}
  </div>
);
