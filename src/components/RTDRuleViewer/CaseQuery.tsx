// ============================================================
// CaseQuery.tsx  (Tracker — 受控 readout)
//
// 反藍 Log 溯源的「側欄 readout」：與 canvas 共用同一份 block-level 展開狀態。
//   - 展開狀態 expandedBlocks（block-keyed）由父層 RuleViewer 持有，canvas 點 block 與
//     本樹點節點都驅動同一份 → 完全同步。
//   - 樹節點展開 = 它的定義 block 在 expandedBlocks。hover 節點 → 連動 canvas 高亮。
//   - 有 runtime 值時：每列依條件命中與否上色（綠=成立 / 淡=不成立）。
//   - 一鍵複製：buildLogReport 產出 AI 分析用 context pack。
// spec: specs/2026-06-07-tracker-dep-graph.md
// ============================================================

import { useState, useMemo, useRef, useEffect } from "react";
import type { RuleData, DepGraph, ViewNode, TrackerMode, ImpactResult } from "./types";
import { cn } from "../../utils/clsx";
import { traceLog, expandVar, collectLogClosure, buildLogReport, resolveDefs, evalSnippet } from "./depGraph";

const EMPTY_PATH: ReadonlySet<string> = new Set();
const EMPTY_SET: Set<string> = new Set();

// ─── Pure Utils ────────────────────────────────────────────────
function parseRuntimeLog(log: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /\((\w+):\s*([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(log)) !== null) result[m[1].trim()] = m[2].trim();
  return result;
}

function parseLogName(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/^\[?\$?([A-Z][A-Z0-9_]*)\$?\]?$/);
  return m ? m[1] : trimmed.toUpperCase();
}

// ─── Layer 顏色（依深度循環） ──────────────────────────────────
const LAYER_STYLES: [border: string, bg: string][] = [
  ["border-blue-500/35",    "bg-blue-500/5"],
  ["border-emerald-500/35", "bg-emerald-500/5"],
  ["border-purple-500/35",  "bg-purple-500/5"],
  ["border-orange-500/35",  "bg-orange-500/5"],
  ["border-pink-500/35",    "bg-pink-500/5"],
];
const getLayerStyle = (depth: number): [string, string] => LAYER_STYLES[depth % LAYER_STYLES.length];

// ─── LayerNode（受控：展開狀態來自 expandedBlocks）──────────────
type NodeShared = {
  graph: DepGraph;
  shared: Set<string>;
  runtimeValues: Record<string, string>;
  expandedBlocks: Set<string>;
  hoverBlock: string | null;
  onToggleBlock: (block: string) => void;
  onHoverBlock: (block: string | null) => void;
  onFocusBlock?: (blockName: string) => void;
  onOpenInspector?: (blockName: string) => void;
};

function LayerNode({
  node, path, depth, parentBlock, ctx,
}: {
  node: ViewNode;
  path: ReadonlySet<string>;
  depth: number;
  parentBlock: string;
  ctx: NodeShared;
}) {
  const { graph, shared, runtimeValues, expandedBlocks, hoverBlock, onToggleBlock, onHoverBlock, onFocusBlock, onOpenInspector } = ctx;

  const defBlocks = useMemo(
    () => resolveDefs(graph, node.varName, parentBlock).map((d) => d.block),
    [graph, node.varName, parentBlock],
  );
  const expandable = (node.status === "normal" || node.status === "shared") && defBlocks.length > 0;
  const expanded = expandable && defBlocks.some((b) => expandedBlocks.has(b));
  const [borderCls, bgCls] = getLayerStyle(depth);

  const groups = useMemo(
    () => (expanded ? expandVar(graph, node.varName, parentBlock, path as Set<string>, shared) : []),
    [expanded, graph, node.varName, parentBlock, path, shared],
  );
  const childPath = useMemo(() => new Set(path).add(node.varName), [path, node.varName]);

  const runtimeValue = runtimeValues[node.varName];
  const hasRuntime = Object.keys(runtimeValues).length > 0;
  const fire = hasRuntime ? evalSnippet(node.edge.snippet, runtimeValues) : undefined;
  const hovered = hoverBlock !== null && defBlocks.includes(hoverBlock);
  const snippet = node.edge.snippet;
  const toggle = () => { if (expandable && defBlocks[0]) onToggleBlock(defBlocks[0]); };

  return (
    <div className="flex flex-col">
      {/* 變數列 */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors",
          borderCls, bgCls,
          hovered && "ring-1 ring-sky-400/70",
          fire === "yes" && "border-l-2 border-l-green-400/80",
          fire === "no" && "opacity-45",
        )}
        onMouseEnter={() => onHoverBlock(defBlocks[0] ?? null)}
        onMouseLeave={() => onHoverBlock(null)}
      >
        <button
          onClick={toggle}
          className={cn(
            "w-3 shrink-0 text-[9px] text-center transition-colors leading-none",
            expandable ? "cursor-pointer text-white/40 hover:text-white" : "cursor-default text-transparent pointer-events-none",
          )}
        >
          {expandable ? (expanded ? "▼" : "▶") : ""}
        </button>

        <span className="text-[9px] font-mono text-white/40 shrink-0 tabular-nums">L{depth}</span>
        <span className="font-mono font-bold text-sky-300 shrink-0">{node.varName}</span>

        {snippet && snippet !== node.varName && (
          <span className="text-white/45 text-[10px] font-mono truncate min-w-0">{snippet}</span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {runtimeValue !== undefined && (
            <span className={cn(
              "font-mono text-[10px] px-1.5 py-px rounded border",
              fire === "yes" ? "bg-green-400/15 text-green-300 border-green-400/30"
                : fire === "no" ? "bg-white/5 text-slate-400 border-white/10"
                : "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
            )}>
              = {runtimeValue}
            </span>
          )}
          {node.status === "root" && <span className="text-[10px] text-slate-400 italic">root</span>}
          {node.status === "cycle" && <span className="text-[10px] text-orange-400/70">↩ 循環</span>}
          {node.status === "shared" && <span className="text-[10px] text-indigo-300/70">⇇ 共用</span>}
        </div>
      </div>

      {/* 展開後：來源 Block + 子節點 */}
      {expanded && (
        <div className="ml-1.5 border-l border-white/8 pl-2 mt-0.5 flex flex-col gap-1.5">
          {groups.map((g, gi) => (
            <div key={`${g.block}-${gi}`} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-0.5 py-0.5">
                <span className="text-slate-400">來自</span>
                <button
                  onClick={() => onFocusBlock?.(g.block)}
                  onDoubleClick={() => onOpenInspector?.(g.block)}
                  title={`點擊跳到 ${g.block} · 雙擊開 inspector`}
                  className="font-mono text-sky-400/80 font-semibold hover:text-sky-300 hover:underline cursor-pointer"
                >
                  {g.block}
                </button>
                <span className="px-1 py-px rounded bg-white/5 text-slate-400 text-[9px]">{g.blockType}</span>
              </div>
              {g.children.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {g.children.map((child, ci) => (
                    <LayerNode
                      key={`${child.varName}-${gi}-${ci}`}
                      node={child}
                      path={childPath}
                      depth={depth + 1}
                      parentBlock={g.block}
                      ctx={ctx}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 px-1 italic">無條件變數</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AntiBlueBadge ─────────────────────────────────────────────
function AntiBlueBadge({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-px rounded text-xs font-bold font-mono mx-0.5 align-middle border",
        active
          ? "bg-red-500/25 text-red-300 border-red-500/50 ring-1 ring-red-400/30"
          : "bg-red-500/10 text-red-400/70 border-red-500/20",
      )}
    >
      <span className="text-red-500/50 text-xs">[$</span>
      {name}
      <span className="text-red-500/50 text-xs">$]</span>
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────
export type CaseQueryProps = {
  graph: DepGraph;
  rules: RuleData[];                                   // buildLogReport 用
  selectedRule: string | null;
  tracedLog: string | null;
  expandedBlocks: Set<string>;
  runtimeValues: Record<string, string>;
  hoverBlock: string | null;
  mode: TrackerMode;                                   // trace（反查）/ impact（影響）
  onModeChange: (mode: TrackerMode) => void;
  impactVar: string;                                   // impact 模式查詢的變數
  onImpactVarChange: (v: string) => void;
  impactResult: ImpactResult | null;                  // 由父層 computeImpact 算好
  onTraceLog: (logName: string | null) => void;       // 選定 / 清除追蹤的 log
  onToggleBlock: (block: string) => void;             // 展開 / 收合某 block 的上游
  onRuntimeChange: (vals: Record<string, string>) => void;
  onHoverBlock: (block: string | null) => void;
  onFocusBlock?: (blockName: string) => void;
  onOpenInspector?: (blockName: string) => void;     // 雙擊 block 參照 → 開 inspector
};

export function CaseQuery({
  graph, rules, selectedRule, tracedLog, expandedBlocks, runtimeValues, hoverBlock,
  mode, onModeChange, impactVar, onImpactVarChange, impactResult,
  onTraceLog, onToggleBlock, onRuntimeChange, onHoverBlock, onFocusBlock, onOpenInspector,
}: CaseQueryProps) {
  const [searchInput, setSearchInput]         = useState("");
  const [dropOpen, setDropOpen]               = useState(false);
  const [logHighlightIdx, setLogHighlightIdx] = useState(-1);
  const [runtimeLog, setRuntimeLog]           = useState("");
  const [logInputOpen, setLogInputOpen]       = useState(false);
  const [copied, setCopied]                   = useState(false);
  const searchWrapRef                         = useRef<HTMLDivElement>(null);
  const logListRef                            = useRef<HTMLUListElement>(null);

  const allLogNames = useMemo(() => [...graph.logs.keys()].sort(), [graph]);
  const allVarNames = useMemo(() => [...graph.vars.keys()].sort(), [graph]);
  const filteredLogs = useMemo(() => {
    const kw = searchInput.replace(/^\[?\$|\$\]?$/g, "").trim().toLowerCase();
    return kw ? allLogNames.filter((n) => n.toLowerCase().includes(kw)) : allLogNames;
  }, [allLogNames, searchInput]);

  // filteredLogs 一變就重置鍵盤高亮：render 期間比對前值調整 state（React 認可，不像 effect 會 cascading render）
  const [prevFiltered, setPrevFiltered] = useState(filteredLogs);
  if (prevFiltered !== filteredLogs) {
    setPrevFiltered(filteredLogs);
    setLogHighlightIdx(-1);
  }

  // tracedLog → layer-0 + shared
  const closure = useMemo(() => (tracedLog ? collectLogClosure(graph, tracedLog) : null), [graph, tracedLog]);
  const shared = closure?.shared ?? EMPTY_SET;
  const layers = useMemo(
    () => (tracedLog ? (traceLog(graph, tracedLog, shared) ?? []) : []),
    [graph, tracedLog, shared],
  );

  // 點外部關閉下拉
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 原始 runtime 文字 → 解析後上拋（canvas 與本樹共用）
  useEffect(() => { onRuntimeChange(parseRuntimeLog(runtimeLog)); }, [runtimeLog, onRuntimeChange]);

  useEffect(() => {
    if (logHighlightIdx < 0 || !logListRef.current) return;
    const items = logListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]");
    items[logHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [logHighlightIdx]);

  function handleTrace(overrideName?: string) {
    const logName = overrideName ?? parseLogName(searchInput);
    if (!logName) return;
    onTraceLog(graph.logs.has(logName) ? logName : null);
  }

  function handleBack() {
    setSearchInput("");
    onTraceLog(null);
  }

  function handleCopy() {
    if (!tracedLog) return;
    const report = buildLogReport(graph, rules, tracedLog, runtimeValues);
    navigator.clipboard.writeText(report).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
      () => { /* clipboard 失敗時靜默 */ },
    );
  }

  function handleLogKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropOpen(true);
      setLogHighlightIdx((i) => Math.min(i + 1, filteredLogs.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLogHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (dropOpen && logHighlightIdx >= 0 && filteredLogs[logHighlightIdx]) {
        const name = filteredLogs[logHighlightIdx];
        setSearchInput(`[$${name}$]`);
        setDropOpen(false);
        setLogHighlightIdx(-1);
        handleTrace(name);
      } else {
        setDropOpen(false);
        handleTrace();
      }
    } else if (e.key === "Escape") {
      setDropOpen(false);
      setLogHighlightIdx(-1);
    }
  }

  if (!selectedRule || rules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs text-center">
        請先選擇 Rule
      </div>
    );
  }

  const runtimeValueCount = Object.keys(runtimeValues).length;
  const totalL0 = layers.reduce((n, l) => n + l.children.length, 0);

  const nodeCtx: NodeShared = {
    graph, shared, runtimeValues, expandedBlocks, hoverBlock, onToggleBlock, onHoverBlock, onFocusBlock, onOpenInspector,
  };

  // ── 模式切換（trace 反查 / impact 影響）──────────────────────
  const modeTabs = (
    <div className="flex gap-0.5 shrink-0">
      {(["trace", "impact"] as TrackerMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={cn("px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors", mode === m
            ? "bg-white/15 text-white"
            : "text-slate-400 hover:text-white hover:bg-white/7")}
        >
          {m === "trace" ? "反查 Trace" : "影響 Impact"}
        </button>
      ))}
    </div>
  );

  // ── Impact 模式（變數 → 受影響反藍）─ spec ① ────────────────
  if (mode === "impact") {
    const typed = impactVar.trim();
    const kw = typed.toUpperCase();
    const suggestions = kw && !graph.vars.has(typed)
      ? allVarNames.filter((v) => v.toUpperCase().includes(kw)).slice(0, 30)
      : [];
    const res = impactResult;
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {modeTabs}
        <div className="relative shrink-0">
          <input
            className="w-full rounded px-2 py-1 bg-white/10 text-white border border-white/20
              placeholder:text-white/25 text-xs outline-none focus:border-white/40 font-mono"
            placeholder="輸入變數名（DB 欄位 / 中間變數）"
            value={impactVar}
            onChange={(e) => onImpactVarChange(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 mt-1 w-full max-h-50 overflow-y-auto rounded
              border border-white/20 bg-slate-700 shadow-xl z-2000 list-none p-0 m-0">
              {suggestions.map((v) => (
                <li
                  key={v}
                  className="px-2.5 py-1.5 text-xs font-mono cursor-pointer text-sky-300 hover:bg-white/10 hover:text-white"
                  onMouseDown={(e) => { e.preventDefault(); onImpactVarChange(v); }}
                >
                  {v}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-1.5">
          {!typed && (
            <p className="text-slate-400 text-xs">輸入變數，查出它影響哪些反藍 Log（沿依賴鏈反向）。</p>
          )}
          {typed && res && !res.found && (
            <p className="text-slate-400 text-xs">變數 <span className="font-mono text-white/70">{typed}</span> 不在此 Rule 的依賴圖中。</p>
          )}
          {res?.found && res.logs.length === 0 && (
            <p className="text-slate-400 text-xs">此變數無下游反藍 Log（不影響任何 [$LOG$]）。</p>
          )}
          {res?.found && res.logs.length > 0 && (
            <>
              <div className="shrink-0 text-slate-400 text-[10px] tabular-nums text-right">
                {res.logs.length} 個受影響反藍（點擊跳去 Trace）
              </div>
              {res.logs.map((l) => (
                <button
                  key={l.logName}
                  onClick={() => { onModeChange("trace"); onTraceLog(l.logName); }}
                  title={`追蹤 [$${l.logName}$]`}
                  className="text-left px-2.5 py-2 rounded-lg border border-white/10 bg-white/4 hover:bg-white/8 cursor-pointer transition-colors"
                >
                  <AntiBlueBadge name={l.logName} />
                  <div className="mt-1 font-mono text-[10px] text-white/45 truncate">
                    {l.path.vars.join(" → ")} → 觸發
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Search Bar ──────────────────────────────────────────────
  const searchBar = (
    <div ref={searchWrapRef} className="flex items-center gap-1.5 shrink-0 relative">
      <div className="flex-1 min-w-0 relative">
        <input
          className="w-full rounded px-2 py-1 bg-white/10 text-white border border-white/20
            placeholder:text-white/25 text-xs outline-none focus:border-white/40 font-mono"
          placeholder="[$LOG_NAME$]"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setDropOpen(true); setLogHighlightIdx(-1); }}
          onFocus={() => setDropOpen(true)}
          onKeyDown={handleLogKeyDown}
        />
        {dropOpen && filteredLogs.length > 0 && (
          <ul
            ref={logListRef}
            className="absolute top-full left-0 mt-1 w-full max-h-50 overflow-y-auto
              rounded border border-white/20 bg-slate-700 shadow-xl z-2000 list-none p-0 m-0"
          >
            {filteredLogs.map((name, i) => (
              <li
                key={name}
                data-item
                className={cn(
                  "px-2.5 py-1.5 text-xs font-mono cursor-pointer flex items-center gap-1",
                  i === logHighlightIdx ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchInput(`[$${name}$]`);
                  setDropOpen(false);
                  setLogHighlightIdx(-1);
                  handleTrace(name);
                }}
              >
                <span className="text-red-400/60">[$</span>
                <span className="text-red-300 font-bold">{name}</span>
                <span className="text-red-400/60">$]</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={() => { setDropOpen(false); handleTrace(); }}
        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
      >
        Trace
      </button>
    </div>
  );

  // ── Runtime Log Section ─────────────────────────────────────
  const logInputSection = (
    <div className="rounded-lg border border-white/10 bg-white/2 overflow-hidden shrink-0">
      <button
        onClick={() => setLogInputOpen((c) => !c)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/4 transition-colors cursor-pointer text-left"
      >
        <span className="text-slate-400 text-xs">Runtime Log</span>
        {runtimeValueCount > 0 && (
          <span className="text-green-400 font-mono text-[10px] px-1.5 py-px rounded bg-green-400/10 border border-green-400/25">
            {runtimeValueCount} vars · 自動展開命中路徑
          </span>
        )}
        <span className="ml-auto text-slate-400 text-xs leading-none">{logInputOpen ? "▼" : "▶" }</span>
      </button>
      {logInputOpen && (
        <div className="px-2.5 pb-2.5">
          <textarea
            className="w-full rounded px-2 py-1.5 bg-white/8 text-white border border-white/15
              placeholder:text-white/20 text-xs outline-none focus:border-white/35 font-mono
              resize-none leading-relaxed"
            rows={3}
            placeholder="(VariableA: 10) (VariableB: Y) ..."
            value={runtimeLog}
            onChange={(e) => setRuntimeLog(e.target.value)}
          />
        </div>
      )}
    </div>
  );

  // ── Idle ────────────────────────────────────────────────────
  if (!tracedLog) {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {modeTabs}
        {searchBar}
        {logInputSection}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <span className="text-xl opacity-20">[$]</span>
          選 / 輸入反藍 Log 開始追蹤
          <br />
          右鍵 canvas block 往上游展開 · 雙擊 block 看完整定義
        </div>
      </div>
    );
  }

  // ── Log Mode ────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      {modeTabs}
      {searchBar}
      {logInputSection}

      {/* Breadcrumb + 複製 */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleBack}
          className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
          title="返回"
        >
          ←
        </button>
        <span className="text-slate-400 text-xs">/</span>
        <AntiBlueBadge name={tracedLog} active />

        <button
          onClick={handleCopy}
          title="複製此反藍的完整追蹤資訊（觸發點 + 依賴樹 + 相關 Block 定義 + roots），可貼給 AI 分析"
          className={cn(
            "ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 cursor-pointer transition-colors border",
            copied
              ? "bg-green-500/20 text-green-300 border-green-500/40"
              : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white",
          )}
        >
          {copied ? "✓ 已複製" : "複製結構"}
        </button>
      </div>

      <div className="shrink-0 text-slate-400 text-[10px] tabular-nums text-right">
        {totalL0 > 0 ? `L0 · ${totalL0} 變數（點節點 ▸ 或右鍵 canvas block 展開）` : "無條件變數"}
      </div>

      {/* Layer Tree */}
      <div className="flex-1 min-h-0 overflow-auto">
        {totalL0 === 0 ? (
          <div className="text-slate-400 text-xs text-center py-6 italic">此 LOG 的觸發條件無可追蹤變數</div>
        ) : (
          <div className="flex flex-col gap-2">
            {layers.map((layer, li) => {
              const triggerFire = runtimeValueCount > 0 ? evalSnippet(layer.clauseCond, runtimeValues) : null;
              return (
              <div key={`${layer.block}-${li}`} className="flex flex-col gap-1">
                {(layers.length > 1 || triggerFire) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-0.5">
                    {layers.length > 1 && (
                      <>
                        <span className="text-slate-400">觸發於</span>
                        <button
                          onClick={() => onFocusBlock?.(layer.block)}
                          onDoubleClick={() => onOpenInspector?.(layer.block)}
                          title={`點擊跳到 ${layer.block} · 雙擊開 inspector`}
                          className="font-mono text-sky-400/80 font-semibold hover:text-sky-300 hover:underline cursor-pointer"
                        >
                          {layer.block}
                        </button>
                      </>
                    )}
                    {triggerFire && (
                      <span className={cn("ml-auto px-1.5 py-px rounded border text-[9px] font-semibold",
                        triggerFire === "yes" ? "bg-green-400/15 text-green-300 border-green-400/30"
                          : triggerFire === "no" ? "bg-white/5 text-slate-400 border-white/10"
                            : "bg-yellow-400/15 text-yellow-300 border-yellow-400/25")}>
                        觸發條件 {triggerFire === "yes" ? "成立" : triggerFire === "no" ? "不成立" : "未知"}
                      </span>
                    )}
                  </div>
                )}
                {layer.children.map((node, ni) => (
                  <LayerNode
                    key={`${node.varName}-${li}-${ni}`}
                    node={node}
                    path={EMPTY_PATH}
                    depth={0}
                    parentBlock={layer.block}
                    ctx={nodeCtx}
                  />
                ))}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
