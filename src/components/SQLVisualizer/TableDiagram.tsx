import { useState, useMemo } from "react";
import { DatabaseOutlined } from "@ant-design/icons";
import type { SqlAnalysis } from "./types";
import { TYPE_COLOR, BOX_W, BOX_H, SVG_W, SVG_H } from "./constants";

interface NodePos {
  name: string;
  x: number;
  y: number;
}

function calcPositions(tables: string[]): NodePos[] {
  const n = tables.length;
  if (n === 0) return [];

  if (n <= 8) {
    const cols = Math.min(n, 4);
    const rows = Math.ceil(n / cols);
    const gapX = SVG_W / (cols + 1);
    const gapY = SVG_H / (rows + 1);
    return tables.map((name, i) => ({
      name,
      x: gapX * ((i % cols) + 1) - BOX_W / 2,
      y: gapY * (Math.floor(i / cols) + 1) - BOX_H / 2,
    }));
  }

  // Circular layout
  const cx = SVG_W / 2;
  const cy = SVG_H / 2;
  const r = Math.min(SVG_W, SVG_H) * 0.38;
  return tables.map((name, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      name,
      x: cx + r * Math.cos(angle) - BOX_W / 2,
      y: cy + r * Math.sin(angle) - BOX_H / 2,
    };
  });
}

export default function TableDiagram({ analysis }: { analysis: SqlAnalysis }) {
  const [selected, setSelected] = useState<string | null>(null);
  const tables = Object.keys(analysis.tableStats);

  const nodes = useMemo(() => calcPositions(tables), [tables]);
  const nodeMap = useMemo(() => {
    const m: Record<string, NodePos> = {};
    nodes.forEach((n) => (m[n.name] = n));
    return m;
  }, [nodes]);

  if (tables.length === 0) {
    return <div className="text-center text-slate-400 py-12">尚無 Table 資料</div>;
  }

  if (analysis.allJoins.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        <DatabaseOutlined className="text-4xl mb-3" />
        <div className="mb-4">偵測到 {tables.length} 個 Table，但無 JOIN 關聯</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {tables.map((t) => (
            <span key={t} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-sm font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-auto rounded-xl border bg-slate-50">
        <svg width={SVG_W} height={SVG_H}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Edges */}
          {analysis.allJoins.map((j, i) => {
            const L = nodeMap[j.left];
            const R = nodeMap[j.right];
            if (!L || !R) return null;
            const x1 = L.x + BOX_W / 2;
            const y1 = L.y + BOX_H / 2;
            const x2 = R.x + BOX_W / 2;
            const y2 = R.y + BOX_H / 2;
            const isActive = !selected || j.left === selected || j.right === selected;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const isDashed = j.type.includes("LEFT") || j.type.includes("RIGHT") || j.type.includes("OUTER");

            return (
              <g key={i} opacity={isActive ? 1 : 0.12} style={{ transition: "opacity 0.2s" }}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? "#94a3b8" : "#cbd5e1"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isDashed ? "6 3" : undefined}
                  markerEnd="url(#arr)"
                />
                <rect x={mx - 32} y={my - 10} width={64} height={20} rx={4} fill="white" stroke="#e2e8f0" />
                <text x={mx} y={my + 4} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="monospace">
                  {j.type.replace("JOIN", "").trim() || "INNER"}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selected === node.name;
            const isRelated =
              !!selected &&
              analysis.allJoins.some(
                (j) =>
                  (j.left === selected || j.right === selected) &&
                  (j.left === node.name || j.right === node.name)
              );
            const stat = analysis.tableStats[node.name];
            const color =
              (stat?.truncateCount ?? 0) > 0 ? TYPE_COLOR.TRUNCATE
              : (stat?.writeCount ?? 0) > 0   ? TYPE_COLOR.INSERT
              : TYPE_COLOR.SELECT;

            return (
              <g
                key={node.name}
                onClick={() => setSelected(isSelected ? null : node.name)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={node.x} y={node.y} width={BOX_W} height={BOX_H} rx={8}
                  fill={isSelected ? color + "22" : isRelated ? color + "11" : "white"}
                  stroke={isSelected ? color : isRelated ? color + "88" : "#e2e8f0"}
                  strokeWidth={isSelected ? 2.5 : 1}
                />
                <text
                  x={node.x + BOX_W / 2} y={node.y + BOX_H / 2 + 4}
                  textAnchor="middle" fontSize={11}
                  fill={isSelected ? color : "#1e293b"}
                  fontFamily="monospace"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {node.name.length > 15 ? node.name.slice(0, 14) + "…" : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-blue-400" /> 唯讀 Table
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-green-400" /> 寫入 Table
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-red-500" /> TRUNCATE
        </span>
        <span>── INNER JOIN &nbsp; - - LEFT/RIGHT JOIN</span>
        <span className="ml-auto">點 Table 高亮關聯</span>
      </div>
    </div>
  );
}
