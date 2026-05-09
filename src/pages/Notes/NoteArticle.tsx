// ============================================================
// NoteArticle.tsx — 單篇筆記頁（Markdown 渲染）
// ============================================================

import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { ALL_NOTES } from "./noteUtils";

// basename → 完整 slug 對照表（同 buildGraphData 的邏輯）
const basenameToSlug = new Map<string, string>();
ALL_NOTES.forEach((note) => {
  const base = note.slug.split("/").pop()!;
  basenameToSlug.set(base, note.slug);
  basenameToSlug.set(note.slug, note.slug);
});

// 將 [[target]] / [[target|alias]] 轉換成標準 Markdown 連結
function preprocessWikilinks(content: string): string {
  return content.replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
    const key = target.trim();
    const resolved = basenameToSlug.get(key) ?? basenameToSlug.get(key.toLowerCase()) ?? key.toLowerCase().replace(/\s+/g, "-");
    const label = alias?.trim() ?? key;
    return `[${label}](/notes/${resolved})`;
  });
}

export default function NoteArticle() {
  const params = useParams();
  const slug = params["*"] ?? "";
  const navigate = useNavigate();

  const note = ALL_NOTES.find((n) => n.slug === slug);

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 text-sm">找不到這篇筆記</p>
          <button
            onClick={() => navigate("/notes")}
            className="mt-4 text-xs text-blue-500 hover:underline"
          >
            回到列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* 返回按鈕 */}
        <button
          onClick={() => navigate("/notes")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          開發筆記
        </button>

        {/* 文章 Header */}
        <div className="mb-8">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800 leading-snug">{note.title}</h1>
          {note.description && (
            <p className="text-sm text-slate-500 mt-2">{note.description}</p>
          )}
          {note.date && (
            <p className="text-xs text-slate-400 mt-2">{note.date}</p>
          )}
        </div>

        {/* Markdown 內容 */}
        <article className="prose prose-slate max-w-none
          prose-headings:font-bold prose-headings:text-slate-800
          prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-slate-600 prose-p:leading-7 prose-p:my-3
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-800
          prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-white prose-pre:border prose-pre:border-slate-200 prose-pre:rounded-xl prose-pre:shadow-sm prose-pre:p-0 prose-pre:overflow-hidden
          prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-inherit prose-pre:prose-code:p-0
          prose-ul:text-slate-600 prose-li:my-1
          prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:text-slate-600
          prose-table:text-sm prose-th:bg-slate-100 prose-th:text-slate-700
          bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith("/notes/")) {
                  return (
                    <Link to={href} className="text-indigo-600 hover:underline">
                      {children}
                    </Link>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {preprocessWikilinks(note.content)}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => navigate("/notes")}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← 回到列表
          </button>
        </div>

      </div>
    </div>
  );
}
