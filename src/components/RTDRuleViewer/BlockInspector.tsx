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

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Block, BlockType, BlockValue, RuleData } from "./types";
import { cn } from "../../utils/clsx";
import { tokenize, type TokenType } from "./apfParse";

// 高亮資訊以 Context 注入，讓 ColField / Value 標出命中內容，與「搜尋 / Tracker」邏輯解耦。
//   keyword    = 搜尋關鍵字（已 normWs、保留大小寫）→ 黃底
//   trackedLog = Tracker 選定的 [$LOG$] 名稱 → 該 log 觸發條件橘底
type HighlightInfo = { keyword: string; trackedLog: string };
const HighlightCtx = React.createContext<HighlightInfo>({ keyword: "", trackedLog: "" });

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
  onViewImportData?: (tableName: string) => void;
  hasRuntime?: boolean; // 有設 Runtime Log → 顯示「Log Value」鈕
  onViewLogValue?: () => void; // 開該 block 的 Log Value 對照面板
  searchKeyword?: string;
  trackedLogName?: string;
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
  MacroParameter: "input", Database: "input", SQL: "input", Tag: "input",
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
  onViewImportData,
  hasRuntime,
  onViewLogValue,
  searchKeyword = "",
  trackedLogName = "",
}: BlockInspectorProps) {
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; });
  const [showInfo, setShowInfo] = useState(false);

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
      className={cn("absolute top-0 left-0 w-90 min-w-75 min-h-50 max-h-140 flex flex-col bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] pointer-events-auto overflow-hidden border border-gray-200 border-l-4 rounded-[1px]", accent.borderLeft)}
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
          const panel = panelRef.current;
          if (!wrapper || !panel) return;
          const rect = wrapper.getBoundingClientRect();
          const matrix = new DOMMatrix(panel.style.transform);
          dragRef.current.originX = matrix.m41;
          dragRef.current.originY = matrix.m42;
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
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {block.type === "Import" && r.VALUES?.[0]?.KEY && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewImportData?.(r.VALUES[0].KEY!); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-[10px] px-2 py-0.5 rounded border border-blue-300 text-blue-500 hover:bg-blue-50 bg-transparent cursor-pointer"
            >
              View Data
            </button>
          )}
          {hasRuntime && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewLogValue?.(); }}
              onMouseDown={(e) => e.stopPropagation()}
              title="對照此 block 變數在 Runtime Log 的數值（看邏輯時的已知值參考）"
              className="text-[10px] px-2 py-0.5 rounded border border-amber-300 text-amber-600 hover:bg-amber-50 bg-transparent cursor-pointer"
            >
              Log Value
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowInfo((s) => !s); }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn("text-[11px] w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors bg-transparent",
              showInfo ? "border-blue-400 text-blue-500" : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
            )}
          >
            i
          </button>
          <span className="text-[10px] text-gray-300 select-none">Esc</span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-sm cursor-pointer px-1.5 py-0.5 leading-none text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-3 py-2 flex flex-wrap items-start gap-x-4 gap-y-1">
          <MetaRow label="Phase"  value={r.PHASE} />
          <MetaRow label="Rule"   value={r.RULE_NAME} />
          <MetaRow label="Group"  value={r.BLOCK_GROUP} />
          <MetaRow label="Seq"    value={r.BLOCK_SEQ} />
          {r.PREBLOCK && r.PREBLOCK.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-medium">Pre-Blocks</span>
              <div className="flex flex-wrap gap-1">
                {r.PREBLOCK.map((name, i) => (
                  <PreBlockBadge key={name} name={name} isPrimary={i === 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body（捲動區）：底部留 12px，讓捲軸不與右下角 resize 把手重疊 */}
      <div className="flex-1 min-h-0 overflow-auto mb-3">
        <HighlightCtx.Provider value={{ keyword: searchKeyword, trackedLog: trackedLogName }}>
          <InspectorBody block={block} r={r} />
        </HighlightCtx.Provider>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0.5 bottom-0 w-3 h-3 cursor-se-resize flex items-end justify-end"
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
  const { keyword } = useContext(HighlightCtx);
  return (
    <span className="flex flex-col gap-0.5">
      <span className={cn("text-[9px] font-medium", labelCls)}>{label}</span>
      <span className={cn("font-mono font-semibold", valueCls)}>{highlightPlain(value, keyword)}</span>
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
function ValueCard({ v, theme = "gray", col1Label, col2Label, showArrow = false, showKey = false }: {
  v: BlockValue;
  theme?: "gray" | "blue";
  col1Label: string; col2Label: string;
  showArrow?: boolean;
  showKey?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { keyword, trackedLog } = useContext(HighlightCtx);
  const hlActive = keyword !== "" || trackedLog !== "";
  const t = VALUE_CARD_THEMES[theme];
  const isBlue = theme === "blue";
  const labelCls = isBlue ? "text-blue-400" : "text-gray-400";
  const hasValue = v.VALUE != null && v.VALUE !== "";

  return (
    <div className={cn("rounded border p-2.5", t.border, t.bg)}>
      <div className="flex items-center gap-2 mb-1.5">
        {showArrow && <span className="text-[10px] text-gray-400">←</span>}
        <div className="flex gap-3 text-xs min-w-0 flex-1">
          {showKey && v.KEY && <ColField label="TBL" value={v.KEY} labelCls={labelCls} valueCls="text-gray-800" />}
          {v.COLUMN1 && <ColField label={col1Label} value={v.COLUMN1} labelCls={labelCls} valueCls="text-blue-700" />}
          {v.COLUMN2 && <ColField label={col2Label} value={v.COLUMN2} labelCls={labelCls} valueCls={isBlue ? "text-blue-500" : "text-gray-500"} />}
        </div>
        {hasValue && (
          <button
            className="shrink-0 text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 px-1 leading-none"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        )}
      </div>
      {hasValue && (
        expanded ? (
          hlActive ? (
            // 搜尋 / Tracker 中：唯讀「語法色 + 命中螢光底」版（避免與 contentEditable 編輯互相干擾）
            <pre className={cn("font-mono text-xs leading-relaxed bg-white border rounded px-2.5 py-1.5 m-0 whitespace-pre-wrap break-all", t.border)}>
              <HighlightedValueWithMarks code={formatAPF(v.VALUE!)} keyword={keyword} trackedLog={trackedLog} />
            </pre>
          ) : (
            // 無高亮：可就地編輯版（草稿，不寫回資料）
            <EditableHighlighted
              className={cn("font-mono text-xs leading-relaxed bg-white border rounded px-2.5 py-1.5 m-0 whitespace-pre-wrap break-all cursor-text focus:outline-none focus:ring-1 focus:ring-blue-300", t.border)}
              code={formatAPF(v.VALUE!)}
            />
          )
        ) : (
          <div
            className={cn("font-mono text-xs bg-white border rounded px-2.5 py-1.5 truncate text-gray-500 cursor-pointer", t.border)}
            onClick={() => setExpanded(true)}
          >
            {highlightPlain(v.VALUE!.replace(/\n/g, " "), keyword)}
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APF Formatter — 在非字串區段插入換行與縮排，提升可讀性
// ─────────────────────────────────────────────────────────────
function formatAPF(code: string): string {
  const KEYWORDS: [RegExp, string][] = [
    [/^\s+ELSE\s+IF\s+/, "\nELSE IF "],
    [/^\s+AND\s+/,       "\n  AND "],
    [/^\s+OR\s+/,        "\n  OR "],
    [/^\s+THEN\s+/,      "\n  THEN "],
    [/^\s+ELSE\s+/,      "\nELSE "],
  ];

  // 整條字串統一掃描，depth 跨字串區段持續累積
  let out = "", i = 0, depth = 0;

  while (i < code.length) {
    // 字串字面值：整段照抄，不修改也不追蹤括號
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === '"')  { j++; break; }
        j++;
      }
      out += code.slice(i, j);
      i = j;
      continue;
    }

    // 區塊註解 /* ... */：整段照抄，不追蹤括號 / 關鍵字；註解後強制換行（自成一行）
    if (code[i] === '/' && code[i + 1] === '*') {
      let j = i + 2;
      while (j < code.length && !(code[j] === '*' && code[j + 1] === '/')) j++;
      j = Math.min(j + 2, code.length); // 含結尾 */；未閉合則到字串尾
      out += code.slice(i, j);
      while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++; // 吃掉註解後的空白
      out += "\n";
      i = j;
      continue;
    }

    // 行註解 // ...：照抄到行尾；若同行前面有內容，先換行讓它自成一行
    if (code[i] === '/' && code[i + 1] === '/') {
      let j = i + 2;
      while (j < code.length && code[j] !== '\n') j++;
      out = out.replace(/[ \t]+$/, "");                       // 去掉註解前的尾隨空白
      if (out.length > 0 && !out.endsWith("\n")) out += "\n"; // 自成一行
      out += code.slice(i, j);
      i = j;
      continue;
    }

    if (code[i] === '(') { depth++; out += '('; i++; continue; }
    if (code[i] === ')') { depth--; out += ')'; i++; continue; }

    // 只在括號外插入換行
    if (depth === 0) {
      const rest = code.slice(i);
      let matched = false;
      for (const [pat, rep] of KEYWORDS) {
        const hit = rest.match(pat);
        if (hit) { out += rep; i += hit[0].length; matched = true; break; }
      }
      if (!matched) out += code[i++];
    } else {
      out += code[i++];
    }
  }

  return out.trim();
}

// ─────────────────────────────────────────────────────────────
// Syntax Highlighter（tokenize / Token 共用自 apfParse.ts）
// ─────────────────────────────────────────────────────────────
const TOKEN_CLASS: Record<TokenType, string> = {
  comment:  "text-green-600",
  string:   "text-amber-800",
  keyword:  "text-violet-600",
  function: "text-blue-600",
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

// ─────────────────────────────────────────────────────────────
// EditableHighlighted — 就地可編輯的高亮值（草稿性質）
//   - contentEditable：使用者可直接改字
//   - 高亮只算一次 → 顏色不變（打字不會重新 tokenize，既有 token 顏色固定）
//   - React.memo 永不重繪 → 拖曳 / 父層重繪不會洗掉使用者的編輯
//   - 純 DOM 編輯，不寫回 v.VALUE；關閉 inspector 再開（unmount→remount）即還原原始資料
// ─────────────────────────────────────────────────────────────
const EditableHighlighted = React.memo(
  function EditableHighlighted({ code, className }: { code: string; className: string }) {
    return (
      <pre
        className={className}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        title="可就地編輯（暫存草稿；關閉 inspector 重開即還原原始資料）"
      >
        <HighlightedValue code={code} />
      </pre>
    );
  },
  () => true, // 掛載後永不重繪，保住使用者的就地編輯內容
);

// ─────────────────────────────────────────────────────────────
// 搜尋命中高亮（與搜尋比對共用「空白不敏感」語意）
// ─────────────────────────────────────────────────────────────

// 純字串（KEY / COLUMN）的命中高亮：大小寫不敏感，標出所有出現處
function highlightPlain(text: string, keyword: string): React.ReactNode {
  const kw = keyword.replace(/\s+/g, " ").trim();
  if (!kw) return text;
  const lower = text.toLowerCase();
  const k = kw.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0, n = 0;
  for (;;) {
    const idx = lower.indexOf(k, i);
    if (idx === -1) { out.push(text.slice(i)); break; }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark key={n++} className="bg-yellow-200/70 text-inherit rounded-sm px-0.5">
        {text.slice(idx, idx + k.length)}
      </mark>
    );
    i = idx + k.length;
  }
  return <>{out}</>;
}

// 在「已 formatAPF」的字串上，算出每個字元是否落在搜尋命中範圍內。
// 搜尋空白不敏感：把字串正規化（\s+→單空格）後找命中，再映射回原字元位置，
// 因此跨 formatAPF 換行的命中也能標成連續螢光底。
function computeMatchMask(code: string, keyword: string): boolean[] {
  const mask = new Array<boolean>(code.length).fill(false);
  const kw = keyword.replace(/\s+/g, " ").trim().toLowerCase();
  if (!kw) return mask;

  // norm：正規化字串；map[k]=norm[k] 對應 code 的起始索引（含尾端哨兵）
  let norm = "";
  const map: number[] = [];
  let i = 0;
  while (i < code.length) {
    if (/\s/.test(code[i])) {
      norm += " ";
      map.push(i);
      while (i < code.length && /\s/.test(code[i])) i++;
    } else {
      norm += code[i];
      map.push(i);
      i++;
    }
  }
  map.push(code.length);

  const hay = norm.toLowerCase();
  let from = 0;
  for (;;) {
    const idx = hay.indexOf(kw, from);
    if (idx === -1) break;
    for (let p = map[idx]; p < map[idx + kw.length]; p++) mask[p] = true;
    from = idx + kw.length;
  }
  return mask;
}

// 算出「觸發某個 [$LOG$] 的 IF/ELSE-IF 條件」落在哪些字元（含該 clause 的 IF 關鍵字，到 THEN 之前）。
// 用既有 tokenize 取結構關鍵字（IF/THEN/ELSE；AND/OR 屬條件內容不計），找出「THEN 結果含目標 log」那條，
// 標記其 [IF .. 條件結尾]。Tracker 選定某 log 時，用來高亮它的觸發條件。
function computeLogConditionMask(code: string, logName: string): boolean[] {
  const mask = new Array<boolean>(code.length).fill(false);
  if (!logName) return mask;
  const needle = `$${logName}$`;

  // 收集結構關鍵字位置（IF / THEN / ELSE）
  const kws: { text: string; start: number; end: number }[] = [];
  let pos = 0;
  for (const tok of tokenize(code)) {
    if (tok.type === "keyword" && (tok.text === "IF" || tok.text === "THEN" || tok.text === "ELSE")) {
      kws.push({ text: tok.text, start: pos, end: pos + tok.text.length });
    }
    pos += tok.text.length;
  }

  for (let i = 0; i < kws.length; i++) {
    if (kws[i].text !== "THEN") continue;
    // 往前找最近的 IF（此 clause 開頭）
    let ifKw: { start: number; end: number } | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (kws[j].text === "IF") { ifKw = kws[j]; break; }
    }
    if (!ifKw) continue;
    // THEN 之後到下一個 ELSE（或結尾）= 此 clause 的結果
    let resultEnd = code.length;
    for (let j = i + 1; j < kws.length; j++) {
      if (kws[j].text === "ELSE") { resultEnd = kws[j].start; break; }
    }
    if (!code.slice(kws[i].end, resultEnd).includes(needle)) continue;
    // 標記 [IF .. 條件結尾]（去掉 THEN 前的尾隨空白）
    const a = ifKw.start;
    let b = kws[i].start;
    while (b > a && /\s/.test(code[b - 1])) b--;
    for (let p = a; p < b; p++) mask[p] = true;
  }
  return mask;
}

// VALUE 命中高亮：語法色（tokenize）+ 兩種螢光底疊加。
//   黃底（lv 2）= 搜尋命中字串；橘底（lv 1）= Tracker 選定 log 的觸發條件
const HighlightedValueWithMarks = React.memo(function HighlightedValueWithMarks(
  { code, keyword, trackedLog }: { code: string; keyword: string; trackedLog: string }
) {
  const searchMask = useMemo(() => computeMatchMask(code, keyword), [code, keyword]);
  const condMask = useMemo(() => computeLogConditionMask(code, trackedLog), [code, trackedLog]);
  const tokens = useMemo(() => tokenize(code), [code]);

  const level = (p: number): number => (searchMask[p] ? 2 : condMask[p] ? 1 : 0);

  const parts: React.ReactNode[] = [];
  let pos = 0, key = 0;
  for (const tok of tokens) {
    const cls = TOKEN_CLASS[tok.type];
    let i = 0;
    while (i < tok.text.length) {
      const lv = level(pos + i);
      let j = i + 1;
      while (j < tok.text.length && level(pos + j) === lv) j++;
      const seg = tok.text.slice(i, j);
      const bg = lv === 2 ? "bg-yellow-200/70" : lv === 1 ? "bg-orange-200/70" : "";
      parts.push(
        bg
          ? <mark key={key++} className={cn(bg, "text-inherit", cls)}>{seg}</mark>
          : <span key={key++} className={cls}>{seg}</span>
      );
      i = j;
    }
    pos += tok.text.length;
  }
  return <>{parts}</>;
});


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
  Index: IndexBody,
  // Join:        FunctionBody,

  // Function
  // Filter:      FunctionBody,

  // Output
  // Table:       ProcessBody,
};

// 依 category 決定預設模板（當 BODY_REGISTRY 沒有對應 type 時使用）
const CATEGORY_DEFAULT_BODY: Record<BlockCategory, BodyComponent> = {
  input: DataSourceBody,
  tableop: FunctionBody,
  function: FunctionBody,
  output: ProcessBody,
  general: ProcessBody,
};

// 根據 block.type 決定 InspectorBody 的內容呈現，與拖曳/縮放無關
function InspectorBody({ block, r }: { block: Block; r: RuleData }) {
  // 預設去找自己的模板，如果沒有就找通用模板
  const Body = BODY_REGISTRY[block.type] ?? CATEGORY_DEFAULT_BODY[getCategory(block.type)];
  return <Body r={r} />;
}

// ─────────────────────────────────────────────────────────────
// BodyBase — Metadata + Pre-Blocks + Values（共用骨架）
// ─────────────────────────────────────────────────────────────
function BodyBase({ r, sectionLabel, theme = "gray", col1Label, col2Label, showArrow = false, showKey = false }: {
  r: RuleData;
  sectionLabel: string;
  theme?: "gray" | "blue";
  col1Label: string;
  col2Label: string;
  showArrow?: boolean;
  showKey?: boolean;
}) {
  return (
    <div className="p-3 flex flex-col gap-2">
      {(r.VALUES?.length ?? 0) > 0 && (
        <>
          <SectionTitle>{sectionLabel} ({r.VALUES?.length})</SectionTitle>
          <div className="flex flex-col gap-2">
            {(r.VALUES ?? []).map((v, i) => (
              <ValueCard key={i} v={v} theme={theme} col1Label={col1Label} col2Label={col2Label} showArrow={showArrow} showKey={showKey} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DataSourceBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Import" theme="gray" col1Label="Columns" col2Label="" showKey />;
}


function FunctionBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Operations" theme="blue" col1Label="Output" col2Label="Source" />;
}

function ProcessBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Assignments" theme="gray" col1Label="Target" col2Label="Depends on" showArrow />;
}

// Index：主副線 column mapping（join key 對應）後，把副線特定欄位插入主線
// COLUMN1=主線 Key、COLUMN2=副線 Key、VALUE=要插入的副線欄位
function IndexBody({ r }: { r: RuleData }) {
  return <BodyBase r={r} sectionLabel="Insert Columns" theme="blue" col1Label="主線 Key" col2Label="副線 Key" showArrow />;
}
// #endregion
