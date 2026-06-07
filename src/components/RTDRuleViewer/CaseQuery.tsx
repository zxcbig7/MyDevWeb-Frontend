// ============================================================
// CaseQuery.tsx  (Tracker mode)
//
// 反藍 Log 溯源：輸入 [$LOG_NAME$] → Layer 樹狀追蹤
//   Layer 0  = 直接觸發條件的所有變數（AND/OR 為兄弟節點）
//   Layer N  = 定義 Layer N-1 變數的 Block 條件變數
//   Runtime Log = 可選 overlay，顯示各變數實際值
//
// 變數來源判斷：找 COLUMN1 = varName 的 Block
// 循環偵測：(varName, blockName) pair 在同條路徑已出現 → 停止
// ============================================================

import { useState, useMemo, useRef, useEffect } from "react";
import type { RuleData } from "./types";
import { cn } from "../../utils/clsx";

// ─── Tree Types ────────────────────────────────────────────────

type TreeNode = {
  varName: string;
  condition: string;        // 包含此變數的子條件，如 "HOLD_COUNT > 10"
  layer: number;
  sourceBlocks: SourceBlockNode[];
  isRoot: boolean;          // 找不到來源 Block → DB / 外部輸入
  isCycle: boolean;         // 同條路徑已出現此 (varName, blockName)
};

type SourceBlockNode = {
  blockName: string;
  blockType: string;
  children: TreeNode[];
};

// ─── Tracker Mode ─────────────────────────────────────────────

type TrackerMode =
  | { tag: "idle" }
  | { tag: "log"; logName: string; treeNodes: TreeNode[] };

// ─── Pure Utils ────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

const LOG_KEYWORDS = new Set([
  "IF", "THEN", "ELSE", "AND", "OR", "NOT", "NULL", "TRUE", "FALSE",
  "IN", "IS", "SYSDATE", "TODAY",
]);

function sortBlocks(rules: RuleData[]): RuleData[] {
  const nameToRule = new Map(rules.map((r) => [r.BLOCK_NAME, r]));
  const sorted: RuleData[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(rule: RuleData) {
    if (visited.has(rule.BLOCK_NAME) || visiting.has(rule.BLOCK_NAME)) return;
    visiting.add(rule.BLOCK_NAME);
    for (const pre of rule.PREBLOCK ?? []) {
      const parent = nameToRule.get(pre);
      if (parent) visit(parent);
    }
    visiting.delete(rule.BLOCK_NAME);
    visited.add(rule.BLOCK_NAME);
    sorted.push(rule);
  }

  for (const rule of rules) visit(rule);
  return sorted;
}

function findLogBlocks(logName: string, rules: RuleData[]): RuleData[] {
  const re = new RegExp(`\\[?\\$${escapeRegex(logName)}\\$\\]?`);
  return rules.filter((r) => (r.VALUES ?? []).some((v) => v.VALUE && re.test(v.VALUE)));
}

// ─── Tree Building ─────────────────────────────────────────────

/**
 * 從觸發 [$LOG$] 的 IF 分支條件中，萃取所有條件變數（支援 AND/OR 多變數）
 * 例：IF HOLD_COUNT > 10 AND WIP_QTY > 5 THEN [$LOG$]
 *   → [{ varName: "HOLD_COUNT", condition: "HOLD_COUNT > 10" },
 *      { varName: "WIP_QTY",    condition: "WIP_QTY > 5"    }]
 */
function extractLayerZeroVars(
  logName: string,
  blocks: RuleData[],
): { varName: string; condition: string }[] {
  const logPattern = new RegExp(`\\[\\$${escapeRegex(logName)}\\$\\]`);
  // lazy match：IF <全條件> THEN <result>，條件本身不含 THEN
  const branchRe = /\bIF\s+(.*?)\s+THEN\s+(\S+)/g;
  const vars = new Map<string, string>();

  for (const block of blocks) {
    for (const v of block.VALUES ?? []) {
      if (!v.VALUE) continue;
      branchRe.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = branchRe.exec(v.VALUE)) !== null) {
        if (!logPattern.test(m[2])) continue;
        const condPart = m[1];
        // 找所有 FIELD op val 模式（大寫欄位名）
        const fieldRe = /\b([A-Z][A-Z0-9_]{1,})\s*(?:==|!=|>=|<=|>|<)/g;
        let fm: RegExpExecArray | null;
        while ((fm = fieldRe.exec(condPart)) !== null) {
          const field = fm[1];
          if (LOG_KEYWORDS.has(field) || vars.has(field)) continue;
          // 取此欄位的子條件，如 "HOLD_COUNT > 10"
          const subMatch = condPart.match(
            new RegExp(`\\b${escapeRegex(field)}\\s*(?:==|!=|>=|<=|>|<)\\s*(?:"[^"]*"|\\d+)`)
          );
          vars.set(field, subMatch ? subMatch[0] : field);
        }
      }
    }
  }

  return [...vars.entries()].map(([varName, condition]) => ({ varName, condition }));
}

/**
 * 從 Block 所有 VALUE 的 IF 條件中，萃取所有條件變數
 * 只看 IF...THEN 之前的條件部分，排除 LOG 關鍵字
 */
function extractBlockCondVars(block: RuleData): { varName: string; condition: string }[] {
  const vars = new Map<string, string>();
  const condRe = /\bIF\s+(.*?)\s+THEN/g;
  const fieldRe = /\b([A-Z][A-Z0-9_]{1,})\s*(==|!=|>=|<=|>|<)\s*(?:"[^"]*"|\d+)/g;

  for (const v of block.VALUES ?? []) {
    if (!v.VALUE) continue;
    condRe.lastIndex = 0;
    let cm: RegExpExecArray | null;
    while ((cm = condRe.exec(v.VALUE)) !== null) {
      fieldRe.lastIndex = 0;
      let fm: RegExpExecArray | null;
      while ((fm = fieldRe.exec(cm[1])) !== null) {
        const field = fm[1];
        if (!LOG_KEYWORDS.has(field) && !vars.has(field)) vars.set(field, fm[0]);
      }
    }
  }

  return [...vars.entries()].map(([varName, condition]) => ({ varName, condition }));
}

/** 找 COLUMN1 = varName 的所有 Block（變數來源） */
function findSourceBlocks(varName: string, rules: RuleData[]): RuleData[] {
  return rules.filter((r) => (r.VALUES ?? []).some((v) => v.COLUMN1 === varName));
}

/** 遞迴建構單一變數的 TreeNode（BFS-friendly，eager 建構） */
function buildTreeNode(
  varName: string,
  condition: string,
  layer: number,
  rules: RuleData[],
  visited: Set<string>,
): TreeNode {
  const sourceRuleBlocks = findSourceBlocks(varName, rules);

  if (sourceRuleBlocks.length === 0) {
    return { varName, condition, layer, sourceBlocks: [], isRoot: true, isCycle: false };
  }

  const sourceBlocks: SourceBlockNode[] = sourceRuleBlocks.map((block) => {
    const visitKey = `${varName}|${block.BLOCK_NAME}`;
    if (visited.has(visitKey)) {
      return {
        blockName: block.BLOCK_NAME,
        blockType: block.BLOCK_TYPE,
        children: [
          { varName, condition, layer: layer + 1, sourceBlocks: [], isRoot: false, isCycle: true },
        ],
      };
    }

    const newVisited = new Set(visited);
    newVisited.add(visitKey);

    const condVars = extractBlockCondVars(block);
    const children = condVars.map(({ varName: cv, condition: cc }) =>
      buildTreeNode(cv, cc, layer + 1, rules, newVisited)
    );

    return { blockName: block.BLOCK_NAME, blockType: block.BLOCK_TYPE, children };
  });

  return { varName, condition, layer, sourceBlocks, isRoot: false, isCycle: false };
}

/** 建立完整 Layer 樹 */
function buildLayerTree(logName: string, logBlocks: RuleData[], rules: RuleData[]): TreeNode[] {
  const layer0Vars = extractLayerZeroVars(logName, logBlocks);
  return layer0Vars.map(({ varName, condition }) =>
    buildTreeNode(varName, condition, 0, rules, new Set())
  );
}

// ─── Layer 顏色（依層數循環） ──────────────────────────────────

const LAYER_STYLES: [border: string, bg: string][] = [
  ["border-blue-500/35",    "bg-blue-500/5"],
  ["border-emerald-500/35", "bg-emerald-500/5"],
  ["border-purple-500/35",  "bg-purple-500/5"],
  ["border-orange-500/35",  "bg-orange-500/5"],
  ["border-pink-500/35",    "bg-pink-500/5"],
];

function getLayerStyle(layer: number): [string, string] {
  return LAYER_STYLES[layer % LAYER_STYLES.length];
}

// ─── LayerNode ─────────────────────────────────────────────────

function LayerNode({
  node,
  runtimeValues,
  defaultExpanded,
}: {
  node: TreeNode;
  runtimeValues: Record<string, string>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const canExpand = !node.isRoot && !node.isCycle && node.sourceBlocks.length > 0;
  const runtimeValue = runtimeValues[node.varName];
  const [borderCls, bgCls] = getLayerStyle(node.layer);

  return (
    <div className="flex flex-col">
      {/* 變數列 */}
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-xs", borderCls, bgCls)}>
        {/* 展開按鈕 */}
        <button
          onClick={() => canExpand && setExpanded((e) => !e)}
          className={cn(
            "w-3 shrink-0 text-[9px] text-center transition-colors leading-none",
            canExpand
              ? "cursor-pointer text-white/40 hover:text-white"
              : "cursor-default text-transparent pointer-events-none",
          )}
        >
          {canExpand ? (expanded ? "▼" : "▶") : ""}
        </button>

        {/* Layer badge */}
        <span className="text-[9px] font-mono text-white/20 shrink-0 tabular-nums">
          L{node.layer}
        </span>

        {/* 變數名稱 */}
        <span className="font-mono font-bold text-sky-300 shrink-0">{node.varName}</span>

        {/* 子條件表達式 */}
        {node.condition && node.condition !== node.varName && (
          <span className="text-white/25 text-[10px] font-mono truncate min-w-0">
            {node.condition}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {runtimeValue !== undefined && (
            <span className="font-mono text-[10px] px-1.5 py-px rounded bg-yellow-400/15 text-yellow-300 border border-yellow-400/25">
              = {runtimeValue}
            </span>
          )}
          {node.isRoot && (
            <span className="text-[10px] text-slate-500 italic">root</span>
          )}
          {node.isCycle && (
            <span className="text-[10px] text-orange-400/70">↩ 循環</span>
          )}
        </div>
      </div>

      {/* 展開後：來源 Block + 子節點 */}
      {expanded && canExpand && (
        <div className="ml-3.5 border-l border-white/8 pl-2.5 mt-0.5 flex flex-col gap-1.5">
          {node.sourceBlocks.map((sb, si) => (
            <div key={`${sb.blockName}-${si}`} className="flex flex-col gap-0.5">
              {/* 來源 Block 標籤 */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-0.5 py-0.5">
                <span className="text-slate-600">來自</span>
                <span className="font-mono text-slate-400 font-semibold">{sb.blockName}</span>
                <span className="px-1 py-px rounded bg-white/5 text-slate-600 text-[9px]">
                  {sb.blockType}
                </span>
              </div>

              {/* 子變數節點 */}
              {sb.children.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {sb.children.map((child, ci) => (
                    <LayerNode
                      key={`${child.varName}-${si}-${ci}`}
                      node={child}
                      runtimeValues={runtimeValues}
                      defaultExpanded={false}
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

// ─── LayerTree ─────────────────────────────────────────────────

function LayerTree({
  nodes,
  runtimeValues,
}: {
  nodes: TreeNode[];
  runtimeValues: Record<string, string>;
}) {
  if (nodes.length === 0) {
    return (
      <div className="text-slate-500 text-xs text-center py-6 italic">
        此 LOG 的觸發條件無可追蹤變數
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {nodes.map((node, i) => (
        <LayerNode
          key={`${node.varName}-${i}`}
          node={node}
          runtimeValues={runtimeValues}
          defaultExpanded={true}
        />
      ))}
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
  onHighlight?: (logBlockIds: string[], varBlockIds: string[], logName?: string | null) => void;
};

export function CaseQuery({ rules, selectedRule, onHighlight }: CaseQueryProps) {
  const [searchInput, setSearchInput]     = useState("");
  const [dropOpen, setDropOpen]           = useState(false);
  const [logHighlightIdx, setLogHighlightIdx] = useState(-1);
  const [mode, setMode]                   = useState<TrackerMode>({ tag: "idle" });
  const [runtimeLog, setRuntimeLog]       = useState("");
  const [runtimeValues, setRuntimeValues] = useState<Record<string, string>>({});
  const [logInputOpen, setLogInputOpen]   = useState(false);
  const searchWrapRef                     = useRef<HTMLDivElement>(null);
  const logListRef                        = useRef<HTMLUListElement>(null);

  const sortedRules = useMemo(() => sortBlocks(rules), [rules]);

  // 從所有 VALUES 萃取 Log 名稱清單（下拉選單用）
  const allLogNames = useMemo(() => {
    const LOG_RE = /\[?\$([A-Z][A-Z0-9_]+)\$\]?/g;
    const names  = new Set<string>();
    for (const r of rules) {
      for (const v of r.VALUES ?? []) {
        if (!v.VALUE) continue;
        let m: RegExpExecArray | null;
        LOG_RE.lastIndex = 0;
        while ((m = LOG_RE.exec(v.VALUE)) !== null) names.add(m[1]);
      }
    }
    return [...names].sort();
  }, [rules]);

  const filteredLogs = useMemo(() => {
    const kw = searchInput.replace(/^\[?\$|\$\]?$/g, "").trim().toLowerCase();
    if (!kw) return allLogNames;
    return allLogNames.filter((n) => n.toLowerCase().includes(kw));
  }, [allLogNames, searchInput]);

  // 點外部關閉下拉
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setLogHighlightIdx(-1); }, [filteredLogs]);

  useEffect(() => {
    setRuntimeValues(parseRuntimeLog(runtimeLog));
  }, [runtimeLog]);

  useEffect(() => {
    if (logHighlightIdx < 0 || !logListRef.current) return;
    const items = logListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]");
    items[logHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [logHighlightIdx]);

  function handleSearch(overrideName?: string) {
    const logName   = overrideName ?? parseLogName(searchInput);
    if (!logName || sortedRules.length === 0) return;
    const logBlocks = findLogBlocks(logName, sortedRules);
    const treeNodes = buildLayerTree(logName, logBlocks, sortedRules);
    setMode({ tag: "log", logName, treeNodes });
    onHighlight?.(logBlocks.map((b) => b.BLOCK_NAME), [], logName);
  }

  function handleBack() {
    setMode({ tag: "idle" });
    setSearchInput("");
    onHighlight?.([], [], null);
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
          onChange={(e) => {
            setSearchInput(e.target.value);
            setDropOpen(true);
            setLogHighlightIdx(-1);
          }}
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
                  i === logHighlightIdx
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
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
        <span className="ml-auto text-slate-600 text-xs leading-none">
          {logInputOpen ? "▼" : "▶"}
        </span>
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
  const { logName, treeNodes } = mode;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      {searchBar}
      {logInputSection}

      {/* Breadcrumb */}
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
        <span className="ml-auto text-slate-600 text-xs tabular-nums">
          {treeNodes.length > 0
            ? `L0 · ${treeNodes.length} 變數`
            : "無條件變數"}
        </span>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 min-h-0 overflow-auto">
        <LayerTree nodes={treeNodes} runtimeValues={runtimeValues} />
      </div>
    </div>
  );
}
