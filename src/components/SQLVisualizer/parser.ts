import type { ParsedStatement, SqlAnalysis, StmtType, JoinRelation } from "./types";

function removeComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

// Block-aware statement splitter
// 追蹤 FOR...LOOP / BEGIN / IF THEN 等 block 深度，
// 只在 depth=0 時的 ; 才切割 statement，支援任意巢狀
function splitStatements(sql: string): { text: string; startLine: number; endLine: number }[] {
  const parts: { text: string; startLine: number; endLine: number }[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let depth = 0;
  let lineNo = 1;
  let stmtStart = 1;

  const peekKeyword = (i: number): string => {
    let w = "";
    while (i < sql.length && /\w/.test(sql[i])) w += sql[i++].toUpperCase();
    return w;
  };

  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];

    if (ch === "\n") lineNo++;

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

    if (ch === ";") {
      if (depth === 0) {
        const text = current.trim();
        if (text) parts.push({ text, startLine: stmtStart, endLine: lineNo });
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
  if (/^SELECT\b/.test(s))  return "SELECT";
  if (/^INSERT\b/.test(s))  return "INSERT";
  if (/^UPDATE\b/.test(s))  return "UPDATE";
  if (/^DELETE\b/.test(s))  return "DELETE";
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

  const skip = new Set(["WHERE", "SELECT", "HAVING", "ON", "SET", "VALUES", "DUAL", "INTO"]);
  for (const fm of upper.matchAll(/\bFROM\s+(\w+)/g)) {
    const t = cleanTableName(fm[1]);
    if (!skip.has(t) && t.length > 1) tables.push(t);
  }

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

  const whereM = raw.match(
    /\bWHERE\b([\s\S]+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bHAVING\b|\bLIMIT\b|\bRETURNING\b|$)/i
  );
  if (whereM) {
    conditions.push(
      ...whereM[1].trim()
        .split(/\b(?:AND|OR)\b/i)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 20)
    );
  }

  for (const cm of raw.matchAll(/CASE\b[\s\S]+?\bEND\b/gi)) {
    caseClauses.push(cm[0].replace(/\s+/g, " ").trim().substring(0, 300));
  }

  return {
    index,
    type,
    raw: raw.trim(),
    brief: raw.replace(/\s+/g, " ").trim().substring(0, 100),
    tables: [...new Set(tables)],
    targetTable,
    joins,
    conditions,
    caseClauses,
    startLine,
    endLine,
  };
}

export function parseSql(sql: string): SqlAnalysis {
  const cleaned = removeComments(sql);
  const rawStmts = splitStatements(cleaned);

  const statements: ParsedStatement[] = [];
  const tableStats: SqlAnalysis["tableStats"] = {};
  let totalSelect = 0, totalInsert = 0, totalUpdate = 0,
      totalDelete = 0, totalTruncate = 0, totalForLoop = 0;

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
      } else if (["INSERT", "UPDATE", "DELETE"].includes(s.type) && t === s.targetTable) {
        tableStats[t].writeCount++;
      } else {
        tableStats[t].readCount++;
      }
    });
  }

  const joinSet = new Map<string, { left: string; right: string; type: string }>();
  for (const s of statements) {
    for (const j of s.joins) {
      const key = [j.leftTable, j.rightTable].sort().join("|");
      if (!joinSet.has(key))
        joinSet.set(key, { left: j.leftTable, right: j.rightTable, type: j.joinType });
    }
  }

  return {
    statements, tableStats, allJoins: [...joinSet.values()],
    totalSelect, totalInsert, totalUpdate, totalDelete, totalTruncate, totalForLoop,
  };
}
