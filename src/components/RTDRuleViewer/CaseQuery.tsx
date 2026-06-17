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

import { useState, useMemo, useEffect } from "react";
import { AutoComplete, Input } from "antd";
import type {
  RuleData,
  DepGraph,
  ViewNode,
  TrackerMode,
  ImpactResult,
} from "./types";
import { cn } from "../../utils/clsx";
import {
  traceLog,
  expandVar,
  collectLogClosure,
  buildLogReport,
  resolveDefs,
  evalSnippet,
} from "./depGraph";

const EMPTY_PATH: ReadonlySet<string> = new Set();
const EMPTY_SET: Set<string> = new Set();

// ─── Pure Utils ────────────────────────────────────────────────

function parseLogName(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/^\[?\$?([A-Z][A-Z0-9_]*)\$?\]?$/);
  return m ? m[1] : trimmed.toUpperCase();
}

// ─── Layer 顏色（依深度循環） ──────────────────────────────────
const LAYER_STYLES: [border: string, bg: string][] = [
  ["border-blue-500/35", "bg-blue-500/5"],
  ["border-emerald-500/35", "bg-emerald-500/5"],
  ["border-purple-500/35", "bg-purple-500/5"],
  ["border-orange-500/35", "bg-orange-500/5"],
  ["border-pink-500/35", "bg-pink-500/5"],
];
const getLayerStyle = (depth: number): [string, string] =>
  LAYER_STYLES[depth % LAYER_STYLES.length];

// ─── LayerNode（受控：展開狀態來自 expandedBlocks）──────────────
type NodeShared = {
  graph: DepGraph;
  shared: Set<string>;
  runtimeValues: Record<string, string>;
  expandedBlocks: Set<string>;
  hoverBlock: string | null;
  onToggleBlock: (block: string) => void;
  onHoverBlock: (block: string | null) => void;
  onSetRuntimeValue: (varName: string, value: string) => void;
  onFocusBlock?: (blockName: string) => void;
  onOpenInspector?: (blockName: string) => void;
};

function LayerNode({
  node,
  path,
  depth,
  parentBlock,
  ctx,
}: {
  node: ViewNode;
  path: ReadonlySet<string>;
  depth: number;
  parentBlock: string;
  ctx: NodeShared;
}) {
  const {
    graph,
    shared,
    runtimeValues,
    expandedBlocks,
    hoverBlock,
    onToggleBlock,
    onHoverBlock,
    onSetRuntimeValue,
    onFocusBlock,
    onOpenInspector,
  } = ctx;

  const defBlocks = useMemo(
    () => resolveDefs(graph, node.varName, parentBlock).map((d) => d.block),
    [graph, node.varName, parentBlock],
  );
  const expandable =
    (node.status === "normal" || node.status === "shared") &&
    defBlocks.length > 0;
  const expanded = expandable && defBlocks.some((b) => expandedBlocks.has(b));
  const [borderCls, bgCls] = getLayerStyle(depth);

  const groups = useMemo(
    () =>
      expanded
        ? expandVar(
            graph,
            node.varName,
            parentBlock,
            path as Set<string>,
            shared,
          )
        : [],
    [expanded, graph, node.varName, parentBlock, path, shared],
  );
  const childPath = useMemo(
    () => new Set(path).add(node.varName),
    [path, node.varName],
  );

  const runtimeValue = runtimeValues[node.varName];
  const hasRuntime = Object.keys(runtimeValues).length > 0;
  const fire = hasRuntime
    ? evalSnippet(node.edge.snippet, runtimeValues)
    : undefined;
  const hovered = hoverBlock !== null && defBlocks.includes(hoverBlock);
  const snippet = node.edge.snippet;
  const toggle = () => {
    if (expandable && defBlocks[0]) onToggleBlock(defBlocks[0]);
  };

  return (
    <div className="flex flex-col">
      {/* 變數列 */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors",
          borderCls,
          bgCls,
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
            expandable
              ? "cursor-pointer text-white/40 hover:text-white"
              : "cursor-default text-transparent pointer-events-none",
          )}
        >
          {expandable ? (expanded ? "▾" : "▸") : ""}
        </button>

        <span className="text-[9px] font-mono text-white/40 shrink-0 tabular-nums">
          L{depth}
        </span>
        <span className="font-mono font-bold text-sky-300 shrink-0">
          {node.varName}
        </span>

        {snippet && snippet !== node.varName && (
          <span className="text-white/45 text-[10px] font-mono truncate min-w-0">
            {snippet}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {node.status === "root" && (
            <span className="text-[10px] text-slate-400 italic">root</span>
          )}
          {node.status === "cycle" && (
            <span className="text-[10px] text-orange-400/70">↩ 循環</span>
          )}
          {node.status === "shared" && (
            <span className="text-[10px] text-indigo-300/70">⇇ 共用</span>
          )}
          <input
            value={runtimeValue ?? ""}
            onChange={(e) => onSetRuntimeValue(node.varName, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="—"
            title="填已知值（Runtime Log）；空白＝清除"
            className={cn(
              "w-14 text-right font-mono text-[10px] px-1 py-px rounded border outline-none transition-colors",
              runtimeValue === undefined
                ? "bg-white/5 border-white/10 text-slate-300 placeholder:text-white/25"
                : fire === "yes"
                  ? "bg-green-400/15 text-green-300 border-green-400/40"
                  : fire === "no"
                    ? "bg-white/8 text-slate-300 border-white/15"
                    : "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
            )}
          />
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
                <span className="px-1 py-px rounded bg-white/5 text-slate-400 text-[9px]">
                  {g.blockType}
                </span>
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
                <div className="text-[10px] text-slate-400 px-1 italic">
                  無條件變數
                </div>
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
  rules: RuleData[]; // buildLogReport 用
  selectedRule: string | null;
  tracedLog: string | null;
  expandedBlocks: Set<string>;
  runtimeValues: Record<string, string>;
  hoverBlock: string | null;
  mode: TrackerMode; // trace（反查）/ impact（影響）
  onModeChange: (mode: TrackerMode) => void;
  impactVar: string; // impact 模式查詢的變數
  onImpactVarChange: (v: string) => void;
  impactResult: ImpactResult | null; // 由父層 computeImpact 算好
  onTraceLog: (logName: string | null) => void; // 選定 / 清除追蹤的 log
  onToggleBlock: (block: string) => void; // 展開 / 收合某 block 的上游
  onHoverBlock: (block: string | null) => void;
  onRuntimeValuesChange: (next: Record<string, string>) => void; // tracker 樹/chips 設已知值 → 回寫 runtimeValues
  onFocusBlock?: (blockName: string) => void;
  onOpenInspector?: (blockName: string) => void; // 雙擊 block 參照 → 開 inspector
};

export function CaseQuery({
  graph,
  rules,
  selectedRule,
  tracedLog,
  expandedBlocks,
  runtimeValues,
  hoverBlock,
  mode,
  onModeChange,
  impactVar,
  onImpactVarChange,
  impactResult,
  onTraceLog,
  onToggleBlock,
  onHoverBlock,
  onRuntimeValuesChange,
  onFocusBlock,
  onOpenInspector,
}: CaseQueryProps) {
  const [searchInput, setSearchInput] = useState("");
  const [copied, setCopied] = useState(false);
  // Var Impact 就地展開：哪條受影響 log 展開中 + 該樹的本地 block 展開狀態（獨立於 canvas / Trace）
  const [openImpactLog, setOpenImpactLog] = useState<string | null>(null);
  const [impactExpanded, setImpactExpanded] = useState<Set<string>>(new Set());

  // tracedLog 變更時同步 searchInput（含外部觸發，如 canvas 右鍵）
  useEffect(() => {
    setSearchInput(tracedLog ? `[$${tracedLog}$]` : "");
  }, [tracedLog]);

  const allLogNames = useMemo(() => [...graph.logs.keys()].sort(), [graph]);
  const allVarNames = useMemo(() => [...graph.vars.keys()].sort(), [graph]);
  const filteredLogs = useMemo(() => {
    const kw = searchInput
      .replace(/^\[?\$|\$\]?$/g, "")
      .trim()
      .toLowerCase();
    return kw
      ? allLogNames.filter((n) => n.toLowerCase().includes(kw))
      : allLogNames;
  }, [allLogNames, searchInput]);

  // tracedLog → layer-0 + shared
  const closure = useMemo(
    () => (tracedLog ? collectLogClosure(graph, tracedLog) : null),
    [graph, tracedLog],
  );
  const shared = closure?.shared ?? EMPTY_SET;
  const layers = useMemo(
    () => (tracedLog ? (traceLog(graph, tracedLog, shared) ?? []) : []),
    [graph, tracedLog, shared],
  );

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
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        /* clipboard 失敗時靜默 */
      },
    );
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

  // 設 / 清單一個已知變數（樹上 inline 與 chips 共用；空白＝清除該變數）
  const setRuntimeValue = (name: string, value: string) => {
    const next = { ...runtimeValues };
    if (value.trim() === "") delete next[name];
    else next[name] = value;
    onRuntimeValuesChange(next);
  };

  // 已知變數 chips（Tracker 頂部；可單獨清除 / 一鍵清空）
  const knownVarsBar =
    runtimeValueCount > 0 ? (
      <div className="flex flex-wrap items-center gap-1 shrink-0">
        <span className="text-[10px] text-slate-400 shrink-0">
          已知 {runtimeValueCount}
        </span>
        {Object.entries(runtimeValues).map(([k, v]) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-px rounded bg-green-400/10 border border-green-400/25 text-green-300"
          >
            {k}={v}
            <button
              onClick={() => setRuntimeValue(k, "")}
              className="text-green-300/60 hover:text-green-200 cursor-pointer bg-transparent leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <button
          onClick={() => onRuntimeValuesChange({})}
          className="text-[10px] text-slate-400 hover:text-white cursor-pointer bg-transparent"
        >
          清空
        </button>
      </div>
    ) : null;

  const nodeCtx: NodeShared = {
    graph,
    shared,
    runtimeValues,
    expandedBlocks,
    hoverBlock,
    onToggleBlock,
    onHoverBlock,
    onSetRuntimeValue: setRuntimeValue,
    onFocusBlock,
    onOpenInspector,
  };

  // 模式（trace / impact）由 RuleViewer 頂層 tab 切換（Viewer | Tracker | Var Impact）；
  // CaseQuery 內不再有 modeTabs，onModeChange 僅供內部「↗ Trace」跳轉用。

  // ── Impact 模式（變數 → 受影響反藍）─ spec ① ────────────────
  if (mode === "impact") {
    const typed = impactVar.trim();
    const kw = typed.toUpperCase();
    const suggestions =
      kw && !graph.vars.has(typed)
        ? allVarNames.filter((v) => v.toUpperCase().includes(kw)).slice(0, 30)
        : [];
    const res = impactResult;
    // 就地展開：openImpactLog 的依賴樹（本地 block 展開狀態，獨立於 canvas / Trace）
    const impactShared = openImpactLog
      ? (collectLogClosure(graph, openImpactLog).shared ?? EMPTY_SET)
      : EMPTY_SET;
    const impactLayers = openImpactLog
      ? (traceLog(graph, openImpactLog, impactShared) ?? [])
      : [];
    const impactNodeCtx: NodeShared = {
      graph,
      shared: impactShared,
      runtimeValues,
      expandedBlocks: impactExpanded,
      hoverBlock,
      onToggleBlock: (block) =>
        setImpactExpanded((prev) => {
          const n = new Set(prev);
          if (n.has(block)) n.delete(block);
          else n.add(block);
          return n;
        }),
      onHoverBlock,
      onSetRuntimeValue: setRuntimeValue,
      onFocusBlock,
      onOpenInspector,
    };
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <AutoComplete
          className="shrink-0"
          style={{ width: "100%" }}
          value={impactVar}
          options={suggestions.map((v) => ({ value: v }))}
          filterOption={false}
          allowClear
          placeholder="輸入變數名（DB 欄位 / 中間變數）"
          onChange={(v) => onImpactVarChange(v ?? "")}
        />
        {knownVarsBar}

        <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-1.5">
          {!typed && (
            <p className="text-slate-400 text-xs">
              輸入變數，查出它影響哪些反藍 Log（沿依賴鏈反向）。
            </p>
          )}
          {typed && res && !res.found && (
            <p className="text-slate-400 text-xs">
              變數 <span className="font-mono text-white/70">{typed}</span>{" "}
              不在此 Rule 的依賴圖中。
            </p>
          )}
          {res?.found && res.logs.length === 0 && (
            <p className="text-slate-400 text-xs">
              此變數無下游反藍 Log（不影響任何 [$LOG$]）。
            </p>
          )}
          {res?.found && res.logs.length > 0 && (
            <>
              <div className="shrink-0 text-slate-400 text-[10px] tabular-nums text-right">
                {res.logs.length} 個受影響反藍（點開看依賴）
              </div>
              {res.logs.map((l) => {
                const open = openImpactLog === l.logName;
                return (
                  <div
                    key={l.logName}
                    className="rounded-lg border border-white/10 bg-white/4 overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-2">
                      <button
                        onClick={() => {
                          setOpenImpactLog(open ? null : l.logName);
                          setImpactExpanded(new Set());
                        }}
                        className="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer bg-transparent"
                      >
                        <span className="text-[9px] text-white/40 w-3 shrink-0 leading-none">
                          {open ? "▾" : "▸"}
                        </span>
                        <AntiBlueBadge name={l.logName} />
                        <span className="font-mono text-[10px] text-white/45 truncate min-w-0">
                          {l.path.vars.join(" → ")}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          onModeChange("trace");
                          onTraceLog(l.logName);
                        }}
                        title="改在 Trace 模式開啟"
                        className="shrink-0 text-[10px] text-slate-400 hover:text-sky-300 cursor-pointer bg-transparent"
                      >
                        ↗ Trace
                      </button>
                    </div>
                    {open && (
                      <div className="px-2.5 pb-2 pt-2 border-t border-white/8 flex flex-col gap-2">
                        {impactLayers.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic px-1">
                            此 LOG 的觸發條件無可追蹤變數
                          </div>
                        ) : (
                          impactLayers.map((layer, li) => (
                            <div
                              key={`${layer.block}-${li}`}
                              className="flex flex-col gap-1"
                            >
                              {impactLayers.length > 1 && (
                                <div className="text-[10px] text-slate-400 px-0.5">
                                  觸發於{" "}
                                  <button
                                    onClick={() => onFocusBlock?.(layer.block)}
                                    onDoubleClick={() =>
                                      onOpenInspector?.(layer.block)
                                    }
                                    className="font-mono text-sky-400/80 hover:text-sky-300 hover:underline cursor-pointer bg-transparent"
                                  >
                                    {layer.block}
                                  </button>
                                </div>
                              )}
                              {layer.children.map((node, ni) => (
                                <LayerNode
                                  key={`${node.varName}-${li}-${ni}`}
                                  node={node}
                                  path={EMPTY_PATH}
                                  depth={0}
                                  parentBlock={layer.block}
                                  ctx={impactNodeCtx}
                                />
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Search Bar（antd Input.Search，外觀對齊 Viewer；下拉為 log autocomplete）──────────
  const searchBar = (
    <AutoComplete
      className="shrink-0"
      style={{ width: "100%" }}
      value={searchInput}
      options={filteredLogs.map((name) => ({
        value: `[$${name}$]`,
        label: (
          <span className="font-mono">
            <span className="text-red-400/60">[$</span>
            <span className="text-red-500 font-bold">{name}</span>
            <span className="text-red-400/60">$]</span>
          </span>
        ),
      }))}
      filterOption={false}
      defaultActiveFirstOption={false}
      onChange={(v) => setSearchInput(v ?? "")}
      onSelect={(v) => handleTrace(parseLogName(v))}
    >
      <Input
        placeholder="[$LOG_NAME$]（Enter 追蹤）"
        allowClear
        onPressEnter={() => handleTrace()}
      />
    </AutoComplete>
  );

  // ── Idle ────────────────────────────────────────────────────
  if (!tracedLog) {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {knownVarsBar}
        {searchBar}
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
      {/* 操作按鈕（複製 / 取消追蹤）；模式切換已移至頂層 tab */}
      <div className="flex items-center gap-0.5 shrink-0">
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="複製此反藍的完整追蹤資訊（觸發點 + 依賴樹 + 相關 Block 定義 + roots），可貼給 AI 分析"
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors border",
              copied
                ? "bg-green-500/20 text-green-300 border-green-500/40"
                : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white",
            )}
          >
            {copied ? "✓ 已複製" : "複製邏輯結構"}
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-red-400 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 cursor-pointer transition-colors"
            title="取消追蹤，回到選擇 Log（canvas 高亮一併清除）"
          >
            ✕ 取消追蹤
          </button>
        </div>
      </div>

      {knownVarsBar}
      {searchBar}

      {/* Layer Tree */}
      <div className="flex-1 min-h-0 overflow-auto">
        {totalL0 === 0 ? (
          <div className="text-slate-400 text-xs text-center py-6 italic">
            此 LOG 的觸發條件無可追蹤變數
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {layers.map((layer, li) => {
              const triggerFire =
                runtimeValueCount > 0
                  ? evalSnippet(layer.clauseCond, runtimeValues)
                  : null;
              return (
                <div
                  key={`${layer.block}-${li}`}
                  className="flex flex-col gap-1"
                >
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
                        <span
                          className={cn(
                            "ml-auto px-1.5 py-px rounded border text-[9px] font-semibold",
                            triggerFire === "yes"
                              ? "bg-green-400/15 text-green-300 border-green-400/30"
                              : triggerFire === "no"
                                ? "bg-white/5 text-slate-400 border-white/10"
                                : "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
                          )}
                        >
                          觸發條件{" "}
                          {triggerFire === "yes"
                            ? "成立"
                            : triggerFire === "no"
                              ? "不成立"
                              : "未知"}
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
