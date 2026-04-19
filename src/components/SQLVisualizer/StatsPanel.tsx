import type { SqlAnalysis } from "./types";
import { TYPE_COLOR } from "./constants";

export default function StatsPanel({ analysis }: { analysis: SqlAnalysis }) {
  const topTables = Object.values(analysis.tableStats)
    .sort((a, b) =>
      (b.readCount + b.writeCount + b.truncateCount) -
      (a.readCount + a.writeCount + a.truncateCount)
    )
    .slice(0, 15);

  const maxTotal = topTables[0]
    ? topTables[0].readCount + topTables[0].writeCount + topTables[0].truncateCount
    : 1;

  return (
    <div className="space-y-6">
      {/* Operation counts */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">
          操作統計
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(
            [
              { label: "SELECT",   count: analysis.totalSelect,   type: "SELECT" },
              { label: "INSERT",   count: analysis.totalInsert,   type: "INSERT" },
              { label: "UPDATE",   count: analysis.totalUpdate,   type: "UPDATE" },
              { label: "DELETE",   count: analysis.totalDelete,   type: "DELETE" },
              { label: "TRUNCATE", count: analysis.totalTruncate, type: "TRUNCATE" },
              { label: "FOR LOOP", count: analysis.totalForLoop,  type: "FOR_LOOP" },
            ] as const
          ).map(({ label, count, type }) => (
            <div
              key={label}
              className="rounded-xl border p-3 text-center"
              style={{ borderColor: TYPE_COLOR[type] + "40", background: TYPE_COLOR[type] + "0d" }}
            >
              <div className="text-3xl font-black" style={{ color: TYPE_COLOR[type] }}>
                {count}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400">
          共 <b>{analysis.statements.length}</b> 個 Statement ·{" "}
          <b>{Object.keys(analysis.tableStats).length}</b> 個 Table ·{" "}
          <b>{analysis.allJoins.length}</b> 個 JOIN 關聯
        </div>
      </div>

      {/* Table usage */}
      {topTables.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">
            Table 使用頻率（Top 15）
          </div>
          <div className="space-y-2">
            {topTables.map((t) => {
              const total = t.readCount + t.writeCount + t.truncateCount;
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-40 text-xs font-mono text-slate-700 truncate" title={t.name}>
                    {t.name}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(total / maxTotal) * 100}%`,
                        background: t.truncateCount > 0
                          ? TYPE_COLOR.TRUNCATE
                          : t.writeCount > 0
                          ? TYPE_COLOR.INSERT
                          : TYPE_COLOR.SELECT,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 w-5 text-right">{total}</div>
                  <div className="flex gap-1">
                    {t.readCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        R:{t.readCount}
                      </span>
                    )}
                    {t.writeCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                        W:{t.writeCount}
                      </span>
                    )}
                    {t.truncateCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                        T:{t.truncateCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
