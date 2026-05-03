// ============================================================
// RuleViewer.tsx
// 主入口元件：Canvas + 右側面板（搜尋 / Tracker 分頁）
// ============================================================

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Divider, notification } from "antd";
import type { RuleViewHandle } from "./types";
import { cn } from "../../utils/clsx";
import * as RTDAPI from "./api";
import { convertDtosToData } from "./dataTransform";
import { RuleView } from "./RuleView";
import { RuleDropdownSearch } from "./RuleDropdownSearch";
import { type MatchResult, RuleContentSearch, SearchNavigator } from "./RuleContentSearch";
import { CaseQuery } from "./CaseQuery";

type RightTab = "search" | "tracker";

// Defined outside component — pure function, no closure over state
function highlightSnippet(snippet: string, kw: string) {
  if (!kw) return <span>{snippet}</span>;
  const idx = snippet.toLowerCase().indexOf(kw.toLowerCase());
  if (idx === -1) return <span>{snippet}</span>;
  return (
    <>
      {snippet.slice(0, idx)}
      <span className="text-yellow-300 font-semibold">{snippet.slice(idx, idx + kw.length)}</span>
      {snippet.slice(idx + kw.length)}
    </>
  );
}

export default function RuleViewer() {
  // ── 錯誤通知 ─────────────────────────────────────────────
  const [notifApi, notifCtx] = notification.useNotification();

  // ── 選擇狀態 ──────────────────────────────────────────────
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  // 最後一次實際載入時的 Phase，與 selectedPhase 不同步（切換 Phase 不影響它）
  const [loadedPhase, setLoadedPhase] = useState<string | null>(null);

  // ── SWR 資料讀取 ──────────────────────────────────────────
  const { data: phaseDTOs, error: phaseError }   = RTDAPI.usePhaseResponse();
  const { data: eqpRules,  error: eqpError }     = RTDAPI.useEQPRuleResponse(selectedPhase);
  const { data: ruleInfoDTOs, error: ruleInfoError } = RTDAPI.useRuleInfoResponse(selectedPhase, selectedRule);

  const phases = useMemo(() => phaseDTOs?.map((p) => p.PHASE) ?? [], [phaseDTOs]);
  const rules  = useMemo(() => convertDtosToData(ruleInfoDTOs ?? []), [ruleInfoDTOs]);

  // ── SWR 錯誤通知（合併為單一 effect） ────────────────────
  useEffect(() => {
    if (phaseError)    notifApi.error({ title: "無法載入 Phase 清單",    description: phaseError.message,    placement: "topRight", duration: 5, key: "phaseError" });
    if (eqpError)      notifApi.error({ title: "無法載入 EQP / Rule 清單", description: eqpError.message,    placement: "topRight", duration: 5, key: "eqpError" });
    if (ruleInfoError) notifApi.error({ title: "無法載入 Rule 資料",      description: ruleInfoError.message, placement: "topRight", duration: 5, key: "ruleError" });
  }, [phaseError, eqpError, ruleInfoError]);

  // ── Block 搜尋 ────────────────────────────────────────────
  const [matchedBlockList, setMatchedBlockList] = useState<MatchResult[] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [searchKey, setSearchKey] = useState(0);

  // ── 搜尋選中 Block ────────────────────────────────────────
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // ── Tracker 高亮 ──────────────────────────────────────────
  const [trackerLogIds, setTrackerLogIds] = useState<string[]>([]);
  const [trackerVarIds, setTrackerVarIds] = useState<string[]>([]);

  const ruleViewRef = useRef<RuleViewHandle | null>(null);

  const matchedBlockIds = useMemo(() => {
    if (!matchedBlockList) return null;
    return new Set(matchedBlockList.map((m) => m.id));
  }, [matchedBlockList]);

  // Memoized Sets — prevent creating new Set object on every render
  const trackerLogIdsSet = useMemo(
    () => (trackerLogIds.length ? new Set(trackerLogIds) : undefined),
    [trackerLogIds],
  );
  const trackerVarIdsSet = useMemo(
    () => (trackerVarIds.length ? new Set(trackerVarIds) : undefined),
    [trackerVarIds],
  );

  // ── Icon 版本切換 ─────────────────────────────────────────
  const [useNewIcons, setUseNewIcons] = useState(true);

  // ── 右側面板寬度 / 收合 / 分頁 ───────────────────────────
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("search");
  const dividerDragRef = useRef({ dragging: false, startX: 0, startW: 300 });

  // 右側面板拖曳調整寬度
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dividerDragRef.current.dragging) return;
      const dx = dividerDragRef.current.startX - e.clientX;
      // 限制最小寬度 220，最大寬度 1000
      const newW = Math.max(220, Math.min(1000, dividerDragRef.current.startW + dx));
      setRightPanelWidth(newW);
    }
    function onMouseUp() {
      if (!dividerDragRef.current.dragging) return;
      dividerDragRef.current.dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Rule 變更：重置搜尋 / Tracker 狀態
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchedBlockList(null);
    setSearchKeyword("");
    setMatchIndex(0);
    setSelectedBlockId(null);
    setSearchKey((k) => k + 1);
    setTrackerLogIds([]);
    setTrackerVarIds([]);
  }, [selectedRule]);

  // ── 搜尋導覽 handlers ─────────────────────────────────────
  const handlePrev = useCallback(() => {
    if (!matchedBlockList?.length) return;
    const next = Math.max(0, matchIndex - 1);
    setMatchIndex(next);
    ruleViewRef.current?.focusBlockById(matchedBlockList[next].id);
  }, [matchedBlockList, matchIndex]);

  const handleNext = useCallback(() => {
    if (!matchedBlockList?.length) return;
    const next = Math.min(matchedBlockList.length - 1, matchIndex + 1);
    setMatchIndex(next);
    ruleViewRef.current?.focusBlockById(matchedBlockList[next].id);
  }, [matchedBlockList, matchIndex]);

  const handlePick = useCallback((i: number) => {
    if (!matchedBlockList) return;
    setMatchIndex(i);
    setSelectedBlockId(matchedBlockList[i].id);
    ruleViewRef.current?.focusBlockById(matchedBlockList[i].id);
  }, [matchedBlockList]);

  // ── Prop handlers ─────────────────────────────────────────
  const handlePhaseChange = useCallback((phase: string) => {
    setSelectedPhase(phase);
    setSelectedRule(null);
    setLoadedPhase(null);
  }, []);

  const handleRuleSelect = useCallback((ruleName: string) => {
    if (ruleName !== selectedRule) {
      setSelectedRule(ruleName);
      setLoadedPhase(selectedPhase);
    }
  }, [selectedRule, selectedPhase]);

  const handleMatchChange = useCallback((list: MatchResult[], kw: string) => {
    setMatchedBlockList(list);
    setSearchKeyword(kw);
    setMatchIndex(0);
  }, []);

  const handleHighlight = useCallback((logIds: string[], varIds: string[]) => {
    setTrackerLogIds(logIds);
    setTrackerVarIds(varIds);
  }, []);

  const handleTabChange = useCallback((tab: RightTab) => {
    if (tab !== "search" && rightTab === "search") {
      setMatchedBlockList(null);
      setSearchKeyword("");
      setMatchIndex(0);
      setSelectedBlockId(null);
      setSearchKey((k) => k + 1);
    }
    setRightTab(tab);
  }, [rightTab]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 p-3">
      {notifCtx}

      {/* ── TopBar：Rule 選擇 ── */}
      <div className="rounded-xl px-4 py-2.5 bg-slate-800 flex items-center gap-3 shrink-0">
        <RuleDropdownSearch
          phases={phases}
          eqpRules={eqpRules ?? []}
          selectedPhase={selectedPhase}
          onPhaseChange={handlePhaseChange}
          onRuleSelect={handleRuleSelect}
        />

        {/* ── 當前載入的 Rule 麵包屑 ── */}
        {selectedRule && (
          <div className="flex items-center gap-1.5 text-xs pl-3 border-l border-white/15 min-w-0">
            <span className="text-slate-400 shrink-0">{loadedPhase}</span>
            <span className="text-white/30 shrink-0">/</span>
            <span className="text-white font-semibold font-mono truncate max-w-50">{selectedRule}</span>
          </div>
        )}

        <div className="ml-auto shrink-0 flex items-center text-xs rounded border border-white/15 bg-white/5 p-0.5 gap-0.5">
          <button
            onClick={() => setUseNewIcons(true)}
            className={cn("px-3 py-1 rounded cursor-pointer transition-colors", useNewIcons ? "bg-white/20 text-white font-semibold" : "text-slate-500 hover:text-slate-300")}
          >New Icon</button>
          <button
            onClick={() => setUseNewIcons(false)}
            className={cn("px-3 py-1 rounded cursor-pointer transition-colors", !useNewIcons ? "bg-white/20 text-white font-semibold" : "text-slate-500 hover:text-slate-300")}
          >Old Icon</button>
        </div>
      </div>

      {/* ── 主體：Canvas + 右側面板 ── */}
      <div className="flex-1 min-h-0 flex">

        {/* Canvas */}
        <div className="flex-1 min-w-0 rounded-xl bg-white border border-black/12 relative overflow-hidden">
          <RuleView
            ref={ruleViewRef}
            rules={rules}
            matchedBlockIds={matchedBlockIds}
            selectedBlockId={selectedBlockId}
            trackerLogIds={trackerLogIdsSet}
            trackerVarIds={trackerVarIdsSet}
            useNewIcons={useNewIcons}
          />
        </div>

        {/* 拖曳分隔線（收合時不可見） */}
        <div
          className={cn("w-2 shrink-0 mx-1 flex items-center justify-center cursor-col-resize select-none group self-stretch", rightCollapsed && "invisible")}
          onMouseDown={(e) => {
            if (rightCollapsed) return;
            e.preventDefault();
            dividerDragRef.current.dragging = true;
            dividerDragRef.current.startX = e.clientX;
            dividerDragRef.current.startW = rightPanelWidth;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-0.5 h-6 rounded-full bg-white/25 group-hover:bg-white/60 transition-colors" />
            <div className="flex flex-col gap-0.75 opacity-30 group-hover:opacity-70 transition-opacity">
              <div className="w-0.75 h-0.75 rounded-full bg-white" />
              <div className="w-0.75 h-0.75 rounded-full bg-white" />
              <div className="w-0.75 h-0.75 rounded-full bg-white" />
            </div>
            <div className="w-0.5 h-6 rounded-full bg-white/25 group-hover:bg-white/60 transition-colors" />
          </div>
        </div>

        {/* 右側面板（始終掛載，收合時僅顯示展開按鈕） */}
        <div
          className={cn("shrink-0 rounded-xl bg-slate-900 border border-black/12 text-white flex flex-col min-h-0 overflow-hidden", !rightCollapsed && "p-3")}
          style={{ width: rightCollapsed ? 32 : rightPanelWidth }}
        >
          {/* 收合狀態：僅展開按鈕 */}
          <div className={rightCollapsed ? "flex flex-col items-center py-2" : "hidden"}>
            <button
              onClick={() => setRightCollapsed(false)}
              title="展開面板"
              className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 cursor-pointer text-base leading-none"
            >
              ‹
            </button>
          </div>

          {/* 展開狀態：完整面板內容 */}
          <div className={rightCollapsed ? "hidden" : "flex-1 min-h-0 flex flex-col"}>

            {/* 分頁標頭 */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex gap-0.5">
                {(["search", "tracker"] as RightTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={cn("px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors", rightTab === tab
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/7"
                    )}
                  >
                    {tab === "search" ? "Viewer" : "Tracker"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setRightCollapsed(true)}
                title="收合面板"
                className="w-6 h-6 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 cursor-pointer text-base leading-none shrink-0"
              >
                ›
              </button>
            </div>

            <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />

            {/* ── 搜尋分頁 ── */}
            <div className={rightTab === "search" ? "flex-1 min-h-0 flex flex-col gap-2" : "hidden"}>

              {/* 搜尋列 */}
              <div className="shrink-0">
                <RuleContentSearch
                  key={searchKey}
                  rules={rules}
                  onMatchChange={handleMatchChange}
                />
              </div>

              {/* 導覽列 + 結果數 */}
              {matchedBlockList && (
                <div className="flex items-center gap-2 shrink-0">
                  <SearchNavigator
                    total={matchedBlockList.length}
                    index={matchIndex}
                    onPrev={handlePrev}
                    onNext={handleNext}
                  />
                  <span className="ml-auto text-xs text-slate-400 shrink-0">
                    {matchedBlockList.length} match{matchedBlockList.length !== 1 ? "es" : ""}
                  </span>
                </div>
              )}

              {/* 結果列表 */}
              <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-1.5">
                {!selectedRule && (
                  <p className="text-slate-400 text-xs">請先選擇 Rule。</p>
                )}
                {selectedRule && !matchedBlockList && (
                  <p className="text-slate-400 text-xs">在上方輸入關鍵字，搜尋相關 Block。</p>
                )}
                {matchedBlockList?.length === 0 && (
                  <p className="text-slate-400 text-xs">No matches found.</p>
                )}
                {matchedBlockList?.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => handlePick(i)}
                    onDoubleClick={() => ruleViewRef.current?.openInspectorById(m.id)}
                    className={cn("text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors", i === matchIndex
                      ? "border-green-500/50 bg-green-500/10 text-white"
                      : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8"
                    )}
                  >
                    <div className="font-semibold truncate">
                      <span className="text-white/40 mr-1.5">{i + 1}.</span>
                      {m.id}
                    </div>
                    {m.snippet && (
                      <div className="mt-0.5 text-[10px] text-white/50 truncate">
                        {highlightSnippet(m.snippet, searchKeyword)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tracker 分頁 ── */}
            <div className={rightTab === "tracker" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
              <CaseQuery
                key={selectedRule}
                rules={rules}
                selectedRule={selectedRule}
                onHighlight={handleHighlight}
              />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
