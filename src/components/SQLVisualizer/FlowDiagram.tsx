import type { SqlAnalysis } from "./types";
import { TYPE_COLOR, TYPE_BG } from "./constants";

export default function FlowDiagram({ analysis }: { analysis: SqlAnalysis }) {
  if (analysis.statements.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">尚無 Statement</div>
    );
  }

  return (
    <div className="space-y-1 max-h-140 overflow-y-auto pr-1">
      {analysis.statements.map((s, i) => (
        <div key={i}>
          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: TYPE_COLOR[s.type] + "55",
              background: TYPE_BG[s.type],
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                style={{ background: TYPE_COLOR[s.type] }}
              >
                #{i + 1} {s.type.replace("_", " ")}{" "}
                <span className="opacity-60 font-normal text-[10px]">
                  L{s.startLine}
                  {s.endLine > s.startLine ? `–${s.endLine}` : ""}
                </span>
              </span>
              {s.targetTable && (
                <span className="text-xs font-mono text-slate-600 font-semibold">
                  → {s.targetTable}
                </span>
              )}
              <div className="flex gap-1 flex-wrap">
                {s.tables
                  .filter((t) => t !== s.targetTable)
                  .slice(0, 4)
                  .map((t) => (
                    <span
                      key={t}
                      className="text-xs font-mono text-slate-400 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>

            {/* SQL brief */}
            <div className="font-mono text-xs text-slate-600 truncate">
              {s.brief}
            </div>

            {/* Joins */}
            {s.joins.length > 0 && (
              <div className="mt-1.5 flex gap-2 flex-wrap">
                {s.joins.slice(0, 5).map((j, ji) => (
                  <span
                    key={ji}
                    className="text-xs text-slate-400 bg-white/60 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {j.leftTable} ↔ {j.rightTable}
                    <span className="ml-1 text-slate-300">
                      ({j.joinType.replace("JOIN", "").trim() || "INNER"})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {i < analysis.statements.length - 1 && (
            <div className="flex justify-center text-slate-300 text-lg leading-none my-0.5 select-none">
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
