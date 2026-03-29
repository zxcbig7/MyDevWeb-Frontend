// ============================================================
// index.ts — RTDRuleViewer barrel export
// 統一引用入口：import { ... } from "@/components/RTDRuleViewer"
// ============================================================

// ── Types ────────────────────────────────────────────────────
export type {
  EqpRuleListDTO,
  RuleInfoDTO as RuleDTO,
  BlockValue,
  RuleData,
  BlockType,
  Block,
  Arrow,
  ArrowRenderStyle,
  RuleViewHandle,
} from "./types";
export { BlockTypes } from "./types";
export type { MatchResult } from "./RuleContentSearch";
export type { CaseQueryProps } from "./CaseQuery";
export type { VariableSource } from "./devMock";

// ── Components ───────────────────────────────────────────────
export { default as RuleViewer } from "./RuleViewer";
export { RuleView } from "./RuleView";
export { RuleDropdownSearch } from "./RuleDropdownSearch";
export { RuleContentSearch, SearchNavigator } from "./RuleContentSearch";
export { BlockInspector } from "./BlockInspector";
export { BlockTooltip } from "./BlockTooltip";
export { CaseQuery } from "./CaseQuery";

// ── Utils ────────────────────────────────────────────────────
export { buildBlocks, getBlockImage, hitTestBlock, blockCenter, drawBlock, drawBlocks, BLOCK_SIZE } from "./blockUtils";
export { buildArrows, drawArrow, drawArrows, getSideCenter, decideConnectionSides } from "./arrowUtils";
export { drawGrid, drawMinimap, snap, getWorldBounds, GRID_SIZE } from "./canvasUtils";
export { convertDtosToData } from "./dataTransform";

// ── Dev / Mock ───────────────────────────────────────────────
export { DEV_MOCK_PHASE, DEV_MOCK_RULE_NAME, DEV_MOCK_RULES, MOCK_EQP_RULES, MOCK_RULE_DATA, MOCK_VAR_SOURCES } from "./devMock";
