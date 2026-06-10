// ============================================================
// CaseQuery.tsx  (Tracker mode)
//
// 反藍 Log 溯源：輸入 [$LOG_NAME$] → 從依賴圖（DAG）lazy 展開成多元樹
//   - 整條 rule 用 buildDepGraph 建一次圖（useMemo），所有 log 共用
//   - 第一層 = traceLog（觸發條件變數）；點開才 expandVar 下一層
//   - 狀態：root（DB 來源）/ cycle（成環）/ shared（多處引用）
//   - 一鍵複製：buildLogReport 產出 AI 分析用的完整 context pack
//   - Runtime Log = 可選 overlay，顯示各變數實際值
// 唯一真相是 depGraph.ts 的 DAG；本檔只負責即時投影與互動。
// spec: specs/2026-06-07-tracker-dep-graph.md
// ============================================================

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { RuleData, DepGraph, ViewNode, TrackerEdge } from "./types";
import { cn } from "../../utils/clsx";
import { buildDepGraph, traceLog, expandVar, collectLogClosure, buildLogReport, resolveDefs } from "./depGraph";

type RegisterEdges = (id: string, edges: TrackerEdge[] | null) => void;

// ─── Tracker Mode ─────────────────────────────────────────────

type Layer0 = { block: string; clauseCond: string; children: ViewNode[] };

type TrackerMode =
  | { tag: "idle" }
  | { tag: "log"; logName: string; layers: Layer0[]; shared: Set<string> };

const EMPTY_PATH: ReadonlySet<string> = new Set();

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

function getLayerStyle(depth: number): [string, string] {
  return LAYER_STYLES[depth % LAYER_STYLES.length];
}

// ─── LayerNode（lazy 展開）────────────────────────────────────

function LayerNode({
  node,
  graph,
  path,
  shared,
  runtimeValues,
  depth,
  defaultExpanded,
  onFocusBlock,
  nodeId,
  parentBlock,
  registerEdges,
}: {
  node: ViewNode;
  graph: DepGraph;
  path: ReadonlySet<string>;
  shared: Set<string>;
  runtimeValues: Record<string, string>;
  depth: number;
  defaultExpanded?: boolean;
  onFocusBlock?: (blockName: string) => void;
  nodeId: string;                       // 樹中唯一位置 id（canvas 連線註冊用）
  parentBlock: string;                  // 引用此變數的上游 block（連線起點）
  registerEdges: RegisterEdges;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const expandable = node.status === "normal" || node.status === "shared";
  const runtimeValue = runtimeValues[node.varName];
  const [borderCls, bgCls] = getLayerStyle(depth);

  // 點開才即時展開下一層（來源限定 parentBlock 的 PREBLOCK 上游）
  const groups = useMemo(
    () => (expanded && expandable ? expandVar(graph, node.varName, parentBlock, path as Set<string>, shared) : []),
    [expanded, expandable, graph, node.varName, parentBlock, path, shared],
  );
  const childPath = useMemo(() => new Set(path).add(node.varName), [path, node.varName]);
  const snippet = node.edge.snippet;

  // 此節點對應的 canvas 連線：parentBlock → 定義此變數的每個上游 block（depth = 上色層次）
  const myEdges = useMemo<TrackerEdge[]>(() => {
    if (!expandable) return [];
    return resolveDefs(graph, node.varName, parentBlock).map((d) => ({ from: parentBlock, to: d.block, depth }));
  }, [expandable, graph, node.varName, parentBlock, depth]);

  // 展開時註冊連線、收合 / unmount 時移除 → canvas 只畫「右側已展開」的依賴鏈
  useEffect(() => {
    if (!(expanded && expandable)) return;
    registerEdges(nodeId, myEdges);
    return () => registerEdges(nodeId, null);
  }, [expanded, expandable, nodeId, myEdges, registerEdges]);

  return (
    <div className="flex flex-col">
      {/* 變數列 */}
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-xs", borderCls, bgCls)}>
        <button
          onClick={() => expandable && setExpanded((e) => !e)}
          className={cn(
            "w-3 shrink-0 text-[9px] text-center transition-colors leading-none",
            expandable
              ? "cursor-pointer text-white/40 hover:text-white"
              : "cursor-default text-transparent pointer-events-none",
          )}
        >
          {expandable ? (expanded ? "▼" : "▶") : ""}
        </button>

        <span className="text-[9px] font-mono text-white/20 shrink-0 tabular-nums">L{depth}</span>
        <span className="font-mono font-bold text-sky-300 shrink-0">{node.varName}</span>

        {snippet && snippet !== node.varName && (
          <span className="text-white/25 text-[10px] font-mono truncate min-w-0">{snippet}</span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {runtimeValue !== undefined && (
            <span className="font-mono text-[10px] px-1.5 py-px rounded bg-yellow-400/15 text-yellow-300 border border-yellow-400/25">
              = {runtimeValue}
            </span>
          )}
          {node.status === "root" && <span className="text-[10px] text-slate-500 italic">root</span>}
          {node.status === "cycle" && <span className="text-[10px] text-orange-400/70">↩ 循環</span>}
          {node.status === "shared" && <span className="text-[10px] text-indigo-300/70">⇇ 共用</span>}
        </div>
      </div>

      {/* 展開後：來源 Block + 子節點 */}
      {expanded && expandable && (
        <div className="ml-3.5 border-l border-white/8 pl-2.5 mt-0.5 flex flex-col gap-1.5">
          {groups.map((g, gi) => (
            <div key={`${g.block}-${gi}`} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-0.5 py-0.5">
                <span className="text-slate-600">來自</span>
                <button
                  onClick={() => onFocusBlock?.(g.block)}
                  title={`跳到 ${g.block}`}
                  className="font-mono text-sky-400/80 font-semibold hover:text-sky-300 hover:underline cursor-pointer"
                >
                  {g.block}
                </button>
                <span className="px-1 py-px rounded bg-white/5 text-slate-600 text-[9px]">{g.blockType}</span>
              </div>
              {g.children.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {g.children.map((child, ci) => (
                    <LayerNode
                      key={`${child.varName}-${gi}-${ci}`}
                      node={child}
                      graph={graph}
                      path={childPath}
                      shared={shared}
                      runtimeValues={runtimeValues}
                      depth={depth + 1}
                      onFocusBlock={onFocusBlock}
                      nodeId={`${nodeId}/${gi}-${ci}`}
                      parentBlock={g.block}
                      registerEdges={registerEdges}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-600 px-1 italic">無條件變數</div>
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
  rules: RuleData[];
  selectedRule: string | null;
  onHighlight?: (logBlockIds: string[], logName?: string | null) => void;   // log 產出 block（橘框錨點）
  onFocusBlock?: (blockName: string) => void;        // 點「來自 / 觸發於 <block>」→ canvas 跳到該 block
  onEdgesChange?: (edges: TrackerEdge[]) => void;     // 右側展開的依賴鏈 → canvas 連線
};

export function CaseQuery({ rules, selectedRule, onHighlight, onFocusBlock, onEdgesChange }: CaseQueryProps) {
  const [searchInput, setSearchInput]         = useState("");
  const [dropOpen, setDropOpen]               = useState(false);
  const [logHighlightIdx, setLogHighlightIdx] = useState(-1);
  const [mode, setMode]                       = useState<TrackerMode>({ tag: "idle" });
  const [runtimeLog, setRuntimeLog]           = useState("");
  const [runtimeValues, setRuntimeValues]     = useState<Record<string, string>>({});
  const [logInputOpen, setLogInputOpen]       = useState(false);
  const [copied, setCopied]                   = useState(false);
  const searchWrapRef                         = useRef<HTMLDivElement>(null);
  const logListRef                            = useRef<HTMLUListElement>(null);

  // 整條 rule 建一次依賴圖（唯一真相）
  const graph = useMemo(() => buildDepGraph(rules), [rules]);

  // canvas 連線：各 LayerNode 展開時註冊自己那段邊，收合 / unmount 移除；彙整去重（同 from→to 取最小 depth）
  const edgeRegistry = useRef(new Map<string, TrackerEdge[]>());
  const [visibleEdges, setVisibleEdges] = useState<TrackerEdge[]>([]);

  const registerEdges = useCallback<RegisterEdges>((id, edges) => {
    const reg = edgeRegistry.current;
    if (edges === null) reg.delete(id);
    else reg.set(id, edges);
    const dedup = new Map<string, TrackerEdge>();
    for (const list of reg.values())
      for (const e of list) {
        const k = `${e.from}|${e.to}`;
        const ex = dedup.get(k);
        if (!ex || e.depth < ex.depth) dedup.set(k, e);
      }
    setVisibleEdges([...dedup.values()]);
  }, []);

  useEffect(() => { onEdgesChange?.(visibleEdges); }, [visibleEdges, onEdgesChange]);

  // 所有 log 名稱（下拉選單）
  const allLogNames = useMemo(() => [...graph.logs.keys()].sort(), [graph]);

  const filteredLogs = useMemo(() => {
    const kw = searchInput.replace(/^\[?\$|\$\]?$/g, "").trim().toLowerCase();
    if (!kw) return allLogNames;
    return allLogNames.filter((n) => n.toLowerCase().includes(kw));
  }, [allLogNames, searchInput]);

  // 點外部關閉下拉
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setLogHighlightIdx(-1); }, [filteredLogs]);
  useEffect(() => { setRuntimeValues(parseRuntimeLog(runtimeLog)); }, [runtimeLog]);

  useEffect(() => {
    if (logHighlightIdx < 0 || !logListRef.current) return;
    const items = logListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]");
    items[logHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [logHighlightIdx]);

  function handleSearch(overrideName?: string) {
    const logName = overrideName ?? parseLogName(searchInput);
    if (!logName) return;
    const entry = graph.logs.get(logName);
    edgeRegistry.current.clear();
    setVisibleEdges([]);
    if (!entry) { setMode({ tag: "idle" }); onHighlight?.([], null); return; }

    const closure = collectLogClosure(graph, logName);
    const layers = traceLog(graph, logName, closure.shared) ?? [];
    setMode({ tag: "log", logName, layers, shared: closure.shared });

    // 橘框 = log 產出 block（靜態錨點）；紫框（var 來源）改由展開的依賴鏈推導，見 onEdgesChange
    const triggerBlocks = [...new Set(entry.triggers.map((t) => t.block))];
    onHighlight?.(triggerBlocks, logName);
  }

  function handleBack() {
    setMode({ tag: "idle" });
    setSearchInput("");
    edgeRegistry.current.clear();
    setVisibleEdges([]);
    onHighlight?.([], null);
  }

  function handleCopy() {
    if (mode.tag !== "log") return;
    const report = buildLogReport(graph, rules, mode.logName, runtimeValues);
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
        handleSearch(name);
      } else {
        setDropOpen(false);
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setDropOpen(false);
      setLogHighlightIdx(-1);
    }
  }

  if (!selectedRule || rules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs text-center">
        <span className="text-2xl opacity-20">⚙</span>
        請先選擇 Rule
      </div>
    );
  }

  const runtimeValueCount = Object.keys(runtimeValues).length;

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
              rounded border border-white/20 bg-slate-900 shadow-xl z-2000 list-none p-0 m-0"
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
                  handleSearch(name);
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
        onClick={() => { setDropOpen(false); handleSearch(); }}
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
            {runtimeValueCount} vars
          </span>
        )}
        <span className="ml-auto text-slate-600 text-xs leading-none">{logInputOpen ? "▼" : "▶"}</span>
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
  if (mode.tag === "idle") {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {searchBar}
        {logInputSection}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <span className="text-xl opacity-20">[$]</span>
          輸入反藍 Log 名稱
          <br />
          追蹤觸發條件與變數來源
        </div>
      </div>
    );
  }

  // ── Log Mode ────────────────────────────────────────────────
  const { logName, layers, shared } = mode;
  const totalL0 = layers.reduce((n, l) => n + l.children.length, 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
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
        <span className="text-slate-600 text-xs">/</span>
        <AntiBlueBadge name={logName} active />

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
          {copied ? "✓ 已複製" : "⧉ 複製給 AI"}
        </button>
      </div>

      <div className="shrink-0 text-slate-600 text-[10px] tabular-nums text-right">
        {totalL0 > 0 ? `L0 · ${totalL0} 變數` : "無條件變數"}
      </div>

      {/* Layer Tree */}
      <div className="flex-1 min-h-0 overflow-auto">
        {totalL0 === 0 ? (
          <div className="text-slate-500 text-xs text-center py-6 italic">此 LOG 的觸發條件無可追蹤變數</div>
        ) : (
          <div className="flex flex-col gap-2">
            {layers.map((layer, li) => (
              <div key={`${layer.block}-${li}`} className="flex flex-col gap-1">
                {layers.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-0.5">
                    <span className="text-slate-600">觸發於</span>
                    <button
                      onClick={() => onFocusBlock?.(layer.block)}
                      title={`跳到 ${layer.block}`}
                      className="font-mono text-sky-400/80 font-semibold hover:text-sky-300 hover:underline cursor-pointer"
                    >
                      {layer.block}
                    </button>
                  </div>
                )}
                {layer.children.map((node, ni) => (
                  <LayerNode
                    key={`${node.varName}-${li}-${ni}`}
                    node={node}
                    graph={graph}
                    path={EMPTY_PATH}
                    shared={shared}
                    runtimeValues={runtimeValues}
                    depth={0}
                    defaultExpanded
                    onFocusBlock={onFocusBlock}
                    nodeId={`L${li}-${ni}`}
                    parentBlock={layer.block}
                    registerEdges={registerEdges}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
