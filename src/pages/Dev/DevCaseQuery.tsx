// DevCaseQuery.tsx — CaseQuery (Tracker) 獨立測試頁（受控 host）
import { useState, useMemo, useCallback, useEffect } from "react";
import { CaseQuery } from "../../components/RTDRuleViewer/CaseQuery";
import { MOCK_RULE_DATA } from "../../components/RTDRuleViewer/devMock";
import { buildDepGraph, computeTrace, computeImpact } from "../../components/RTDRuleViewer/depGraph";
import type { TrackerMode } from "../../components/RTDRuleViewer/types";
import { R } from "../../lib/radius";

const RULE_KEYS = Object.keys(MOCK_RULE_DATA);

export default function DevCaseQuery() {
  const [ruleKey, setRuleKey] = useState(RULE_KEYS[0]);
  const rules = MOCK_RULE_DATA[ruleKey] ?? [];
  const graph = useMemo(() => buildDepGraph(rules), [rules]);

  const [tracedLog, setTracedLog] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [runtimeValues, setRuntimeValues] = useState<Record<string, string>>({});
  const [hoverBlock, setHoverBlock] = useState<string | null>(null);
  const [mode, setMode] = useState<TrackerMode>("trace");
  const [impactVar, setImpactVar] = useState("");
  const impactResult = mode === "impact" && impactVar ? computeImpact(graph, impactVar) : null;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setTracedLog(null); setExpandedBlocks(new Set()); setRuntimeValues({}); setHoverBlock(null); }, [ruleKey]);

  const handleTraceLog = useCallback((l: string | null) => { setTracedLog(l); setExpandedBlocks(new Set()); }, []);
  const handleToggle = useCallback((b: string) => setExpandedBlocks((p) => {
    const n = new Set(p); if (n.has(b)) n.delete(b); else n.add(b); return n;
  }), []);

  const rv = Object.keys(runtimeValues).length ? runtimeValues : undefined;
  const trace = tracedLog ? computeTrace(graph, tracedLog, expandedBlocks, rv) : { edges: [], logBlocks: [] };

  return (
    <div className={`h-full flex gap-4 p-4 bg-slate-900 ${R.panel}`}>
      <div className={`w-80 shrink-0 flex flex-col gap-3 bg-slate-800 ${R.card} p-3 min-h-0`}>
        <select
          className="border border-slate-600 rounded px-2 py-1 text-sm bg-slate-700 text-white shrink-0"
          value={ruleKey}
          onChange={(e) => setRuleKey(e.target.value)}
        >
          {RULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>

        <div className="flex-1 min-h-0 flex flex-col text-white">
          <CaseQuery
            key={ruleKey}
            graph={graph}
            rules={rules}
            selectedRule={ruleKey}
            tracedLog={tracedLog}
            expandedBlocks={expandedBlocks}
            runtimeValues={runtimeValues}
            hoverBlock={hoverBlock}
            mode={mode}
            onModeChange={setMode}
            impactVar={impactVar}
            onImpactVarChange={setImpactVar}
            impactResult={impactResult}
            onTraceLog={handleTraceLog}
            onToggleBlock={handleToggle}
            onRuntimeValuesChange={setRuntimeValues}
            onHoverBlock={setHoverBlock}
            onFocusBlock={(b) => setHoverBlock(b)}
          />
        </div>
      </div>

      {/* 追蹤結果（模擬 canvas 會收到的資料） */}
      <div className={`flex-1 bg-slate-800 ${R.card} p-4 font-mono text-xs text-slate-300 overflow-auto`}>
        <div className="text-slate-500 mb-2">tracedLog：<span className="text-red-300">{tracedLog ?? "—"}</span>{"　"}hover：<span className="text-sky-300">{hoverBlock ?? "—"}</span></div>
        <div className="mb-2">
          <span className="text-yellow-400">logBlocks（橘框）</span>：{trace.logBlocks.join(", ") || "—"}
        </div>
        <div className="mb-2">
          <span className="text-purple-400">varBlocks（紫框）</span>：{[...new Set(trace.edges.map((e) => e.to))].join(", ") || "—"}
        </div>
        <div>
          <span className="text-emerald-400">edges（虛線，跟著展開）</span>（{trace.edges.length}）：
          <div className="mt-1 flex flex-col gap-0.5">
            {trace.edges.map((e, i) => (
              <span key={i} className="text-slate-400">L{e.depth} {e.from} → {e.to}{e.fired ? ` [${e.fired}]` : ""}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
