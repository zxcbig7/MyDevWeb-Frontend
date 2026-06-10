// ============================================================
// depGraph.ts
// Tracker 依賴圖：整條 rule 建一次的 DAG（唯一真相）+ 顯示用 lazy 投影
//   - buildDepGraph : 一次掃描建圖（vars / logs / roots）
//   - dumpDepGraph  : 攤平成文字供肉眼驗證（VARS / LOGS / ROOTS）
//   - traceLog      : 從某 [$LOG$] 取第一層（觸發條件變數）
//   - expandVar     : 即時展開某變數的下一層（依定義 block 分組）
// spec: specs/2026-06-07-tracker-dep-graph.md
// ============================================================

import type {
  RuleData, DepGraph, DepRef, VarNode, VarDef, ExpandedDef, ViewNode, ViewStatus,
} from "./types";
import { parseAPF, extractVars } from "./apfParse";

export type LogClosure = {
  vars: Set<string>;                 // 自此 log 可達的所有變數
  blocks: Set<string>;               // 牽涉到的 block（trigger + 各變數定義 block）
  refCount: Map<string, number>;     // 各變數在 closure 內的被引用次數
  shared: Set<string>;               // refCount ≥ 2 的變數（樹上會多處出現）
};

const LOG_RE = /\[\$([A-Z][A-Z0-9_]*)\$\]/g;
const isSingleIdent = (s: string): boolean => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);

// 每個 block 沿 PREBLOCK 反向 BFS 可達的上游 block 集合（含跨 INDEX join 進來的副線）。
// 用來把「變數來源」限制在「真的會流進引用 block」的上游，排除同名但不在資料流上的孤兒。
function buildAncestors(rules: RuleData[]): Map<string, Set<string>> {
  const pre = new Map<string, string[]>();
  for (const r of rules) pre.set(r.BLOCK_NAME, r.PREBLOCK ?? []);

  const result = new Map<string, Set<string>>();
  for (const r of rules) {
    const acc = new Set<string>();
    const queue = [...(pre.get(r.BLOCK_NAME) ?? [])];
    while (queue.length) {
      const b = queue.shift()!;
      if (!pre.has(b) || acc.has(b)) continue;   // 不存在的 block 或已走訪 → 跳過（兼防環）
      acc.add(b);
      for (const p of pre.get(b) ?? []) queue.push(p);
    }
    result.set(r.BLOCK_NAME, acc);
  }
  return result;
}

/** 變數 V 被 block refBlock 引用時的合法來源：COLUMN1==V 且其 block 在 refBlock 的 PREBLOCK 上游。 */
export function resolveDefs(graph: DepGraph, varName: string, refBlock: string): VarDef[] {
  const node = graph.vars.get(varName);
  if (!node) return [];
  const anc = graph.ancestors.get(refBlock);
  if (!anc) return [];
  return node.defs.filter((d) => anc.has(d.block));
}

// ─── 建圖 ───────────────────────────────────────────────────
export function buildDepGraph(rules: RuleData[]): DepGraph {
  const vars = new Map<string, VarNode>();
  const logs: DepGraph["logs"] = new Map();

  const ensureVar = (name: string): VarNode => {
    let node = vars.get(name);
    if (!node) { node = { name, defs: [] }; vars.set(name, node); }
    return node;
  };

  for (const r of rules) {
    for (const v of r.VALUES ?? []) {
      const expr = v.VALUE;
      if (!expr) continue;
      const clauses = parseAPF(expr);

      // (a) Function 定義：COLUMN1 為單一變數名 → 它依賴整個表達式引用的變數
      //     只認 Function（Index 的 COLUMN1 是 join key、Database 是 root，皆不算運算）
      const out = v.COLUMN1?.trim();
      if (r.BLOCK_TYPE === "Function" && out && isSingleIdent(out)) {
        const depMap = new Map<string, DepRef>();
        for (const cl of clauses)                       // 條件位置優先
          for (const d of extractVars(cl.cond, "cond")) if (!depMap.has(d.varName)) depMap.set(d.varName, d);
        for (const cl of clauses)                       // 結果位置（passthrough）
          for (const d of extractVars(cl.result, "result")) if (!depMap.has(d.varName)) depMap.set(d.varName, d);

        const deps = [...depMap.values()];
        ensureVar(out).defs.push({ block: r.BLOCK_NAME, blockType: r.BLOCK_TYPE, deps });
        for (const d of deps) ensureVar(d.varName);
      }

      // (b) log 進入點：任何 clause 的 result 含 [$LOG$] → 該 clause 的條件變數為第一層
      for (const cl of clauses) {
        LOG_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = LOG_RE.exec(cl.result)) !== null) {
          const logName = m[1];
          const deps = extractVars(cl.cond, "cond");
          let entry = logs.get(logName);
          if (!entry) { entry = { logName, triggers: [] }; logs.set(logName, entry); }
          entry.triggers.push({ block: r.BLOCK_NAME, clauseCond: cl.cond, deps });
          for (const d of deps) ensureVar(d.varName);
        }
      }
    }
  }

  const roots = [...vars.values()].filter((n) => n.defs.length === 0).map((n) => n.name).sort();
  return { vars, logs, roots, ancestors: buildAncestors(rules) };
}

// ─── lazy 投影：trace / expand ──────────────────────────────
// refBlock = 引用此變數的 block；來源 / root 判定一律以它的 PREBLOCK 上游為準。
function childStatus(
  graph: DepGraph, dep: string, refBlock: string, path: Set<string>, seen?: Set<string>,
): ViewStatus {
  if (path.has(dep)) return "cycle";
  if (resolveDefs(graph, dep, refBlock).length === 0) return "root";  // 上游沒有定義 → root
  if (seen?.has(dep)) return "shared";
  return "normal";
}

const toViewNode = (
  graph: DepGraph, dep: DepRef, refBlock: string, path: Set<string>, seen?: Set<string>,
): ViewNode => ({
  varName: dep.varName,
  edge: dep,
  status: childStatus(graph, dep.varName, refBlock, path, seen),
});

/** 從某 [$LOG$] 取第一層：各 trigger 的觸發條件變數（refBlock = log 產出 block）。找不到回 null。 */
export function traceLog(graph: DepGraph, logName: string, seen?: Set<string>) {
  const entry = graph.logs.get(logName);
  if (!entry) return null;
  return entry.triggers.map((t) => ({
    block: t.block,
    clauseCond: t.clauseCond,
    children: t.deps.map((d) => toViewNode(graph, d, t.block, new Set(), seen)),
  }));
}

/**
 * 展開某變數下一層：來源限定在 refBlock 的 PREBLOCK 上游（排除同名孤兒）。
 * path = 從 root 到此節點的祖先變數（判環用）；子節點的 refBlock = 該定義 block。
 */
export function expandVar(
  graph: DepGraph, varName: string, refBlock: string, path: Set<string>, seen?: Set<string>,
): ExpandedDef[] {
  const nextPath = new Set(path).add(varName);
  return resolveDefs(graph, varName, refBlock).map((def) => ({
    block: def.block,
    blockType: def.blockType,
    children: def.deps.map((d) => toViewNode(graph, d, def.block, nextPath, seen)),
  }));
}

// ─── 驗證用 dump ────────────────────────────────────────────
export function dumpDepGraph(graph: DepGraph): string {
  const lines: string[] = [];

  lines.push("[VARS]");
  for (const node of [...graph.vars.values()].filter((n) => n.defs.length > 0).sort((a, b) => a.name.localeCompare(b.name))) {
    for (const def of node.defs) {
      const deps = def.deps.map((d) => `${d.varName}[${d.role}]`).join(", ") || "(無)";
      lines.push(`  ${node.name.padEnd(18)} ← ${def.block} (${def.blockType})  deps: ${deps}`);
    }
  }

  lines.push("", "[LOGS]");
  for (const entry of [...graph.logs.values()].sort((a, b) => a.logName.localeCompare(b.logName))) {
    for (const t of entry.triggers) {
      const deps = t.deps.map((d) => d.varName).join(", ") || "(無)";
      lines.push(`  [$${entry.logName}$] @ ${t.block} → ${deps}`);
    }
  }

  lines.push("", `[ROOTS] (${graph.roots.length})`);
  lines.push("  " + graph.roots.join(", "));

  // 完整性檢查：被引用但圖裡缺節點（理論上不會發生）
  const dangling = new Set<string>();
  for (const node of graph.vars.values())
    for (const def of node.defs)
      for (const d of def.deps)
        if (!graph.vars.has(d.varName)) dangling.add(d.varName);
  if (dangling.size) lines.push("", `[DANGLING] ${[...dangling].join(", ")}`);

  return lines.join("\n");
}

// ─── log closure（複製報告 / shared 偵測 / canvas 高亮共用）──
/** 走訪自某 log 可達的依賴閉包：變數、牽涉 block、被引用次數、shared 集合 */
export function collectLogClosure(graph: DepGraph, logName: string): LogClosure {
  const vars = new Set<string>();
  const blocks = new Set<string>();
  const refCount = new Map<string, number>();
  const bump = (v: string) => refCount.set(v, (refCount.get(v) ?? 0) + 1);

  const entry = graph.logs.get(logName);
  // queue 帶 refBlock：解析來源時用「引用此變數的 block」之 PREBLOCK 上游（排除孤兒）
  const queue: { varName: string; refBlock: string }[] = [];
  const enqueue = (varName: string, refBlock: string) => {
    bump(varName);
    if (!vars.has(varName)) { vars.add(varName); queue.push({ varName, refBlock }); }
  };

  if (entry) for (const t of entry.triggers) {
    blocks.add(t.block);
    for (const d of t.deps) enqueue(d.varName, t.block);
  }
  while (queue.length) {
    const { varName, refBlock } = queue.shift()!;
    for (const def of resolveDefs(graph, varName, refBlock)) {
      blocks.add(def.block);
      for (const d of def.deps) enqueue(d.varName, def.block);
    }
  }

  const shared = new Set([...refCount].filter(([, c]) => c >= 2).map(([k]) => k));
  return { vars, blocks, refCount, shared };
}

// ─── 一鍵複製：給 AI 分析的完整 context pack ────────────────
/** 把某 log 的觸發點 + 依賴樹 + 相關 block 完整定義 + roots + runtime 值，整理成 markdown */
export function buildLogReport(
  graph: DepGraph,
  rules: RuleData[],
  logName: string,
  runtimeValues?: Record<string, string>,
): string {
  const entry = graph.logs.get(logName);
  if (!entry) return `找不到 [$${logName}$]`;

  const byName = new Map(rules.map((r) => [r.BLOCK_NAME, r]));
  const orderOf = new Map(rules.map((r, i) => [r.BLOCK_NAME, i]));
  const closure = collectLogClosure(graph, logName);
  const out: string[] = [];

  const ruleName = rules[0]?.RULE_NAME ?? "";
  out.push(`# RTD 反藍追蹤報告：[$${logName}$]`);
  if (ruleName) out.push(`Rule：${ruleName}`);

  // 觸發點
  out.push("", "## 觸發點");
  entry.triggers.forEach((t, i) => {
    const tag = entry.triggers.length > 1 ? `(${i + 1}) ` : "";
    out.push(`${tag}由 block \`${t.block}\` 產生，觸發條件：`);
    out.push("```", t.clauseCond || "(無條件)", "```");
  });

  // 變數依賴樹（shared 子樹只完整展開第一次，之後標「見上」避免冗長）
  out.push("", "## 變數依賴樹（為何觸發 → 依賴鏈 → root）");
  out.push("```");
  out.push(`[$${logName}$]`);
  const expanded = new Set<string>();
  entry.triggers.forEach((t) => {
    t.deps.forEach((d, idx) =>
      renderVarText(graph, d, t.block, "", idx === t.deps.length - 1, new Set(), closure.shared, expanded, out),
    );
  });
  out.push("```");

  // 相關 block 完整定義
  out.push("", "## 相關 Block 完整定義");
  const blocks = [...closure.blocks].sort((a, b) => (orderOf.get(a) ?? 0) - (orderOf.get(b) ?? 0));
  for (const name of blocks) {
    const r = byName.get(name);
    if (!r) continue;
    const grp = r.BLOCK_GROUP ? `, group ${r.BLOCK_GROUP}` : "";
    out.push("", `### ${r.BLOCK_NAME}  (${r.BLOCK_TYPE}${grp})`);
    for (const v of r.VALUES ?? []) {
      if (!v.VALUE && !v.COLUMN1) continue;
      const label = v.COLUMN1 ? `${v.COLUMN1} =` : "·";
      out.push("```", `${label} ${v.VALUE ?? ""}`.trim(), "```");
    }
  }

  // root 變數
  const roots = graph.roots.filter((r) => closure.refCount.has(r));
  if (roots.length) {
    out.push("", "## Root 變數（DB / 外部輸入，無上游）", roots.join(", "));
  }

  // runtime 值
  if (runtimeValues && Object.keys(runtimeValues).length) {
    out.push("", "## Runtime 實際值");
    out.push(Object.entries(runtimeValues).map(([k, v]) => `${k} = ${v}`).join("\n"));
  }

  return out.join("\n");
}

/** 遞迴把單一變數及其上游畫成 ASCII 樹（refBlock 限定來源，path 判環，shared 只完整展開一次）*/
function renderVarText(
  graph: DepGraph, dep: DepRef, refBlock: string, prefix: string, isLast: boolean,
  path: Set<string>, shared: Set<string>, expanded: Set<string>, out: string[],
): void {
  const status = childStatus(graph, dep.varName, refBlock, path, shared);
  const branch = isLast ? "└─ " : "├─ ";
  // shared 變數第二次出現就不再展開，避免報告冗長
  const repeat = status === "shared" && expanded.has(dep.varName);
  const tag = status === "root" ? "  [root]"
    : status === "cycle" ? "  [↩循環]"
    : repeat ? "  [共用，見上]"
    : status === "shared" ? "  [共用]" : "";
  const label = dep.snippet && dep.snippet !== dep.varName ? `${dep.varName}  (${dep.snippet})` : dep.varName;
  out.push(`${prefix}${branch}${label}${tag}`);

  if (status === "root" || status === "cycle" || repeat) return;  // 葉 / 成環 / 已展開過 → 停
  if (status === "shared") expanded.add(dep.varName);
  const childPrefix = prefix + (isLast ? "    " : "│   ");
  const nextPath = new Set(path).add(dep.varName);
  const defs = resolveDefs(graph, dep.varName, refBlock);   // 只取上游合法來源

  defs.forEach((def) => {
    const multi = defs.length > 1;
    if (multi) out.push(`${childPrefix}● 來自 ${def.block}`);
    const cp = multi ? `${childPrefix}  ` : childPrefix;
    def.deps.forEach((cd, ci) =>
      renderVarText(graph, cd, def.block, cp, ci === def.deps.length - 1, nextPath, shared, expanded, out),
    );
  });
}
