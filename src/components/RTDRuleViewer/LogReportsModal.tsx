// ============================================================
// LogReportsModal.tsx
// 一鍵全量反藍報告：迭代 graph.logs 全部 [$LOG$]，逐一 buildLogReport，
// 在獨立 Modal 內一張張翻閱（左側清單 + 上/下一張 + 複製單張 / 全部）。
// 報告只在「翻到那張」時才產（useMemo），避免一開窗就全量計算。
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { Modal } from "antd";
import type { RuleData, DepGraph } from "./types";
import { cn } from "../../utils/clsx";
import { buildLogReport } from "./depGraph";

export type LogReportsModalProps = {
  open: boolean;
  graph: DepGraph;
  rules: RuleData[];
  runtimeValues: Record<string, string>;
  onClose: () => void;
};

export function LogReportsModal({
  open,
  graph,
  rules,
  runtimeValues,
  onClose,
}: LogReportsModalProps) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState<"one" | "all" | null>(null);

  const logNames = useMemo(() => [...graph.logs.keys()].sort(), [graph]);
  const total = logNames.length;

  // 每次開窗回到第一張（graph 換 rule 時 index 也不會殘留越界）
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(0);
      setCopied(null);
    }
  }, [open]);

  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const currentLog = total > 0 ? logNames[safeIndex] : null;

  const rv = Object.keys(runtimeValues).length ? runtimeValues : undefined;
  // 當前這張的報告：翻到才產
  const report = useMemo(
    () => (open && currentLog ? buildLogReport(graph, rules, currentLog, rv) : ""),
    [open, currentLog, graph, rules, rv],
  );

  // 鍵盤翻頁：← / →（modal 內無輸入框，直接聽 window）
  useEffect(() => {
    if (!open || total === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(total - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, total]);

  const flashCopied = (kind: "one" | "all") => {
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyOne = () => {
    if (!report) return;
    navigator.clipboard.writeText(report).then(
      () => flashCopied("one"),
      () => {
        /* clipboard 失敗靜默 */
      },
    );
  };

  // 全部：一次迭代所有 log 各產一張，以分隔線串接（貼給 AI 可整包分析）
  const handleCopyAll = () => {
    if (total === 0) return;
    const all = logNames
      .map((name) => buildLogReport(graph, rules, name, rv))
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(all).then(
      () => flashCopied("all"),
      () => {
        /* clipboard 失敗靜默 */
      },
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={960}
      centered
      destroyOnHidden
      classNames={{ container: "!bg-slate-800 !p-0 overflow-hidden", body: "!p-0" }}
    >
      <div className="flex flex-col h-[76vh] text-white">
        {/* ── Header：標題 + 全部複製 + 關閉 ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 shrink-0">
          <span className="text-sm font-semibold">反藍追蹤報告</span>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {total} 張（迭代此 Rule 全部 [$LOG$]）
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleCopyAll}
              disabled={total === 0}
              title="迭代所有 [$LOG$] 各產一張報告，串成一包複製（貼給 AI 分析）"
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
                total === 0
                  ? "text-slate-500 border-white/10 bg-white/4 cursor-not-allowed"
                  : copied === "all"
                    ? "bg-green-500/20 text-green-300 border-green-500/40 cursor-pointer"
                    : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white cursor-pointer",
              )}
            >
              {copied === "all" ? "✓ 已複製全部" : "複製全部"}
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 cursor-pointer text-sm leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {total === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            此 Rule 沒有任何 [$LOG$]
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            {/* ── 左側：log 清單 ── */}
            <div className="w-56 shrink-0 border-r border-white/10 overflow-y-auto p-2 flex flex-col gap-0.5">
              {logNames.map((name, i) => (
                <button
                  key={name}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded text-left font-mono text-[11px] cursor-pointer transition-colors min-w-0",
                    i === safeIndex
                      ? "bg-red-500/15 text-red-300 border border-red-500/30"
                      : "text-slate-300 border border-transparent hover:bg-white/8 hover:text-white",
                  )}
                >
                  <span className="text-white/30 tabular-nums shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="truncate">
                    <span className="text-red-500/50">[$</span>
                    {name}
                    <span className="text-red-500/50">$]</span>
                  </span>
                </button>
              ))}
            </div>

            {/* ── 右側：一張張報告 + 翻頁工具列 ── */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
                <button
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={safeIndex === 0}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] border transition-colors",
                    safeIndex === 0
                      ? "text-slate-500 border-white/10 bg-white/4 cursor-not-allowed"
                      : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white cursor-pointer",
                  )}
                >
                  ‹ 上一張
                </button>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {safeIndex + 1} / {total}
                </span>
                <button
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  disabled={safeIndex === total - 1}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] border transition-colors",
                    safeIndex === total - 1
                      ? "text-slate-500 border-white/10 bg-white/4 cursor-not-allowed"
                      : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white cursor-pointer",
                  )}
                >
                  下一張 ›
                </button>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  ← → 鍵盤翻頁
                </span>
                <button
                  onClick={handleCopyOne}
                  title="複製這一張報告"
                  className={cn(
                    "ml-auto px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors",
                    copied === "one"
                      ? "bg-green-500/20 text-green-300 border-green-500/40"
                      : "bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {copied === "one" ? "✓ 已複製" : "複製此張"}
                </button>
              </div>
              <pre className="flex-1 min-h-0 overflow-auto m-0 px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap wrap-break-word bg-slate-900/60">
                {report}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
