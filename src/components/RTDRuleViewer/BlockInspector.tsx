// ============================================================
// BlockInspector.tsx
// 雙擊 Block 後浮出的詳細資訊面板（可拖曳、可縮放）
//
// 架構：
//   BlockInspector  ── Shell：拖曳 / resize / z-index，與型別無關
//     └─ InspectorBody ── Factory：依 block.type 分派
//         ├─ StartEndBody  (START / END)
//         ├─ DecisionBody  (DECISION)
//         └─ ProcessBody   (PROCESS / 其他)
//
// 共用元件：SectionTitle / MetaRow / ValueCard / HighlightedValue
// ============================================================

import React, { useEffect, useRef } from "react";
import type { Block, BlockType, BlockValue, RuleData } from "./types";
import { cn } from "../../utls/clsx";

// ─────────────────────────────────────────────────────────────
// Shell Props
// ─────────────────────────────────────────────────────────────
type BlockInspectorProps = {
  block: Block;
  initialX: number;
  initialY: number;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  inspectorDraggingRef: React.MutableRefObject<boolean>;
  onPositionChange?: (x: number, y: number) => void;
  onFocus?: () => void;
  zIndex?: number;
};

// ─────────────────────────────────────────────────────────────
// Type Accent Config  (Tailwind class strings)
// ─────────────────────────────────────────────────────────────
type TypeAccent = {
  headerBg: string;
  borderLeft: string;
  badgeClasses: string;
};


// Block 主要類型分類，如果沒在範圍內就用 general
type BlockCategory = "input" | "tableop" | "function" | "output" | "general";

// 依照 RTDIconsNew 圖片背景色分類
// 橘色: Input  綠色: TableOperation  藍色: Function  黃色: Output
const TYPE_CATEGORY: Partial<Record<BlockType, BlockCategory>> = {
  // Input (橘色) — Row 0
  Data: "input", DataSource: "input", Import: "input", MacroImport: "input",
  MacroParameter: "input", Repository: "input", SQL: "input", Tag: "input",
  // TableOperation (綠色) — Row 1
  Index: "tableop", Join: "tableop", MacroFunction: "tableop", Procedure: "tableop", Union: "tableop",
  // Function (藍色) — Row 2-3
  Batch: "function", Compress: "function", Cumulate: "function", Delta: "function",
  Duration: "function", EventMaker: "function", Filter: "function", Function: "function",
  HyperLink: "function", LoopBegin: "function", LoopEnd: "function", Percentage: "function",
  Product: "function", Rule: "function", Select: "function", Snapshot: "function",
  Sort: "function", TempMaker: "function",
  // Output (黃色) — Row 4-5
  Action: "output", Bar: "output", Barline: "output", BoxPlot: "output",
  DispatchScreen: "output", Gantt: "output", Line: "output", MacroExport: "output",
  Pie: "output", ResultTable: "output", StackBar: "output", StackBarLine: "output",
  StackTemporal: "output", Table: "output", Temporal: "output", XY: "output", XYTable: "output",
};

const CATEGORY_ACCENT: Record<BlockCategory, TypeAccent> = {
  input: { headerBg: "bg-orange-50", borderLeft: "border-l-orange-500", badgeClasses: "bg-orange-100 text-orange-700" },
  tableop: { headerBg: "bg-green-50", borderLeft: "border-l-green-500", badgeClasses: "bg-green-100 text-green-700" },
  function: { headerBg: "bg-blue-50", borderLeft: "border-l-blue-500", badgeClasses: "bg-blue-100 text-blue-700" },
  output: { headerBg: "bg-yellow-50", borderLeft: "border-l-yellow-500", badgeClasses: "bg-yellow-100 text-yellow-700" },
  general: { headerBg: "bg-gray-50", borderLeft: "border-l-gray-400", badgeClasses: "bg-gray-100 text-gray-600" },
};

function getAccent(type: BlockType): TypeAccent {
  return CATEGORY_ACCENT[TYPE_CATEGORY[type] ?? "general"];
}

function getCategory(type: BlockType): BlockCategory {
  return TYPE_CATEGORY[type] ?? "general";
}

// ─────────────────────────────────────────────────────────────
// Shell: 拖曳、縮放、定位，與內容無關
// 負責面板的拖曳、縮放、定位，與內容無關
// ─────────────────────────────────────────────────────────────

export function BlockInspector({
  block,
  initialX,
  initialY,
  wrapperRef,
  onClose,
  inspectorDraggingRef,
  onPositionChange,
  onFocus,
  zIndex = 100,
}: BlockInspectorProps) {
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  const panelRef = useRef<HTMLDivElement | null>(null);

  // 拖曳狀態與初始位置記錄
  const dragRef = useRef({
    dragging: false,
    startX: 0, startY: 0,
    originX: initialX, originY: initialY,
  });

  // 縮放狀態記錄
  const resizeRef = useRef({
    resizing: false,
    startX: 0, startY: 0,
    startW: 0, startH: 0,
  });

  // 初始位置
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transform = `translate(${initialX}px, ${initialY}px)`;
    onPositionChangeRef.current?.(initialX, initialY);
  }, [initialX, initialY]);

  // 拖曳 / resize mousemove + mouseup
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const panel = panelRef.current;
      const wrapper = wrapperRef.current;
      if (!panel || !wrapper) return;

      // 先處理 resize（優先於拖曳），並且限制在 wrapper 範圍內
      if (resizeRef.current.resizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const wrapperRect = wrapper.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const maxW = wrapperRect.width - panelRect.left + wrapperRect.left;
        const maxH = wrapperRect.height - panelRect.top + wrapperRect.top;
        panel.style.width = Math.min(Math.max(240, resizeRef.current.startW + dx), maxW) + "px";
        panel.style.height = Math.min(Math.max(180, resizeRef.current.startH + dy), maxH) + "px";
        return;
      }

      // 只有在拖曳狀態才處理 mousemove，並且限制在 wrapper 範圍內
      if (!dragRef.current.dragging) return;
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let x = dragRef.current.originX + (mx - dragRef.current.startX);
      let y = dragRef.current.originY + (my - dragRef.current.startY);
      const panelRect = panel.getBoundingClientRect();
      // 限制面板不超出 wrapper 範圍（可微調允許部分超出以利拖曳）
      x = Math.max(0, Math.min(x, rect.width - panelRect.width));
      y = Math.max(0, Math.min(y, rect.height - panelRect.height));
      panel.style.transform = `translate(${x}px, ${y}px)`;
      onPositionChangeRef.current?.(x, y);
    }

    // mouseup 停止拖曳/resize，並更新 origin 以利下一次拖曳
    function onMouseUp() {
      const panel = panelRef.current;
      const wrapper = wrapperRef.current;
      if (!panel || !wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      if (resizeRef.current.resizing || dragRef.current.dragging) {
        resizeRef.current.resizing = false;
        dragRef.current.dragging = false;
        dragRef.current.originX = panel.getBoundingClientRect().left - rect.left;
        dragRef.current.originY = panel.getBoundingClientRect().top - rect.top;
        inspectorDraggingRef.current = false;
      }
    }

    // 全局監聽 mousemove 和 mouseup，以支援在面板外拖曳/縮放
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!block) return null;

  const accent = getAccent(block.type);
  const r = block.raw;

  return (
    <div
      ref={panelRef}
      className={cn("absolute top-0 left-0 w-90 min-w-75 min-h-50 flex flex-col bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] pointer-events-auto overflow-hidden border border-gray-200 border-l-4 rounded-[1px]", accent.borderLeft)}
      style={{ zIndex }}
      onMouseDown={(e) => { e.stopPropagation(); onFocus?.(); }}
    >
      {/* Header（拖曳區） */}
      <div
        className={cn("flex items-center gap-2 select-none px-3 py-2 shrink-0 cursor-move border-b border-gray-200", accent.headerBg)}
        onMouseDown={(e) => {
          e.stopPropagation();
          onFocus?.();
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const rect = wrapper.getBoundingClientRect();
          inspectorDraggingRef.current = true;
          dragRef.current.dragging = true;
          dragRef.current.startX = e.clientX - rect.left;
          dragRef.current.startY = e.clientY - rect.top;
        }}
      >
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0", accent.badgeClasses)}>
          {block.type}
        </span>
        <strong className="text-sm truncate min-w-0">{r.BLOCK_NAME}</strong>
        <span className="text-gray-300 text-[10px] shrink-0">|</span>
        <span className="text-[10px] text-gray-400 shrink-0">Seq: <span className="font-mono text-gray-600">{r.BLOCK_SEQ}</span></span>
        <span className="text-[10px] text-gray-400 shrink-0">Group: <span className="font-mono text-gray-600">{r.BLOCK_GROUP}</span></span>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <span className="text-[10px] text-gray-300 select-none">Esc</span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-sm cursor-pointer px-1.5 py-0.5 leading-none text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body（捲動區） */}
      <div className="flex-1 min-h-0 overflow-auto">
        <InspectorBody block={block} r={r} />
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end"
        onMouseDown={(e) => {
          e.stopPropagation();
          onFocus?.();
          const panel = panelRef.current;
          if (!panel) return;
          resizeRef.current.resizing = true;
          inspectorDraggingRef.current = true;
          resizeRef.current.startX = e.clientX;
          resizeRef.current.startY = e.clientY;
          resizeRef.current.startW = panel.offsetWidth;
          resizeRef.current.startH = panel.offsetHeight;
        }}
      >
        <span className="text-[10px] text-gray-300 leading-none select-none">◢</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared Primitives
// ─────────────────────────────────────────────────────────────

// 區塊標題
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mt-1">
      {children}
    </div>
  );
}

// MetaRow：顯示一行欄位標籤 + 值，沒有值則不顯示
function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <span className="text-xs text-gray-900 break-all font-mono">{value}</span>
    </div>
  );
}

// 前置 Block 小徽章，顯示在 Inspector 的 PreBlocks 區塊中
function PreBlockBadge({ name, isPrimary }: { name: string; isPrimary: boolean }) {
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded border font-mono", isPrimary
      ? "border-orange-600 text-orange-600 bg-orange-50"
      : "border-gray-700 text-gray-700 bg-gray-50"
    )}>
      {isPrimary ? "●" : "○"} {name}
    </span>
  );
}

// ── 欄位標籤 + 值 ─────────────────────────────────────────────
function ColField({ label, value, labelCls = "text-gray-400", valueCls = "text-gray-700" }: {
  label: string; value: string;
  labelCls?: string; valueCls?: string;
}) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className={cn("text-[9px] font-medium", labelCls)}>{label}</span>
      <span className={cn("font-mono font-semibold", valueCls)}>{value}</span>
    </span>
  );
}

// ── 共用 Value 卡片（ProcessBody / FunctionBody 都用） ────────
type ValueCardTheme = { border: string; bg: string; indexCls: string; };
const VALUE_CARD_THEMES: Record<"gray" | "blue", ValueCardTheme> = {
  gray: { border: "border-gray-200", bg: "bg-gray-50", indexCls: "text-gray-400" },
  blue: { border: "border-blue-100", bg: "bg-blue-50/40", indexCls: "text-blue-300" },
};

// ValueCard：顯示一個條件值的卡片，包含欄位標籤、值，以及可選的箭頭（表示與前置 Block 的連線）
function ValueCard({ index, v, theme = "gray", col1Label, col2Label, showArrow = false }: {
  index: number; v: BlockValue;
  theme?: "gray" | "blue";
  col1Label: string; col2Label: string;
  showArrow?: boolean;
}) {
  const t = VALUE_CARD_THEMES[theme];
  const isBlue = theme === "blue";
  const labelCls = isBlue ? "text-blue-400" : "text-gray-400";
  return (
    <div className={cn("rounded border p-2.5", t.border, t.bg)}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn("text-[10px] font-medium w-4 text-right shrink-0", t.indexCls)}>{index + 1}</span>
        {showArrow && <span className="text-[10px] text-gray-400">←</span>}
        <div className="flex gap-3 text-xs min-w-0">
          {v.COLUMN1 && <ColField label={col1Label} value={v.COLUMN1} labelCls={labelCls} valueCls="text-blue-700" />}
          {v.COLUMN2 && <ColField label={col2Label} value={v.COLUMN2} labelCls={labelCls} valueCls={isBlue ? "text-blue-500" : "text-gray-500"} />}
        </div>
      </div>
      {v.VALUE != null && (
        <pre className={cn("font-mono text-xs leading-relaxed bg-white border rounded px-2.5 py-1.5 m-0 whitespace-pre-wrap break-all ml-6", t.border)}>
          <HighlightedValue code={v.VALUE} />
        </pre>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Syntax Highlighter
// ─────────────────────────────────────────────────────────────
type TokenType = "comment" | "string" | "keyword" | "variable" | "text";
type Token = { type: TokenType; text: string };

// 簡單的語法高亮實作，針對賦值表達式中的關鍵字、變數、字串和註解進行著色
const HIGHLIGHT_RE = /("(?:[^"\\]|\\.)*")|(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)|(\b(?:IF|ELSE|THEN|OR|AND)\b)|(\$[^\s"]+)|([^\s"]+)/g;

// 將賦值表達式切分成不同類型的 token，以便在 HighlightedValue 中渲染不同顏色
function tokenize(code: string): Token[] {
  const result: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  HIGHLIGHT_RE.lastIndex = 0;

  // 迭代所有匹配，根據捕獲群組判斷 token 類型，並將未匹配的部分作為普通文本
  while ((m = HIGHLIGHT_RE.exec(code)) !== null) {
    if (m.index > last) result.push({ type: "text", text: code.slice(last, m.index) });
    if (m[1]) result.push({ type: "string", text: m[1] });
    else if (m[2]) result.push({ type: "comment", text: m[2] });
    else if (m[3]) result.push({ type: "comment", text: m[3] });
    else if (m[4]) result.push({ type: "keyword", text: m[4] });
    else if (m[5]) result.push({ type: "variable", text: m[5] });
    else result.push({ type: "text", text: m[6]! });
    last = HIGHLIGHT_RE.lastIndex;
  }

  if (last < code.length) result.push({ type: "text", text: code.slice(last) });
  return result;
}

const TOKEN_CLASS: Record<TokenType, string> = {
  comment: "text-green-600",
  string: "text-amber-800",
  keyword: "text-blue-700",
  variable: "text-amber-700",
  text: "",
};

function HighlightedValue({ code }: { code: string }) {
  return (
    <>
      {tokenize(code).map((tok, i) => (
        <span key={i} className={TOKEN_CLASS[tok.type]}>
          {tok.text}
        </span>
      ))}
    </>
  );
}


// #region Body Design (每一個都是獨立的 React Component)

// ─────────────────────────────────────────────────────────────
// Body Registry — 在這裡指定哪個 type 用哪個模板
// ─────────────────────────────────────────────────────────────
type BodyComponent = React.ComponentType<{ r: RuleData }>;

// 明確指定特定 type 的模板（未列出的 type 走 DEFAULT_BODY）
const BODY_REGISTRY: Partial<Record<string, BodyComponent>> = {
  // Input
  // Data:        ProcessBody,

  // TableOperation
  // Join:        FunctionBody,

  // Function
  // Filter:      FunctionBody,

  // Output
  // Table:       ProcessBody,
};

// 依 category 決定預設模板（當 BODY_REGISTRY 沒有對應 type 時使用）
const CATEGORY_DEFAULT_BODY: Record<BlockCategory, BodyComponent> = {
  input:    ProcessBody,
  tableop:  FunctionBody,
  function: FunctionBody,
  output:   ProcessBody,
  general:  ProcessBody,
};

// 根據 block.type 決定 InspectorBody 的內容呈現，與拖曳/縮放無關
function InspectorBody({ block, r }: { block: Block; r: RuleData }) {
  const Body =
    BODY_REGISTRY[block.type] ??
    CATEGORY_DEFAULT_BODY[getCategory(block.type)];
  return <Body r={r} />;
}


// ─────────────────────────────────────────────────────────────
// BodyBase — Metadata + Pre-Blocks + Values（共用骨架）
// ─────────────────────────────────────────────────────────────
function BodyBase({ r, sectionLabel, theme = "gray", col1Label, col2Label, showArrow = false }: {
  r: RuleData;
  sectionLabel: string;
  theme?: "gray" | "blue";
  col1Label: string;
  col2Label: string;
  showArrow?: boolean;
}) {
  return (
    <div className="p-3 flex flex-col gap-2">
      {r.KEY && <MetaRow label="Key" value={r.KEY} />}

      {r.PRE_BLOCK && r.PRE_BLOCK.length > 0 && (
        <>
          <SectionTitle>Pre-Blocks</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {r.PRE_BLOCK.map((name, i) => (
              <PreBlockBadge key={name} name={name} isPrimary={i === 0} />
            ))}
          </div>
        </>
      )}

      {r.VALUES.length > 0 && (
        <>
          <SectionTitle>{sectionLabel} ({r.VALUES.length})</SectionTitle>
          <div className="flex flex-col gap-2">
            {r.VALUES.map((v, i) => (
              <ValueCard key={i} index={i} v={v} theme={theme} col1Label={col1Label} col2Label={col2Label} showArrow={showArrow} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FunctionBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Operations" theme="blue" col1Label="Output" col2Label="Source" />;
}

function ProcessBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Assignments" theme="gray" col1Label="Target" col2Label="Depends on" showArrow />;
}


// #endregion
