import type { StmtType } from "./types";

export const TYPE_COLOR: Record<StmtType, string> = {
  SELECT:   "#3b82f6",
  INSERT:   "#22c55e",
  UPDATE:   "#f59e0b",
  DELETE:   "#ef4444",
  TRUNCATE: "#dc2626",
  FOR_LOOP: "#a855f7",
  OTHER:    "#64748b",
};

export const TYPE_BG: Record<StmtType, string> = {
  SELECT:   "#eff6ff",
  INSERT:   "#f0fdf4",
  UPDATE:   "#fffbeb",
  DELETE:   "#fef2f2",
  TRUNCATE: "#fef2f2",
  FOR_LOOP: "#faf5ff",
  OTHER:    "#f8fafc",
};

export const BOX_W = 130;
export const BOX_H = 38;
export const SVG_W = 900;
export const SVG_H = 580;
