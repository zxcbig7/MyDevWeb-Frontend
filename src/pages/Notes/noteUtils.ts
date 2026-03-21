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
};

// ── 自動掃描（Vite import.meta.glob） ──────────────────────
// eager: true → build time 就打包進去，不需要動態 import
const RAW_MODULES = import.meta.glob<string>("../../notes/*.md", {
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
  // "../../notes/react-hooks.md" → "react-hooks"
  return path.replace(/.*\//, "").replace(/\.md$/, "");
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
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date)); // 新的在前
