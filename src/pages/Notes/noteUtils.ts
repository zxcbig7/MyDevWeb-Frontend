// ============================================================
// noteUtils.ts
// 自動掃描 src/notes/*.md，解析 frontmatter，產生文章清單
// ============================================================

export type NoteMeta = {
  slug: string;        // 衍生自檔名，用於 URL
  title: string;
  date: string;        // YYYY-MM-DD
  tags: string[];
  description: string;
};

export type NoteEntry = NoteMeta & {
  raw: string;         // 完整原始 Markdown（含 frontmatter）
  content: string;     // 去除 frontmatter 後的 Markdown
  links: string[];     // 此篇筆記透過 [[wikilink]] 連結到的其他筆記 slug
};

export type GraphNode = {
  id: string;
  name: string;
  val: number;   // 節點大小（依入連結數計算）
};

export type GraphLink = {
  source: string;
  target: string;
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

// ── 自動掃描（Vite import.meta.glob） ──────────────────────
// eager: true → build time 就打包進去，不需要動態 import
const RAW_MODULES = import.meta.glob<string>("../../notes/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// ── Frontmatter 解析 ────────────────────────────────────────
function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }
  return { meta, content: match[2] };
}

function parseTags(raw: string): string[] {
  // 支援 [React, TypeScript] 或 React, TypeScript 兩種格式
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function pathToSlug(path: string): string {
  // "../../notes/wiki/tech/entities/argocd.md" → "wiki/tech/entities/argocd"
  return path.replace(/^.*\/notes\//, "").replace(/\.md$/, "").replace(/\\/g, "/");
}

function extractWikilinks(content: string): string[] {
  const results: string[] = [];
  const regex = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

// ── 建立文章清單 ────────────────────────────────────────────
export const ALL_NOTES: NoteEntry[] = Object.entries(RAW_MODULES)
  .map(([path, raw]) => {
    const slug = pathToSlug(path);
    const { meta, content } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title ?? slug,
      date: meta.date ?? "",
      tags: meta.tags ? parseTags(meta.tags) : [],
      description: meta.description ?? "",
      raw,
      content,
      links: extractWikilinks(content),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date)); // 新的在前

// ── Graph 資料 ───────────────────────────────────────────────
export function buildGraphData(): GraphData {
  // wikilink target 是短名稱（如 "argocd"），slug 是完整路徑（如 "wiki/tech/entities/argocd"）
  // 建立 basename → slug 的對照表以支援兩種格式
  const basenameToSlug = new Map<string, string>();
  ALL_NOTES.forEach((note) => {
    const base = note.slug.split("/").pop()!;
    basenameToSlug.set(base, note.slug);
    basenameToSlug.set(note.slug, note.slug); // 也支援完整路徑
  });

  const resolveTarget = (target: string): string | undefined =>
    basenameToSlug.get(target) ?? basenameToSlug.get(target.toLowerCase());

  const incomingCount = new Map<string, number>();
  ALL_NOTES.forEach((note) => {
    note.links.forEach((target) => {
      const resolved = resolveTarget(target);
      if (resolved) incomingCount.set(resolved, (incomingCount.get(resolved) ?? 0) + 1);
    });
  });

  const nodes: GraphNode[] = ALL_NOTES.map((note) => ({
    id: note.slug,
    name: note.title,
    val: Math.max(1, incomingCount.get(note.slug) ?? 0) + 1,
  }));

  const links: GraphLink[] = [];
  ALL_NOTES.forEach((note) => {
    note.links.forEach((target) => {
      const resolved = resolveTarget(target);
      if (resolved && resolved !== note.slug) {
        links.push({ source: note.slug, target: resolved });
      }
    });
  });

  return { nodes, links };
}
