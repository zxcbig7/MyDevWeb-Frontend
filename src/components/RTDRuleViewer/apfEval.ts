// ============================================================
// apfEval.ts
// APF 條件三值評估：tokenizer-based AST + AND/OR/NOT/括號/比較
//   - parseCond : 一段條件文字 → CondNode AST（函式呼叫子條件 → unknown）
//   - evalCond  : 用 runtime 值對 AST 做三值邏輯（yes / no / unknown）
// 字串 / 註解的跳過規則與 apfParse 一致：關鍵字藏在字串 / 註解裡不會被當結構符號。
// spec: specs/2026-06-13-tracker-impact-deeplink-clause-eval.md
// ============================================================

import type { FireState } from "./types";

// ─── 條件 AST ───────────────────────────────────────────────
export type CmpOp = "==" | "!=" | ">" | "<" | ">=" | "<=";

export type CondNode =
  | { kind: "and" | "or"; children: CondNode[] }
  | { kind: "not"; child: CondNode }
  | { kind: "cmp"; varName: string; op: CmpOp; rhs: string; snippet: string }
  | { kind: "unknown"; snippet: string };   // 函式呼叫 / 解析不了的片段

// 比較葉節點：UPPER 欄位變數 + 比較運算子 + RHS（與 apfParse.isFieldName / evalSnippet 對齊）
const CMP_RE = /^([A-Z][A-Z0-9_]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/;

// ─── Lexer：切出結構（括號 / AND / OR / NOT）與 atom（比較子句）─────
type EvalToken =
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "and" }
  | { t: "or" }
  | { t: "not" }
  | { t: "atom"; text: string; hasFunc: boolean };  // hasFunc = 含函式呼叫 → 不可靜態評估

function lex(code: string): EvalToken[] {
  const out: EvalToken[] = [];
  const n = code.length;
  let i = 0;
  let buf = "";
  let bufHasFunc = false;

  const flush = (): void => {
    const text = buf.replace(/\s+/g, " ").trim();
    if (text) out.push({ t: "atom", text, hasFunc: bufHasFunc });
    buf = "";
    bufHasFunc = false;
  };

  while (i < n) {
    const c = code[i];

    if (c === '"') {                                   // 字串字面值 → 併入 atom（整段照抄）
      let j = i + 1;
      while (j < n && code[j] !== '"') { if (code[j] === "\\") j++; j++; }
      j++;
      buf += code.slice(i, Math.min(j, n));
      i = Math.min(j, n);
      continue;
    }
    if (c === "/" && code[i + 1] === "*") {            // 區塊註解 → 跳過
      i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "/" && code[i + 1] === "/") {            // 行註解 → 跳過
      i += 2;
      while (i < n && code[i] !== "\n") i++;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {                         // 識別字 / 關鍵字 / 函式名
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const upper = word.toUpperCase();

      // 結構關鍵字（先於函式判定，避免 NOT ( 被當成函式呼叫）
      if (upper === "AND" || upper === "OR" || upper === "NOT") {
        flush();
        out.push({ t: upper === "AND" ? "and" : upper === "OR" ? "or" : "not" });
        i = j;
        continue;
      }

      // 函式呼叫：識別字後接「(」→ 連同平衡括號整段併入 atom，標 hasFunc
      let k = j;
      while (k < n && /\s/.test(code[k])) k++;
      if (code[k] === "(") {
        let depth = 0;
        let p = k;
        for (; p < n; p++) {
          const pc = code[p];
          if (pc === '"') {                            // 跳過引數內的字串
            p++;
            while (p < n && code[p] !== '"') { if (code[p] === "\\") p++; p++; }
            continue;
          }
          if (pc === "(") depth++;
          else if (pc === ")") { depth--; if (depth === 0) { p++; break; } }
        }
        buf += code.slice(i, Math.min(p, n));
        bufHasFunc = true;
        i = Math.min(p, n);
        continue;
      }

      buf += word;                                     // 一般識別字（比較式的 LHS / RHS）
      i = j;
      continue;
    }
    if (c === "(") { flush(); out.push({ t: "lparen" }); i++; continue; }
    if (c === ")") { flush(); out.push({ t: "rparen" }); i++; continue; }

    buf += c;                                          // 運算子 / 數字 / 空白等 → atom 內容
    i++;
  }

  flush();
  return out;
}

// ─── Parser：遞迴下降，AND 綁定緊於 OR ───────────────────────
function atomToNode(tok: { text: string; hasFunc: boolean }): CondNode {
  if (tok.hasFunc) return { kind: "unknown", snippet: tok.text };
  const m = tok.text.match(CMP_RE);
  if (!m) return { kind: "unknown", snippet: tok.text };
  const [, varName, op, rhs] = m;
  return { kind: "cmp", varName, op: op as CmpOp, rhs: rhs.trim(), snippet: tok.text };
}

function parseTokens(tokens: EvalToken[]): CondNode {
  let pos = 0;
  const peek = (): EvalToken | undefined => tokens[pos];

  const parsePrimary = (): CondNode => {
    const tok = peek();
    if (!tok) return { kind: "unknown", snippet: "" };
    if (tok.t === "lparen") {
      pos++;
      const inner = parseOr();
      if (peek()?.t === "rparen") pos++;
      return inner;
    }
    if (tok.t === "atom") { pos++; return atomToNode(tok); }
    pos++;                                              // 落單的運算子 / rparen → 防禦性略過
    return { kind: "unknown", snippet: "" };
  };

  const parseNot = (): CondNode => {
    if (peek()?.t === "not") { pos++; return { kind: "not", child: parseNot() }; }
    return parsePrimary();
  };

  const parseAnd = (): CondNode => {
    const children = [parseNot()];
    while (peek()?.t === "and") { pos++; children.push(parseNot()); }
    return children.length === 1 ? children[0] : { kind: "and", children };
  };

  function parseOr(): CondNode {
    const children = [parseAnd()];
    while (peek()?.t === "or") { pos++; children.push(parseAnd()); }
    return children.length === 1 ? children[0] : { kind: "or", children };
  }

  return parseOr();
}

/** 解析一段條件文字成 CondNode AST。函式呼叫等無法靜態判定者 → unknown。 */
export function parseCond(cond: string): CondNode {
  const trimmed = cond.trim();
  if (!trimmed) return { kind: "unknown", snippet: "" };
  const tokens = lex(trimmed);
  if (tokens.length === 0) return { kind: "unknown", snippet: trimmed };
  return parseTokens(tokens);
}

// ─── 評估 ───────────────────────────────────────────────────
/** 單一比較：查不到變數值 → unknown。數值兩端皆可轉數字才走數值比較，否則字典序（與舊 evalSnippet 一致）。 */
function evalCmp(varName: string, op: CmpOp, rhsRaw: string, rv: Record<string, string>): FireState {
  const actual = rv[varName];
  if (actual === undefined) return "unknown";
  const rhs = rhsRaw.trim().replace(/^"(.*)"$/, "$1");
  const a = Number(actual), b = Number(rhs);
  const numeric = !Number.isNaN(a) && !Number.isNaN(b);
  let r: boolean;
  switch (op) {
    case "==": r = actual === rhs; break;
    case "!=": r = actual !== rhs; break;
    case ">":  r = numeric ? a > b  : actual > rhs;  break;
    case "<":  r = numeric ? a < b  : actual < rhs;  break;
    case ">=": r = numeric ? a >= b : actual >= rhs; break;
    case "<=": r = numeric ? a <= b : actual <= rhs; break;
    default:   return "unknown";
  }
  return r ? "yes" : "no";
}

/**
 * 三值邏輯評估某條件 AST：
 *   AND → 任一 child no 即 no；全 yes 才 yes；否則 unknown
 *   OR  → 任一 child yes 即 yes；全 no 才 no；否則 unknown
 *   NOT → yes↔no，unknown 維持
 *   cmp → 查不到變數值 → unknown
 */
export function evalCond(node: CondNode, rv: Record<string, string>): FireState {
  switch (node.kind) {
    case "cmp":
      return evalCmp(node.varName, node.op, node.rhs, rv);
    case "unknown":
      return "unknown";
    case "not": {
      const s = evalCond(node.child, rv);
      return s === "yes" ? "no" : s === "no" ? "yes" : "unknown";
    }
    case "and": {
      let allYes = true;
      for (const ch of node.children) {
        const s = evalCond(ch, rv);
        if (s === "no") return "no";
        if (s !== "yes") allYes = false;
      }
      return allYes ? "yes" : "unknown";
    }
    case "or": {
      let allNo = true;
      for (const ch of node.children) {
        const s = evalCond(ch, rv);
        if (s === "yes") return "yes";
        if (s !== "no") allNo = false;
      }
      return allNo ? "no" : "unknown";
    }
  }
}
