import type { SqlAnalysis } from "./types";
import { TYPE_COLOR } from "./constants";

export default function ConditionsPanel({ analysis }: { analysis: SqlAnalysis }) {
  const stmts = analysis.statements.filter(
    (s) => s.conditions.length > 0 || s.caseClauses.length > 0
  );

  if (stmts.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        未偵測到 WHERE / CASE WHEN 條件
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-140 overflow-y-auto pr-1">
      {stmts.map((s) => (
        <div key={s.index} className="rounded-xl border overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white"
            style={{ background: TYPE_COLOR[s.type] }}
          >
            <span>#{s.index + 1}</span>
            <span className="opacity-70 font-normal text-[10px]">
              L{s.startLine}{s.endLine > s.startLine ? `–${s.endLine}` : ""}
            </span>
            <span>{s.type.replace("_", " ")}</span>
            {s.targetTable && <span>→ {s.targetTable}</span>}
          </div>

          <div className="p-3 space-y-4 bg-white">
            {/* WHERE conditions */}
            {s.conditions.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  WHERE 條件 ({s.conditions.length})
                </div>
                <div className="space-y-1">
                  {s.conditions.map((c, ci) => (
                    <div
                      key={ci}
                      className="font-mono text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-slate-700"
                    >
                      <span className="text-blue-400 mr-2 select-none">{ci + 1}.</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CASE WHEN */}
            {s.caseClauses.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  CASE WHEN ({s.caseClauses.length})
                </div>
                <div className="space-y-2">
                  {s.caseClauses.map((c, ci) => (
                    <pre
                      key={ci}
                      className="font-mono text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-slate-700 whitespace-pre-wrap wrap-break-word"
                    >
                      {c}
                    </pre>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
