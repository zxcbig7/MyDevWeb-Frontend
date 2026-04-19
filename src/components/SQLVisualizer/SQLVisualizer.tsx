// ============================================================
// SQLVisualizer.tsx
// SQL 視覺化分析工具
// 支援：SELECT / INSERT / UPDATE / DELETE / TRUNCATE / FOR LOOP
// 四個 Tab：統計概覽 / 表關聯圖 / 流程圖 / 條件解析
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Tabs } from "antd";
import {
  DatabaseOutlined,
  BranchesOutlined,
  SearchOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type StmtType = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "FOR_LOOP" | "OTHER";

interface JoinRelation {
  leftTable: string;
  rightTable: string;
  joinType: string;
  onClause: string;
}

interface ParsedStatement {
  index: number;
  type: StmtType;
  raw: string;
  brief: string;
  tables: string[];
  targetTable?: string;
  joins: JoinRelation[];
  conditions: string[];
  caseClauses: string[];
  startLine: number;
  endLine: number;
}

interface TableStat {
  name: string;
  readCount: number;
  writeCount: number;
  truncateCount: number;
}

interface SqlAnalysis {
  statements: ParsedStatement[];
  tableStats: Record<string, TableStat>;
  allJoins: { left: string; right: string; type: string }[];
  totalSelect: number;
  totalInsert: number;
  totalUpdate: number;
  totalDelete: number;
  totalTruncate: number;
  totalForLoop: number;
}

// ══════════════════════════════════════════════════════════════
// PARSER
// ══════════════════════════════════════════════════════════════

function removeComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

// Block-aware statement splitter
// 追蹤 FOR...LOOP / BEGIN / IF THEN / CASE WHEN 等 block 深度，
// 只在 depth=0 時的 ; 才切割 statement，支援任意巢狀
function splitStatements(sql: string): { text: string; startLine: number; endLine: number }[] {
  const parts: { text: string; startLine: number; endLine: number }[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let depth = 0;
  let lineNo = 1;       // 當前掃到的行號
  let stmtStart = 1;    // 目前 statement 的起始行號

  const peekKeyword = (i: number): string => {
    let w = "";
    while (i < sql.length && /\w/.test(sql[i])) w += sql[i++].toUpperCase();
    return w;
  };

  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];

    // 追蹤行號
    if (ch === "\n") lineNo++;

    // ── String literal handling ──
    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      stringChar = ch;
      current += ch;
      i++;
      continue;
    }
    if (inString) {
      current += ch;
      if (ch === stringChar) {
        if (sql[i + 1] === stringChar) {
          current += sql[i + 1];
          i += 2;
        } else {
          inString = false;
          i++;
        }
      } else {
        i++;
      }
      continue;
    }

    // ── Keyword detection ──
    if (/[A-Za-z_]/.test(ch)) {
      const word = peekKeyword(i);
      const wordLen = word.length;

      if (word === "FOR") {
        const rest = sql.slice(i).toUpperCase();
        if (/^FOR\b[\s\S]+?\bLOOP\b/.test(rest)) depth++;
      } else if (word === "BEGIN") {
        depth++;
      } else if (word === "IF") {
        const rest = sql.slice(i).toUpperCase();
        if (/^IF\b[\s\S]+?\bTHEN\b/.test(rest.substring(0, 200))) depth++;
      } else if (word === "END") {
        if (depth > 0) depth--;
      }

      current += sql.slice(i, i + wordLen);
      i += wordLen;
      continue;
    }

    // ── Semicolon: only split at depth 0 ──
    if (ch === ";") {
      if (depth === 0) {
        const text = current.trim();
        if (text) {
          parts.push({ text, startLine: stmtStart, endLine: lineNo });
        }
        current = "";
        stmtStart = lineNo + 1;
      } else {
        current += ch;
      }
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const text = current.trim();
  if (text) parts.push({ text, startLine: stmtStart, endLine: lineNo });
  return parts;
}


function detectType(upper: string): StmtType {
  const s = upper.trimStart();
  if (/^SELECT\b/.test(s)) return "SELECT";
  if (/^INSERT\b/.test(s)) return "INSERT";
  if (/^UPDATE\b/.test(s)) return "UPDATE";
  if (/^DELETE\b/.test(s)) return "DELETE";
  if (/^TRUNCATE\b/.test(s)) return "TRUNCATE";
  if (/\bFOR\b[\s\S]+?\bLOOP\b/.test(s)) return "FOR_LOOP";
  if (/\bSELECT\b/.test(s)) return "SELECT";
  if (/\bINSERT\b/.test(s)) return "INSERT";
  if (/\bUPDATE\b/.test(s)) return "UPDATE";
  if (/\bDELETE\b/.test(s)) return "DELETE";
  return "OTHER";
}

function cleanTableName(raw: string): string {
  return raw.replace(/[`"[\]]/g, "").split(".").pop()!.toUpperCase().trim();
}

function parseStatement(raw: string, index: number, startLine: number, endLine: number): ParsedStatement {
  const upper = raw.toUpperCase();
  const type = detectType(upper);
  const tables: string[] = [];
  const joins: JoinRelation[] = [];
  const conditions: string[] = [];
  const caseClauses: string[] = [];
  let targetTable: string | undefined;

  // Extract target table per operation type
  let m: RegExpMatchArray | null;
  if (type === "INSERT") {
    m = upper.match(/INSERT\s+(?:INTO\s+)?(\w+)/);
    if (m) targetTable = cleanTableName(m[1]);
  } else if (type === "UPDATE") {
    m = upper.match(/UPDATE\s+(\w+)/);
    if (m) targetTable = cleanTableName(m[1]);
  } else if (type === "DELETE") {
    m = upper.match(/DELETE\s+FROM\s+(\w+)/);
    if (m) targetTable = cleanTableName(m[1]);
  } else if (type === "TRUNCATE") {
    m = upper.match(/TRUNCATE\s+(?:TABLE\s+)?(\w+)/);
    if (m) targetTable = cleanTableName(m[1]);
  }

  // Extract FROM tables
  const skip = new Set(["WHERE", "SELECT", "HAVING", "ON", "SET", "VALUES", "DUAL", "INTO"]);
  for (const fm of upper.matchAll(/\bFROM\s+(\w+)/g)) {
    const t = cleanTableName(fm[1]);
    if (!skip.has(t) && t.length > 1) tables.push(t);
  }

  // Extract JOINs: [LEFT|RIGHT|INNER|OUTER|FULL|CROSS] [OUTER] JOIN table [alias] ON ...
  const joinRe =
    /\b((?:(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+)*JOIN)\s+(\w+)(?:\s+(?:AS\s+)?\w+)?\s+ON\s+([^;]+?)(?=\b(?:WHERE|JOIN|GROUP|ORDER|HAVING|LIMIT|UNION|EXCEPT|INTERSECT)\b|$)/gi;
  for (const jm of raw.matchAll(joinRe)) {
    const joinType = jm[1].replace(/\s+/g, " ").trim().toUpperCase();
    const rightTable = cleanTableName(jm[2]);
    const onClause = jm[3].trim().substring(0, 100);
    const leftTable = tables[tables.length - 1] ?? targetTable ?? "";
    if (leftTable && rightTable && leftTable !== rightTable) {
      joins.push({ leftTable, rightTable, joinType, onClause });
    }
    tables.push(rightTable);
  }

  if (targetTable) tables.push(targetTable);

  // Extract WHERE conditions
  const whereM = raw.match(
    /\bWHERE\b([\s\S]+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bHAVING\b|\bLIMIT\b|\bRETURNING\b|$)/i
  );
  if (whereM) {
    const clause = whereM[1].trim();
    const parts = clause
      .split(/\b(?:AND|OR)\b/i)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 20);
    conditions.push(...parts);
  }

  // Extract CASE WHEN
  for (const cm of raw.matchAll(/CASE\b[\s\S]+?\bEND\b/gi)) {
    caseClauses.push(cm[0].replace(/\s+/g, " ").trim().substring(0, 300));
  }

  const brief = raw.replace(/\s+/g, " ").trim().substring(0, 100);

  return {
    index,
    type,
    raw: raw.trim(),
    brief,
    tables: [...new Set(tables)],
    targetTable,
    joins,
    conditions,
    caseClauses,
    startLine,
    endLine,
  };
}

function parseSql(sql: string): SqlAnalysis {
  const cleaned = removeComments(sql);
  const rawStmts = splitStatements(cleaned);

  const statements: ParsedStatement[] = [];
  const tableStats: Record<string, TableStat> = {};
  let totalSelect = 0,
    totalInsert = 0,
    totalUpdate = 0,
    totalDelete = 0,
    totalTruncate = 0,
    totalForLoop = 0;

  const ensureTable = (name: string) => {
    if (!tableStats[name])
      tableStats[name] = { name, readCount: 0, writeCount: 0, truncateCount: 0 };
  };

  for (const raw of rawStmts) {
    const norm = raw.text.replace(/\s+/g, " ").trim();
    if (!norm || norm.length < 3) continue;
    const s = parseStatement(norm, statements.length, raw.startLine, raw.endLine);
    statements.push(s);

    switch (s.type) {
      case "SELECT":   totalSelect++; break;
      case "INSERT":   totalInsert++; break;
      case "UPDATE":   totalUpdate++; break;
      case "DELETE":   totalDelete++; break;
      case "TRUNCATE": totalTruncate++; break;
      case "FOR_LOOP": totalForLoop++; break;
    }

    s.tables.forEach((t) => {
      ensureTable(t);
      if (s.type === "TRUNCATE" && t === s.targetTable) {
        tableStats[t].truncateCount++;
      } else if (
        ["INSERT", "UPDATE", "DELETE"].includes(s.type) &&
        t === s.targetTable
      ) {
        tableStats[t].writeCount++;
      } else {
        tableStats[t].readCount++;
      }
    });
  }

  // Deduplicate joins
  const joinSet = new Map<string, { left: string; right: string; type: string }>();
  for (const s of statements) {
    for (const j of s.joins) {
      const key = [j.leftTable, j.rightTable].sort().join("|");
      if (!joinSet.has(key)) {
        joinSet.set(key, { left: j.leftTable, right: j.rightTable, type: j.joinType });
      }
    }
  }

  return {
    statements,
    tableStats,
    allJoins: [...joinSet.values()],
    totalSelect,
    totalInsert,
    totalUpdate,
    totalDelete,
    totalTruncate,
    totalForLoop,
  };
}

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const TYPE_COLOR: Record<StmtType, string> = {
  SELECT:   "#3b82f6",
  INSERT:   "#22c55e",
  UPDATE:   "#f59e0b",
  DELETE:   "#ef4444",
  TRUNCATE: "#dc2626",
  FOR_LOOP: "#a855f7",
  OTHER:    "#64748b",
};

const TYPE_BG: Record<StmtType, string> = {
  SELECT:   "#eff6ff",
  INSERT:   "#f0fdf4",
  UPDATE:   "#fffbeb",
  DELETE:   "#fef2f2",
  TRUNCATE: "#fef2f2",
  FOR_LOOP: "#faf5ff",
  OTHER:    "#f8fafc",
};

// ══════════════════════════════════════════════════════════════
// TAB 1：統計概覽
// ══════════════════════════════════════════════════════════════

function StatsPanel({ analysis }: { analysis: SqlAnalysis }) {
  const topTables = Object.values(analysis.tableStats)
    .sort(
      (a, b) =>
        b.readCount + b.writeCount + b.truncateCount -
        (a.readCount + a.writeCount + a.truncateCount)
    )
    .slice(0, 15);

  const maxTotal =
    topTables[0]
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

// ══════════════════════════════════════════════════════════════
// TAB 2：表關聯圖（SVG）
// ══════════════════════════════════════════════════════════════

interface NodePos {
  name: string;
  x: number;
  y: number;
}

const BOX_W = 130;
const BOX_H = 38;
const SVG_W = 900;
const SVG_H = 580;

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

  // Circular
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

function TableDiagram({ analysis }: { analysis: SqlAnalysis }) {
  const [selected, setSelected] = useState<string | null>(null);
  const tables = Object.keys(analysis.tableStats);

  const nodes = useMemo(() => calcPositions(tables), [tables]);
  const nodeMap = useMemo(() => {
    const m: Record<string, NodePos> = {};
    nodes.forEach((n) => (m[n.name] = n));
    return m;
  }, [nodes]);

  if (tables.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">尚無 Table 資料</div>
    );
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
            const isActive =
              !selected || j.left === selected || j.right === selected;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const isDashed =
              j.type.includes("LEFT") || j.type.includes("RIGHT") || j.type.includes("OUTER");

            return (
              <g key={i} opacity={isActive ? 1 : 0.12} style={{ transition: "opacity 0.2s" }}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? "#94a3b8" : "#cbd5e1"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isDashed ? "6 3" : undefined}
                  markerEnd="url(#arr)"
                />
                <rect x={mx - 32} y={my - 10} width={64} height={20} rx={4}
                  fill="white" stroke="#e2e8f0" />
                <text x={mx} y={my + 4} textAnchor="middle" fontSize={9}
                  fill="#64748b" fontFamily="monospace">
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
              (stat?.truncateCount ?? 0) > 0
                ? TYPE_COLOR.TRUNCATE
                : (stat?.writeCount ?? 0) > 0
                ? TYPE_COLOR.INSERT
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

// ══════════════════════════════════════════════════════════════
// TAB 3：流程圖
// ══════════════════════════════════════════════════════════════

function FlowDiagram({ analysis }: { analysis: SqlAnalysis }) {
  if (analysis.statements.length === 0) {
    return <div className="text-center text-slate-400 py-12">尚無 Statement</div>;
  }

  return (
    <div className="space-y-1 max-h-140 overflow-y-auto pr-1">
      {analysis.statements.map((s, i) => (
        <div key={i}>
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: TYPE_COLOR[s.type] + "55", background: TYPE_BG[s.type] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                style={{ background: TYPE_COLOR[s.type] }}
              >
                #{i + 1} {s.type.replace("_", " ")} <span className="opacity-60 font-normal text-[10px]">L{s.startLine}{s.endLine > s.startLine ? `–${s.endLine}` : ""}</span>
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
                    <span key={t} className="text-xs font-mono text-slate-400 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
                      {t}
                    </span>
                  ))}
              </div>
            </div>

            {/* SQL brief */}
            <div className="font-mono text-xs text-slate-600 truncate">{s.brief}</div>

            {/* Joins */}
            {s.joins.length > 0 && (
              <div className="mt-1.5 flex gap-2 flex-wrap">
                {s.joins.slice(0, 5).map((j, ji) => (
                  <span key={ji} className="text-xs text-slate-400 bg-white/60 px-2 py-0.5 rounded border border-slate-200">
                    {j.leftTable} ↔ {j.rightTable}
                    <span className="ml-1 text-slate-300">({j.joinType.replace("JOIN", "").trim() || "INNER"})</span>
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

// ══════════════════════════════════════════════════════════════
// TAB 4：條件解析
// ══════════════════════════════════════════════════════════════

function ConditionsPanel({ analysis }: { analysis: SqlAnalysis }) {
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
            <span className="opacity-70 font-normal text-[10px]">L{s.startLine}{s.endLine > s.startLine ? `–${s.endLine}` : ""}</span>
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

// ══════════════════════════════════════════════════════════════
// SAMPLE SQL
// ══════════════════════════════════════════════════════════════

const SAMPLE_SQL = `
-- 員工資料同步流程

SELECT e.id, e.name, e.salary, d.dept_name, l.city
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id
LEFT JOIN locations l ON d.location_id = l.id
WHERE e.status = 'active'
  AND e.salary > 50000
  AND d.region = 'APAC';

INSERT INTO audit_log (action, table_name, record_id, created_at)
SELECT 'EXPORT', 'employees', e.id, SYSDATE
FROM employees e
WHERE e.updated_at > TRUNC(SYSDATE) - 1;

UPDATE employees
SET status = 'inactive', updated_at = SYSDATE
WHERE last_login < SYSDATE - 365
  AND status = 'active';

FOR rec IN (SELECT id, score FROM test_results WHERE processed = 0) LOOP
  INSERT INTO graded_results (id, grade, process_date)
  VALUES (
    rec.id,
    CASE WHEN rec.score >= 90 THEN 'A'
         WHEN rec.score >= 80 THEN 'B'
         WHEN rec.score >= 70 THEN 'C'
         ELSE 'F' END,
    SYSDATE
  );

  UPDATE test_results SET processed = 1 WHERE id = rec.id;
END LOOP;

TRUNCATE TABLE temp_sync_data;

SELECT
  s.student_id,
  s.name,
  AVG(t.score) AS avg_score,
  CASE WHEN AVG(t.score) >= 80 THEN 'Pass' ELSE 'Fail' END AS result
FROM students s
INNER JOIN test_results t ON s.id = t.student_id
INNER JOIN courses c ON t.course_id = c.id
WHERE c.semester = '2025-1'
  AND s.status = 'enrolled'
GROUP BY s.student_id, s.name;

DELETE FROM audit_log
WHERE created_at < SYSDATE - 90;
`.trim();

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function SQLVisualizer() {
  const [sql, setSql] = useState(SAMPLE_SQL);
  const [analysis, setAnalysis] = useState<SqlAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState("stats");

  const handleParse = () => {
    try {
      setAnalysis(parseSql(sql));
      setActiveTab("stats");
    } catch (e) {
      console.error("Parse error:", e);
    }
  };

  useEffect(() => {
    setAnalysis(parseSql(SAMPLE_SQL));
  }, []);

  const tabItems = useMemo(
    () =>
      analysis
        ? [
            {
              key: "stats",
              label: (
                <span className="flex items-center gap-1.5">
                  <BarChartOutlined /> 統計概覽
                </span>
              ),
              children: <StatsPanel analysis={analysis} />,
            },
            {
              key: "diagram",
              label: (
                <span className="flex items-center gap-1.5">
                  <DatabaseOutlined /> 表關聯圖
                </span>
              ),
              children: <TableDiagram analysis={analysis} />,
            },
            {
              key: "flow",
              label: (
                <span className="flex items-center gap-1.5">
                  <BranchesOutlined /> 流程圖
                </span>
              ),
              children: <FlowDiagram analysis={analysis} />,
            },
            {
              key: "conditions",
              label: (
                <span className="flex items-center gap-1.5">
                  <SearchOutlined /> 條件解析
                </span>
              ),
              children: <ConditionsPanel analysis={analysis} />,
            },
          ]
        : [],
    [analysis]
  );

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">SQL 視覺化分析</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          支援 SELECT / INSERT / UPDATE / DELETE / TRUNCATE / FOR LOOP · WHERE · CASE WHEN
        </p>
      </div>

      {/* SQL Input with line numbers */}
      <div className="space-y-2">
        <div className="flex rounded-xl border border-slate-700 bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500" style={{ minHeight: "13rem" }}>
          {/* Line numbers */}
          <div
            className="select-none text-right font-mono text-xs text-slate-600 bg-slate-800 py-4 px-2 shrink-0"
            style={{ minWidth: "2.8rem", lineHeight: "1.5rem" }}
            aria-hidden
          >
            {sql.split("\n").map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="flex-1 font-mono text-sm bg-transparent text-green-300 py-4 px-3 resize-none focus:outline-none placeholder:text-slate-600 leading-6"
            placeholder="貼上 SQL 程式碼..."
            spellCheck={false}
            style={{ lineHeight: "1.5rem" }}
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <PlayCircleOutlined /> 解析
          </button>
          <button
            onClick={() => { setSql(SAMPLE_SQL); setAnalysis(parseSql(SAMPLE_SQL)); }}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm rounded-lg transition-colors"
          >
            載入範例
          </button>
          <button
            onClick={() => { setSql(""); setAnalysis(null); }}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm rounded-lg transition-colors"
          >
            清除
          </button>
          {analysis && (
            <span className="ml-auto text-xs text-slate-400">
              {analysis.statements.length} statements ·{" "}
              {Object.keys(analysis.tableStats).length} tables ·{" "}
              {analysis.allJoins.length} joins
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <div className="border rounded-2xl bg-white p-4 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
          />
        </div>
      )}
    </div>
    </div>
  );
}
