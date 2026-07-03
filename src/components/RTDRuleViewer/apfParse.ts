// ============================================================
// apfParse.ts
// APF DSL 共用解析層：tokenizer + clause 切分 + 變數萃取
//   - tokenize      : 語法上色用的粗顆粒 token（搬自 BlockInspector）
//   - parseAPF      : 切成 IF…THEN…result / 終端 ELSE result 的 clauses
//   - extractVars   : 從一段文字抓 UPPER 欄位變數（跳過字串 / 註解 / $log$ / 函式名）
// spec: specs/2026-06-07-tracker-dep-graph.md
// ============================================================

import type { DepRef } from "./types";

// ─── Tokenizer（語法上色共用）───────────────────────────────
export type TokenType = "comment" | "string" | "keyword" | "function" | "variable" | "text";
export type Token = { type: TokenType; text: string };

// group1: string
// group2/3: comment  group4: keyword  group5: function call  group6: $marker  group7: text
export const HIGHLIGHT_RE =
  /("(?:[^"\\]|\\.)*")|(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)|(\b(?:IF|ELSE|THEN|OR|AND)\b)|(\b[A-Za-z_]\w*(?=\s*\())|(\$[^\s"]+)|([^\s"]+)/g;

export function tokenize(code: string): Token[] {
  const result: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  HIGHLIGHT_RE.lastIndex = 0;

  while ((m = HIGHLIGHT_RE.exec(code)) !== null) {
    if (m.index > last) result.push({ type: "text", text: code.slice(last, m.index) });
    if (m[1])      result.push({ type: "string",   text: m[1] });
    else if (m[2]) result.push({ type: "comment",  text: m[2] });
    else if (m[3]) result.push({ type: "comment",  text: m[3] });
    else if (m[4]) result.push({ type: "keyword",  text: m[4] });
    else if (m[5]) result.push({ type: "function", text: m[5] });
    else if (m[6]) result.push({ type: "variable", text: m[6] });
    else           result.push({ type: "text",     text: m[7]! });
    last = HIGHLIGHT_RE.lastIndex;
  }

  if (last < code.length) result.push({ type: "text", text: code.slice(last) });
  return result;
}

// ─── Clause 切分 ────────────────────────────────────────────
// APF 結構：IF cond THEN result (ELSE IF cond THEN result)* (ELSE result)?
//   when : 由 THEN 錨定，cond = 最近的前置 IF…THEN，result = THEN…下一個 ELSE/結尾
//   else : 終端 ELSE（後面不接 IF）的 result
// 用 tokenize 取結構關鍵字（IF/THEN/ELSE；AND/OR 屬條件內容不計），自動跳過字串 / 註解內的關鍵字。
export type Clause = {
  kind: "when" | "else";
  cond: string;                    // when 的條件原文；else 為空字串
  result: string;                  // 結果原文
  condRange: [number, number] | null;
  resultRange: [number, number];
};

type Kw = { text: string; start: number; end: number };

function structuralKeywords(code: string): Kw[] {
  const kws: Kw[] = [];
  let pos = 0;
  for (const tok of tokenize(code)) {
    if (tok.type === "keyword" && (tok.text === "IF" || tok.text === "THEN" || tok.text === "ELSE")) {
      kws.push({ text: tok.text, start: pos, end: pos + tok.text.length });
    }
    pos += tok.text.length;
  }
  return kws;
}

const trimRange = (code: string, a: number, b: number): [number, number] => {
  while (a < b && /\s/.test(code[a])) a++;
  while (b > a && /\s/.test(code[b - 1])) b--;
  return [a, b];
};

export function parseAPF(code: string): Clause[] {
  const kws = structuralKeywords(code);
  const clauses: Clause[] = [];

  for (let i = 0; i < kws.length; i++) {
    const kw = kws[i];

    if (kw.text === "THEN") {
      // 往前找最近的 IF（此 clause 條件開頭）
      let ifKw: Kw | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (kws[j].text === "IF") { ifKw = kws[j]; break; }
      }
      if (!ifKw) continue;
      // 結果延伸到下一個結構關鍵字（ELSE / IF）或結尾
      const resultEnd = i + 1 < kws.length ? kws[i + 1].start : code.length;
      const [ca, cb] = trimRange(code, ifKw.end, kw.start);
      const [ra, rb] = trimRange(code, kw.end, resultEnd);
      clauses.push({
        kind: "when",
        cond: code.slice(ca, cb),
        result: code.slice(ra, rb),
        condRange: [ca, cb],
        resultRange: [ra, rb],
      });
    } else if (kw.text === "ELSE") {
      // 終端 ELSE：後面緊接的結構關鍵字不是 IF（或已到結尾）→ 這個 ELSE 帶 result
      const next = i + 1 < kws.length ? kws[i + 1] : null;
      if (next && next.text === "IF") continue; // ELSE IF：交給該 IF 的 THEN 處理
      const resultEnd = next ? next.start : code.length;
      const [ra, rb] = trimRange(code, kw.end, resultEnd);
      clauses.push({
        kind: "else",
        cond: "",
        result: code.slice(ra, rb),
        condRange: null,
        resultRange: [ra, rb],
      });
    }
  }

  return clauses;
}

// ─── 變數萃取 ───────────────────────────────────────────────
const KEYWORDS = new Set([
  "IF", "THEN", "ELSE", "AND", "OR", "NOT", "IN", "IS",
  "NULL", "TRUE", "FALSE", "SYSDATE", "TODAY",
]);

const isIdentStart = (c: string): boolean => /[A-Za-z_]/.test(c);
const isIdentPart = (c: string): boolean => /[A-Za-z0-9_]/.test(c);
// 欄位變數命名：UPPER_SNAKE，長度 ≥ 2（排除單字母、避免誤抓）
const isFieldName = (w: string): boolean => /^[A-Z][A-Z0-9_]+$/.test(w);

/** 取此變數的子條件，如 "HOLD_COUNT > 10"；無比較運算子則回變數名本身 */
function snippetFor(text: string, start: number, identEnd: number): string {
  let k = identEnd;
  while (k < text.length && /\s/.test(text[k])) k++;
  const op = text.slice(k).match(/^(==|!=|>=|<=|>|<)/);
  if (!op) return text.slice(start, identEnd);
  k += op[0].length;
  while (k < text.length && /\s/.test(text[k])) k++;
  let end: number;
  if (text[k] === '"') {
    let m = k + 1;
    while (m < text.length && text[m] !== '"') { if (text[m] === "\\") m++; m++; }
    end = Math.min(m + 1, text.length);
  } else {
    let m = k;
    while (m < text.length && /[A-Za-z0-9_.]/.test(text[m])) m++;
    end = m;
  }
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

/**
 * 從一段表達式文字萃取所有 UPPER 欄位變數（同名去重，保留首次出現的 snippet）。
 * 跳過：字串字面值、區塊 / 行註解、$...$ log 標記、函式名（識別字後接「(」）、APF 關鍵字。
 * 函式參數內的變數仍會被抓到（如 COUNT(HOLD_FLAG, 5) → HOLD_FLAG）。
 */
export function extractVars(text: string, role: "cond" | "result"): DepRef[] {
  const found = new Map<string, DepRef>();
  const n = text.length;
  let i = 0;

  while (i < n) {
    const c = text[i];

    if (c === '"') {                                   // 字串
      i++;
      while (i < n && text[i] !== '"') { if (text[i] === "\\") i++; i++; }
      i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {            // 區塊註解
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {            // 行註解
      i += 2;
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (c === "$") {                                   // log 標記：跳到對應的第二個 $（[$NAME$…] 一律成對）
      i++;
      while (i < n && text[i] !== "$") i++;
      i++;
      continue;
    }
    if (isIdentStart(c)) {                             // 識別字
      let j = i + 1;
      while (j < n && isIdentPart(text[j])) j++;
      const word = text.slice(i, j);
      let k = j;
      while (k < n && /\s/.test(text[k])) k++;
      const isFunc = text[k] === "(";
      if (!isFunc && !KEYWORDS.has(word) && isFieldName(word) && !found.has(word)) {
        found.set(word, { varName: word, role, snippet: snippetFor(text, i, j) });
      }
      i = j;
      continue;
    }
    i++;
  }

  return [...found.values()];
}
