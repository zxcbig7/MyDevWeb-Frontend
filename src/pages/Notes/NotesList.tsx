// ============================================================
// NotesList.tsx — 開發筆記列表頁
// ============================================================

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ALL_NOTES } from "./noteUtils";
import { cn } from "../../utls/clsx";

export default function NotesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 所有 tag（去重）
  const allTags = useMemo(() => {
    const set = new Set<string>();
    ALL_NOTES.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, []);

  // 篩選
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return ALL_NOTES.filter((n) => {
      const matchTag = !activeTag || n.tags.includes(activeTag);
      const matchSearch =
        !kw ||
        n.title.toLowerCase().includes(kw) ||
        n.description.toLowerCase().includes(kw) ||
        n.tags.some((t) => t.toLowerCase().includes(kw));
      return matchTag && matchSearch;
    });
  }, [search, activeTag]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">開發筆記</h1>
          <p className="text-sm text-slate-400 mt-1">
            {ALL_NOTES.length} 篇 · 把學到的東西寫下來
          </p>
        </div>

        {/* 搜尋 + Tag 篩選 */}
        <div className="flex flex-col gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋標題、描述、標籤…"
            className="w-full h-9 px-4 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 transition-colors"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  !activeTag
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
                )}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    activeTag === tag
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 文章列表 */}
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400">找不到符合的筆記。</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((note) => (
              <button
                key={note.slug}
                onClick={() => navigate(`/notes/${note.slug}`)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                    {note.title}
                  </h2>
                  {note.date && (
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">{note.date}</span>
                  )}
                </div>
                {note.description && (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{note.description}</p>
                )}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
