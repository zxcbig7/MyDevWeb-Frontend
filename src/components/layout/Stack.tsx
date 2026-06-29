import { type ReactElement, type ReactNode } from "react";
import { cn } from "../../utils/clsx";
import { GAP, type SpaceTier } from "../../lib/spacing";

interface StackProps {
  gap?: SpaceTier;
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
  children: ReactNode;
}

const ALIGN: Record<NonNullable<StackProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

// 垂直堆疊：間距由父層 gap 統一給，子元件不需任何 mb/mt
export const Stack = ({
  gap = "default",
  align = "stretch",
  className,
  children,
}: StackProps): ReactElement => (
  <div className={cn("flex flex-col", GAP[gap], ALIGN[align], className)}>
    {children}
  </div>
);
