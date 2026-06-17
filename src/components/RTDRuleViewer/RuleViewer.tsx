// ============================================================
// RuleViewer.tsx
// 主入口元件：Canvas + 右側面板（搜尋 / Tracker 分頁）
// ============================================================

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { Divider, notification } from "antd";
import type { InputRef } from "antd";
import { useSearchParams } from "react-router-dom";
import type { RuleViewHandle, TrackerMode } from "./types";
import { cn } from "../../utils/clsx";
import * as RTDAPI from "./api";
import { convertDtosToData } from "./dataTransform";
import { buildDepGraph, computeTrace, computeImpact } from "./depGraph";
import { RuleView } from "./RuleView";
import { RuleDropdownSearch } from "./RuleDropdownSearch";
import { type MatchResult, RuleContentSearch } from "./RuleContentSearch";
import { CaseQuery } from "./CaseQuery";

type RightTab = "search" | "tracker" | "helper";

// 命中欄位標籤（顏色對應 RuleContentSearch.MatchField）
const FIELD_TAG: Record<MatchResult["field"], { label: string; cls: string }> = {
  name: { label: "NAME", cls: "text-sky-300 bg-sky-400/10 border-sky-400/25" },
  value: { label: "VALUE", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
  col: { label: "COL", cls: "text-amber-300 bg-amber-400/10 border-amber-400/25" },
  ref: { label: "REF", cls: "text-violet-300 bg-violet-400/10 border-violet-400/25" },
  key: { label: "KEY", cls: "text-rose-300 bg-rose-400/10 border-rose-400/25" },
};

// Defined outside component — pure function, no closure over state
// 標出 snippet 內「所有」keyword 出現處（非只第一處）
function highlightSnippet(snippet: string, kw: string) {
  if (!kw) return <span>{snippet}</span>;
  const low = snippet.toLowerCase();
  const k = kw.toLowerCase();
  let idx = low.indexOf(k);
  if (idx === -1) return <span>{snippet}</span>;

  const parts: ReactNode[] = [];
  let i = 0;
  let n = 0;
  while (idx !== -1) {
    if (idx > i) parts.push(snippet.slice(i, idx));
    parts.push(
      <span
        key={n++}
        className="text-yellow-300 font-semibold bg-yellow-300/15 rounded-sm"
      >
        {snippet.slice(idx, idx + k.length)}
      </span>,
    );
    i = idx + k.length;
    idx = low.indexOf(k, i);
  }
  if (i < snippet.length) parts.push(snippet.slice(i));
  return <>{parts}</>;
}

// (VAR: value) → { VAR: value }（runtime log 解析；runtimeValues 的單一來源）
function parseRuntimeLog(log: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /\((\w+):\s*([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(log)) !== null) result[m[1].trim()] = m[2].trim();
  return result;
}

// runtimeValues → (VAR: value) 文字（樹上/chips 改值後回寫貼上框，保持兩邊同步）
function serializeRuntimeValues(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `(${k}: ${v})`)
    .join(" ");
}

export default function RuleViewer() {
  // ── 錯誤通知 ─────────────────────────────────────────────
  const [notifApi, notifCtx] = notification.useNotification();

  // ── URL deep link（spec ②）─────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();

  // ── 選擇狀態 ──────────────────────────────────────────────
  // FAB 為最外層維度（route /api/{fab}/...）；未選 FAB → 下游 hook 全不打 API。
  // 不預設選取：需使用者主動選 fab。F01/F02/F03 回相同資料，選任一即可載到 phase。
  const [selectedFab, setSelectedFab] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  // selection（上方）vs loaded（下方）分離：dropdown 只改 selection；
  // 只有按「載入」才把 selection 提交成 loaded → dropdown 操作不會清掉已載入的 rule 資料。
  const [loadedFab, setLoadedFab] = useState<string | null>(null);
  const [loadedPhase, setLoadedPhase] = useState<string | null>(null);
  const [loadedRule, setLoadedRule] = useState<string | null>(null);

  // ── SWR 資料讀取 ──────────────────────────────────────────
  const {
    data: phaseDTOs,
    error: phaseError,
    isLoading: phasesLoading,
  } = RTDAPI.usePhaseResponse(selectedFab);
  const {
    data: eqpRules,
    error: eqpError,
    isLoading: eqpLoading,
  } = RTDAPI.useEQPRuleResponse(selectedFab, selectedPhase);
  const {
    data: ruleInfoDTOs,
    error: ruleInfoError,
    isLoading: ruleInfoLoading,
  } = RTDAPI.useRuleInfoResponse(loadedFab, loadedPhase, loadedRule);

  // 按「載入」時 +1 → 強制 RuleView 重建 blocks（block 位置回原始 POSX/POSY）
  const [layoutVersion, setLayoutVersion] = useState(0);

  const phases = useMemo(
    () => phaseDTOs?.map((p) => p.PHASE) ?? [],
    [phaseDTOs],
  );
  const rules = useMemo(
    () => convertDtosToData(ruleInfoDTOs ?? []),
    [ruleInfoDTOs],
  );

  const claimTime = useMemo(() => {
    const raw = ruleInfoDTOs?.find((d) => d.CLAIM_TIME)?.CLAIM_TIME;
    if (!raw) return null;
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [ruleInfoDTOs]);

  // ── SWR 錯誤通知（合併為單一 effect） ────────────────────
  useEffect(() => {
    if (phaseError)
      notifApi.error({
        title: "無法載入 Phase 清單",
        description: phaseError.message,
        placement: "topRight",
        duration: 5,
        key: "phaseError",
      });
    if (eqpError)
      notifApi.error({
        title: "無法載入 EQP / Rule 清單",
        description: eqpError.message,
        placement: "topRight",
        duration: 5,
        key: "eqpError",
      });
    if (ruleInfoError)
      notifApi.error({
        title: "無法載入 Rule 資料",
        description: ruleInfoError.message,
        placement: "topRight",
        duration: 5,
        key: "ruleError",
      });
  }, [phaseError, eqpError, ruleInfoError, notifApi]);

  // ── Block 搜尋 ────────────────────────────────────────────
  const [matchedBlockList, setMatchedBlockList] = useState<
    MatchResult[] | null
  >(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [searchKey, setSearchKey] = useState(0);

  // ── 搜尋選中 Block ────────────────────────────────────────
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // ── Tracker（block-level：canvas 主導展開，側欄 readout 同步）──
  const graph = useMemo(() => buildDepGraph(rules), [rules]);
  const [tracedLog, setTracedLog] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [runtimeValues, setRuntimeValues] = useState<Record<string, string>>(
    {},
  );
  const [hoverBlock, setHoverBlock] = useState<string | null>(null);
  const [trackerMode, setTrackerMode] = useState<TrackerMode>("trace");
  const [impactVar, setImpactVar] = useState<string>("");
  // 右側分頁（= 當前作用功能：Viewer / Tracker）。提前宣告，供 canvas HL gate 用
  const [rightTab, setRightTab] = useState<RightTab>("search");

  const ruleViewRef = useRef<RuleViewHandle | null>(null);
  const searchInputRef = useRef<InputRef>(null);

  const matchedBlockIds = useMemo(() => {
    if (!matchedBlockList) return null;
    return new Set(matchedBlockList.map((m) => m.id));
  }, [matchedBlockList]);

  const rvForTrace = useMemo(
    () => (Object.keys(runtimeValues).length ? runtimeValues : undefined),
    [runtimeValues],
  );
  // 目前展開的依賴鏈（canvas 連線 + 紫框來源）；fullTrace = 全展，hover 預覽用
  const traceData = useMemo(
    () =>
      tracedLog
        ? computeTrace(graph, tracedLog, expandedBlocks, rvForTrace)
        : { edges: [], logBlocks: [] },
    [graph, tracedLog, expandedBlocks, rvForTrace],
  );
  const fullTrace = useMemo(
    () =>
      tracedLog
        ? computeTrace(graph, tracedLog, "all", rvForTrace)
        : { edges: [], logBlocks: [] },
    [graph, tracedLog, rvForTrace],
  );

  const trackerLogIdsSet = useMemo(
    () =>
      traceData.logBlocks.length ? new Set(traceData.logBlocks) : undefined,
    [traceData],
  );
  // 紫框（var 來源 block）= 目前展開的依賴鏈所摸到的定義 block
  const trackerVarIdsSet = useMemo(
    () =>
      traceData.edges.length
        ? new Set(traceData.edges.map((e) => e.to))
        : undefined,
    [traceData],
  );

  // ── Impact（反向：變數 → 受影響 log）─ spec ① ───────────────
  const isImpact = trackerMode === "impact";
  const impactResult = useMemo(
    () => (isImpact && impactVar ? computeImpact(graph, impactVar) : null),
    [isImpact, impactVar, graph],
  );
  // canvas 高亮：受影響 log 的 trigger block（橘框）+ impact 鏈定義 block（紫框）
  const impactLogIdsSet = useMemo(() => {
    if (!impactResult?.logs.length) return undefined;
    const s = new Set<string>();
    for (const l of impactResult.logs)
      graph.logs.get(l.logName)?.triggers.forEach((t) => s.add(t.block));
    return s.size ? s : undefined;
  }, [impactResult, graph]);
  const impactVarIdsSet = useMemo(
    () =>
      impactResult?.edges.length
        ? new Set(impactResult.edges.map((e) => e.to))
        : undefined,
    [impactResult],
  );
  // 當前作用功能（互斥）：決定 canvas 餵哪一種 HL。資料都保留，只切顯示來源，
  // 切走的功能（Log Trace / Var Impact / Viewer）HL 一律還原、不殘留。
  const showSearch = rightTab === "search";
  const showImpact = rightTab === "tracker" && isImpact;
  const showTrace = rightTab === "tracker" && !isImpact;

  const canvasEdges = showImpact
    ? (impactResult?.edges ?? [])
    : showTrace
      ? traceData.edges
      : [];
  const canvasLogIds = showImpact
    ? impactLogIdsSet
    : showTrace
      ? trackerLogIdsSet
      : undefined;
  const canvasVarIds = showImpact
    ? impactVarIdsSet
    : showTrace
      ? trackerVarIdsSet
      : undefined;
  const canvasPreview = showImpact
    ? (impactResult?.edges ?? [])
    : showTrace
      ? fullTrace.edges
      : [];

  // ── Icon 版本切換 ─────────────────────────────────────────
  const [useNewIcons, setUseNewIcons] = useState(true);
  // 斷尾 block 警示顯示開關（預設關；平時不顯示，需要時在 TopBar 開）
  const [showDeadBranches, setShowDeadBranches] = useState(false);
  // Runtime Log（常駐折疊區）：文字 → parseRuntimeLog → runtimeValues（canvas 高亮 / tracker tree / inspector Log Value 共用）
  const [runtimeLog, setRuntimeLog] = useState("");
  const [runtimeOpen, setRuntimeOpen] = useState(false);
  const [runtimePanelHeight, setRuntimePanelHeight] = useState(44);
  const runtimePanelResizeRef = useRef({ dragging: false, startY: 0, startH: 0 });

  // ── 右側面板寬度 / 收合 / 分頁 ───────────────────────────
  const COLLAPSE_THRESHOLD = 55; // 自動收合的寬度閾值（px）
  const MIN_PANEL_WIDTH = 200; // 面板最小寬度（px），防止被拖得太窄而無法再拖回來
  const DEFAULT_PANEL_WIDTH = 300;

  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const dividerDragRef = useRef({
    dragging: false,
    startX: 0,
    startW: DEFAULT_PANEL_WIDTH,
  });

  // 右側面板拖曳調整寬度（拖到 COLLAPSE_THRESHOLD 以下自動縮起）
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dividerDragRef.current.dragging) return;
      const dx = dividerDragRef.current.startX - e.clientX;
      const newW = dividerDragRef.current.startW + dx;
      if (newW < COLLAPSE_THRESHOLD) {
        dividerDragRef.current.dragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setRightCollapsed(true);
        return;
      }
      setRightPanelWidth(Math.min(1000, Math.max(MIN_PANEL_WIDTH, newW)));
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

  // 已知變數面板垂直 resize
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!runtimePanelResizeRef.current.dragging) return;
      const dy = e.clientY - runtimePanelResizeRef.current.startY;
      setRuntimePanelHeight(
        Math.max(44, Math.min(300, runtimePanelResizeRef.current.startH + dy)),
      );
    }
    function onMouseUp() {
      if (!runtimePanelResizeRef.current.dragging) return;
      runtimePanelResizeRef.current.dragging = false;
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

  // Ctrl/Cmd+F：展開右側面板 → 切搜尋分頁 → 聚焦搜尋框（攔截瀏覽器內建 find）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setRightCollapsed(false);
        setRightTab("search");
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rule 變更：重置搜尋 / Tracker 狀態
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchedBlockList(null);
    setSearchKeyword("");
    setMatchIndex(0);
    setSelectedBlockId(null);
    setSearchKey((k) => k + 1);
    setTracedLog(null);
    setExpandedBlocks(new Set());
    setRuntimeValues({});
    setRuntimeLog("");
    setHoverBlock(null);
    setTrackerMode("trace");
    setImpactVar("");
  }, [loadedRule]);

  // ── URL deep link（spec ②）─────────────────────────────────
  // 還原順序：mount 先吃 phase/rule 觸發載入 → 等 graph ready 再補 log/mode/var（避免 SWR race）。
  const [urlRestored, setUrlRestored] = useState(false);
  const pendingRestoreRef = useRef<{
    log: string | null;
    mode: string | null;
    var: string | null;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // mount：讀 URL，phase+rule 先設好；其餘暫存待 graph ready
  useEffect(() => {
    const fab = searchParams.get("fab");
    const phase = searchParams.get("phase");
    const rule = searchParams.get("rule");
    if (fab) setSelectedFab(fab); // fab 在最外層；下游 fetch 全依賴它
    if (fab && phase && rule) {
      pendingRestoreRef.current = {
        log: searchParams.get("log"),
        mode: searchParams.get("mode"),
        var: searchParams.get("var"),
      };
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedPhase(phase); // selection 與 loaded 一起還原（連結代表已載入的現場）
      setLoadedFab(fab);
      setLoadedPhase(phase);
      setLoadedRule(rule);
      /* eslint-enable react-hooks/set-state-in-effect */
    } else {
      setUrlRestored(true); // 無可還原 → 直接開放 URL 寫入
    }
    // 只在掛載時跑一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // graph ready → 補還原 log/mode/var；rule 失效則提示並清掉參數
  useEffect(() => {
    const pending = pendingRestoreRef.current;
    if (urlRestored || !pending) return;
    if (ruleInfoLoading) return; // 等 rule 資料載完才判定
    // mount 首個 commit：effect 1 才剛 setLoadedRule，本 effect 仍讀到 loadedRule=null 的快照
    // → SWR key 為 null → isLoading=false、ruleInfoDTOs=null。此刻不可判定 rule 不存在，
    //   否則會在 fetch 還沒開始前就誤清參數。等 SWR 對此 rule 真的有結果（資料或錯誤）再判。
    if (ruleInfoDTOs == null && !ruleInfoError) return;

    pendingRestoreRef.current = null;

    if (rules.length === 0) {
      // rule 不存在 / 已變更（網路錯誤另有 error 通知）
      if (!ruleInfoError)
        notifApi.warning({
          message: "Rule 不存在或已變更",
          description: "已清除連結中的 Rule 參數",
          placement: "topRight",
          duration: 5,
          key: "urlBadRule",
        });
      setLoadedRule(null);
      setUrlRestored(true);
      return;
    }

    if (pending.mode === "impact") {
      setTrackerMode("impact");
      if (pending.var) setImpactVar(pending.var);
    }
    if (pending.log) {
      if (graph.logs.has(pending.log)) {
        setTracedLog(pending.log);
        const lb = graph.logs.get(pending.log)?.triggers[0]?.block;
        if (lb) ruleViewRef.current?.focusBlockById(lb);
      } else {
        notifApi.warning({
          message: `找不到 [$${pending.log}$]`,
          description: "已清除連結中的 Log 參數",
          placement: "topRight",
          duration: 5,
          key: "urlBadLog",
        });
      }
    }
    setUrlRestored(true);
  }, [
    ruleInfoLoading,
    ruleInfoError,
    ruleInfoDTOs,
    rules.length,
    graph,
    urlRestored,
    notifApi,
  ]);

  // 狀態 → URL（replace，不灌 history）；runtimeValues / expandedBlocks 刻意不入 URL
  useEffect(() => {
    if (!urlRestored) return;
    const params = new URLSearchParams();
    if (loadedFab) params.set("fab", loadedFab);
    if (loadedPhase) params.set("phase", loadedPhase);
    if (loadedRule) params.set("rule", loadedRule);
    if (tracedLog) params.set("log", tracedLog);
    if (trackerMode === "impact") {
      params.set("mode", "impact");
      if (impactVar) params.set("var", impactVar);
    }
    setSearchParams(params, { replace: true });
  }, [
    urlRestored,
    loadedFab,
    loadedPhase,
    loadedRule,
    tracedLog,
    trackerMode,
    impactVar,
    setSearchParams,
  ]);

  // 複製當前查案現場連結（URL 已即時同步，直接複製 location.href）
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1500);
      },
      () => {
        /* clipboard 失敗靜默 */
      },
    );
  }, []);

  // 貼 runtime 值 → 自動展開「命中路徑」（沿 fired=yes 的邊往上鋪）
  useEffect(() => {
    if (!tracedLog || !Object.keys(runtimeValues).length) return;
    const fired = new Set<string>();
    for (const e of computeTrace(graph, tracedLog, "all", runtimeValues).edges)
      if (e.fired === "yes") fired.add(e.to);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedBlocks((prev) => new Set([...prev, ...fired]));
  }, [tracedLog, runtimeValues, graph]);

  // ── 搜尋導覽 handlers ─────────────────────────────────────
  // 聚焦第 i 筆（夾邊界）：更新游標 + canvas 選中高亮 + 平移定位
  const focusMatch = useCallback(
    (i: number) => {
      if (!matchedBlockList?.length) return;
      const c = Math.max(0, Math.min(matchedBlockList.length - 1, i));
      setMatchIndex(c);
      setSelectedBlockId(matchedBlockList[c].id);
      ruleViewRef.current?.focusBlockById(matchedBlockList[c].id);
    },
    [matchedBlockList],
  );

  // Enter / ›：第一次先聚焦「當前筆」，已聚焦才前進（仿瀏覽器 Ctrl+F）
  const handleNext = useCallback(() => {
    if (!matchedBlockList?.length) return;
    const cur = matchedBlockList[matchIndex];
    if (selectedBlockId !== cur.id) return focusMatch(matchIndex);
    focusMatch(matchIndex + 1);
  }, [matchedBlockList, matchIndex, selectedBlockId, focusMatch]);

  // Shift+Enter / ‹：同上，方向相反
  const handlePrev = useCallback(() => {
    if (!matchedBlockList?.length) return;
    const cur = matchedBlockList[matchIndex];
    if (selectedBlockId !== cur.id) return focusMatch(matchIndex);
    focusMatch(matchIndex - 1);
  }, [matchedBlockList, matchIndex, selectedBlockId, focusMatch]);

  const handlePick = useCallback(
    (i: number) => focusMatch(i),
    [focusMatch],
  );

  // ── Prop handlers ─────────────────────────────────────────
  // 換 / 清 FAB 只動 selection；已載入的資料不動（F01/F02/F03 回相同資料，phase/rule 仍適用）
  const handleFabChange = useCallback((fab: string | null) => {
    setSelectedFab(fab);
  }, []);

  // 換 Phase 只動 selection（更新下方 EQP/Rule 清單）；已載入的 rule 資料保留，等按「載入」才換
  const handlePhaseChange = useCallback((phase: string | null) => {
    setSelectedPhase(phase);
  }, []);

  // 按「載入」才把 dropdown selection 提交成 loaded；與目前已載入完全相同 → 不動資料（不重抓、不重排）
  const handleRuleSelect = useCallback(
    (ruleName: string) => {
      if (
        selectedFab === loadedFab &&
        selectedPhase === loadedPhase &&
        ruleName === loadedRule
      )
        return;
      setLoadedFab(selectedFab);
      setLoadedPhase(selectedPhase);
      setLoadedRule(ruleName);
      setLayoutVersion((v) => v + 1); // 重建 blocks → 位置回原始 POSX/POSY
    },
    [selectedFab, selectedPhase, loadedFab, loadedPhase, loadedRule],
  );

  const handleMatchChange = useCallback(
    (list: MatchResult[] | null, kw: string) => {
      setMatchedBlockList(list);
      setSearchKeyword(kw);
      setMatchIndex(0);
      setSelectedBlockId(null); // 新搜尋重置游標：第一次 Enter 先聚焦當前筆
    },
    [],
  );

  // 選定 / 清除追蹤的 log（側欄搜尋或 canvas 點 log block 都走這）
  const handleTraceLog = useCallback(
    (logName: string | null) => {
      setTracedLog(logName);
      setExpandedBlocks(new Set());
      setHoverBlock(null);
      if (logName) {
        const lb = graph.logs.get(logName)?.triggers[0]?.block;
        if (lb) ruleViewRef.current?.focusBlockById(lb);
      }
    },
    [graph],
  );

  // 展開 / 收合某 block 的上游（canvas 點 block 或側欄點節點都走這）
  const handleToggleBlock = useCallback((block: string) => {
    setExpandedBlocks((prev) => {
      const n = new Set(prev);
      if (n.has(block)) n.delete(block);
      else n.add(block);
      return n;
    });
  }, []);

  // 樹上 inline / chips 設已知值 → 回寫 runtimeValues + 同步貼上框文字（單一來源）
  const handleRuntimeValuesChange = useCallback(
    (next: Record<string, string>) => {
      setRuntimeValues(next);
      setRuntimeLog(serializeRuntimeValues(next));
    },
    [],
  );

  // canvas 右鍵 block → 依當前模式的 context action（左鍵雙擊一律開 inspector）
  const handleBlockContextMenu = useCallback(
    (id: string) => {
      if (rightTab === "tracker" && tracedLog) handleToggleBlock(id); // Tracker：展開 / 收合上游
      // 其他模式暫無 context action（未來可擴充）
    },
    [rightTab, tracedLog, handleToggleBlock],
  );

  const handleCanvasBlockHover = useCallback((id: string | null) => {
    setHoverBlock(id);
  }, []);

  // Tracker 點「來自 / 觸發於 <block>」→ canvas 跳到該 block 並選取
  const handleFocusBlock = useCallback((blockName: string) => {
    setSelectedBlockId(blockName);
    ruleViewRef.current?.focusBlockById(blockName);
  }, []);

  // Tracker 雙擊「來自 / 觸發於 <block>」→ 開該 block 的 inspector
  const handleOpenInspector = useCallback((blockName: string) => {
    ruleViewRef.current?.openInspectorById(blockName);
  }, []);

  const handleTabChange = useCallback(
    (tab: RightTab) => {
      if (tab !== "search" && rightTab === "search") {
        setMatchedBlockList(null);
        setSearchKeyword("");
        setMatchIndex(0);
        setSelectedBlockId(null);
        setSearchKey((k) => k + 1);
      }
      setRightTab(tab);
    },
    [rightTab],
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 p-3">
      {notifCtx}

      {/* ── TopBar：Rule 選擇 ── */}
      <div className="rounded-xl px-4 py-2.5 bg-slate-800 flex items-center gap-3 shrink-0">
        <RuleDropdownSearch
          phases={phases}
          eqpRules={eqpRules ?? []}
          selectedFab={selectedFab}
          selectedPhase={selectedPhase}
          phasesLoading={phasesLoading}
          eqpLoading={eqpLoading}
          onFabChange={handleFabChange}
          onPhaseChange={handlePhaseChange}
          onRuleSelect={handleRuleSelect}
        />

        {/* ── 當前載入的 Rule 麵包屑（點擊＝複製連結）── */}
        {loadedRule && (
          <button
            onClick={handleCopyLink}
            title="點擊複製當前連結（FAB / Phase / Rule / Log / 模式 / 變數）"
            className={cn(
              "group flex items-center gap-1.5 text-xs pl-3 border-l min-w-0 cursor-pointer transition-colors",
              linkCopied ? "border-green-500/40" : "border-white/15",
            )}
          >
            <span className="text-slate-400 shrink-0">{loadedFab}</span>
            <span className="text-white/30 shrink-0">/</span>
            <span className="text-slate-400 shrink-0">{loadedPhase}</span>
            <span className="text-white/30 shrink-0">/</span>
            <span className="text-white font-semibold font-mono truncate max-w-50">
              {loadedRule}
            </span>
            {claimTime && (
              <>
                <span className="text-white/30 shrink-0">|</span>
                <span className="text-slate-400 font-mono shrink-0">
                  {claimTime}
                </span>
              </>
            )}
            <span
              className={cn(
                "ml-1 shrink-0 text-[10px] transition-colors",
                linkCopied
                  ? "text-green-300"
                  : "text-slate-500 group-hover:text-slate-200",
              )}
            >
              {linkCopied ? "✓ 已複製" : "⧉ 複製連結"}
            </span>
          </button>
        )}

        <div className="ml-auto shrink-0 flex items-center gap-2">
          {loadedRule && (
            <button
              onClick={() => setRuntimeOpen((o) => !o)}
              title="設定已知變數值（Runtime Log），用於 Tracker 條件模擬"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors",
                runtimeOpen || Object.keys(runtimeValues).length > 0
                  ? "text-green-300 border-green-500/40 bg-green-500/15"
                  : "text-slate-300 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white",
              )}
            >
              已知變數
              {Object.keys(runtimeValues).length > 0 && (
                <span className="font-mono text-[10px]">
                  {Object.keys(runtimeValues).length}v
                </span>
              )}
            </button>
          )}
          {loadedRule && (
            <button
              onClick={() => setShowDeadBranches((s) => !s)}
              title="顯示 / 隱藏斷尾 block 警示（無下游、運算無效的 block）"
              className={cn(
                "px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors",
                showDeadBranches
                  ? "text-rose-300 border-rose-500/40 bg-rose-500/15"
                  : "text-slate-300 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white",
              )}
            >
              斷尾
            </button>
          )}
          <div className="flex items-center text-xs rounded border border-white/15 bg-white/5 p-0.5 gap-0.5">
            <button
              onClick={() => setUseNewIcons(true)}
              className={cn(
                "px-3 py-1 rounded cursor-pointer transition-colors",
                useNewIcons
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Modern
            </button>
            <button
              onClick={() => setUseNewIcons(false)}
              className={cn(
                "px-3 py-1 rounded cursor-pointer transition-colors",
                !useNewIcons
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Classic
            </button>
          </div>
        </div>
      </div>

      {/* ── 主體：Canvas + 右側面板 ── */}
      <div className="flex-1 min-h-0 flex">
        {/* Canvas 欄（flex-col：已知變數面板 + canvas，右側面板高度不受影響）*/}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {loadedRule && runtimeOpen && (
            <div
              className="rounded-xl bg-slate-800 border border-white/10 flex flex-col overflow-hidden shrink-0 mb-3 relative"
              style={{ height: runtimePanelHeight }}
            >
              <textarea
                className="flex-1 w-full min-h-0 resize-none overflow-y-auto px-3 py-2 bg-transparent text-white placeholder:text-white/20 text-xs outline-none font-mono"
                placeholder="已知變數：(VariableA: 10) (VariableB: Y) ..."
                value={runtimeLog}
                onChange={(e) => {
                  setRuntimeLog(e.target.value);
                  setRuntimeValues(parseRuntimeLog(e.target.value));
                }}
              />
              <button
                onClick={() => setRuntimeOpen(false)}
                className="absolute top-1.5 right-2 text-white/25 hover:text-white/60 text-xs cursor-pointer bg-transparent leading-none"
              >
                ✕
              </button>
              {/* 垂直 resize 把手 */}
              <div
                className="h-2 shrink-0 cursor-s-resize flex items-center justify-center hover:bg-white/10 transition-colors group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  runtimePanelResizeRef.current = {
                    dragging: true,
                    startY: e.clientY,
                    startH: runtimePanelHeight,
                  };
                  document.body.style.cursor = "s-resize";
                  document.body.style.userSelect = "none";
                }}
              >
                <div className="w-8 h-0.5 rounded-full bg-white/20 group-hover:bg-white/50 transition-colors" />
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 min-h-0 rounded-xl bg-white border border-black/12 relative overflow-hidden">
          <RuleView
            ref={ruleViewRef}
            fab={loadedFab}
            rules={rules}
            matchedBlockIds={showSearch ? matchedBlockIds : null}
            selectedBlockId={selectedBlockId}
            trackerLogIds={canvasLogIds}
            trackerVarIds={canvasVarIds}
            trackerEdges={canvasEdges}
            previewEdges={canvasPreview}
            hoverBlockId={hoverBlock}
            useNewIcons={useNewIcons}
            showDeadBranches={showDeadBranches}
            runtimeValues={runtimeValues}
            layoutVersion={layoutVersion}
            searchKeyword={searchKeyword}
            trackedLogName={showTrace ? (tracedLog ?? "") : ""}
            onBlockContextMenu={handleBlockContextMenu}
            onBlockHover={handleCanvasBlockHover}
          />
          </div>
        </div>

        {/* 拖曳分隔線（收合後隱藏） */}
        {!rightCollapsed && (
          <div
            className="w-3 shrink-0 cursor-col-resize select-none group self-stretch relative mx-0.5"
            onMouseDown={(e) => {
              e.preventDefault();
              dividerDragRef.current.dragging = true;
              dividerDragRef.current.startX = e.clientX;
              dividerDragRef.current.startW = rightPanelWidth;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          >
            {/* 全高細線：平常極淡，hover 亮起 */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 rounded-full bg-white/10 group-hover:bg-blue-400/55 transition-colors duration-150" />
            {/* 置中 grip pill：只在 hover 出現 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-0.75 px-0.5 py-1.5 rounded bg-slate-600 border border-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-0.75 h-0.75 rounded-full bg-white/70"
                />
              ))}
            </div>
          </div>
        )}

        {/* 右側面板（始終掛載，收合時僅顯示展開按鈕） */}
        <div
          className={cn(
            "shrink-0 rounded-xl bg-slate-800 border border-black/12 text-white flex flex-col min-h-0 overflow-hidden",
            !rightCollapsed && "p-3",
          )}
          style={{ width: rightCollapsed ? 32 : rightPanelWidth }}
        >
          {/* 收合狀態：整個面板都可點擊展開 */}
          {rightCollapsed && (
            <button
              onClick={() => {
                setRightPanelWidth((w) => Math.max(w, DEFAULT_PANEL_WIDTH));
                setRightCollapsed(false);
              }}
              title="展開面板"
              className="w-full h-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 cursor-pointer transition-all rounded-xl"
            >
              ‹
            </button>
          )}

          {/* 展開狀態：完整面板內容 */}
          <div
            className={
              rightCollapsed ? "hidden" : "flex-1 min-h-0 flex flex-col"
            }
          >
            {/* 分頁標頭 */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex gap-0.5">
                {[
                  {
                    label: "Viewer",
                    active: rightTab === "search",
                    onClick: () => handleTabChange("search"),
                  },
                  {
                    label: "Tracker",
                    active: rightTab === "tracker" && !isImpact,
                    onClick: () => {
                      handleTabChange("tracker");
                      setTrackerMode("trace");
                    },
                  },
                  {
                    label: "Var Impact",
                    active: rightTab === "tracker" && isImpact,
                    onClick: () => {
                      handleTabChange("tracker");
                      setTrackerMode("impact");
                    },
                  },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={t.onClick}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors",
                      t.active
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/7",
                    )}
                  >
                    {t.label}
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

            <Divider
              style={{ borderColor: "rgba(255,255,255,0.1)", margin: "8px 0" }}
            />

            {/* ── 搜尋分頁 ── */}
            <div
              className={
                rightTab === "search"
                  ? "flex-1 min-h-0 flex flex-col gap-2"
                  : "hidden"
              }
            >
              {/* 搜尋列 */}
              <div className="shrink-0">
                <RuleContentSearch
                  key={searchKey}
                  rules={rules}
                  onMatchChange={handleMatchChange}
                  onNavigate={(dir) => (dir === 1 ? handleNext() : handlePrev())}
                  inputRef={searchInputRef}
                />
              </div>

              {/* 位置 / 總數 + 鍵盤提示（導覽改由 Enter / Shift+Enter）*/}
              {matchedBlockList && matchedBlockList.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
                  <span className="tabular-nums shrink-0">
                    {matchIndex + 1} / {matchedBlockList.length}
                  </span>
                  <span className="ml-auto truncate text-[10px] text-slate-500">
                    Enter 下一筆 · Shift+Enter 上一筆 · Esc 清除
                  </span>
                </div>
              )}

              {/* 結果列表 */}
              <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-1.5">
                {!loadedRule && (
                  <p className="text-slate-400 text-xs">請先選擇 Rule。</p>
                )}
                {loadedRule && !matchedBlockList && (
                  <p className="text-slate-400 text-xs">
                    在上方輸入關鍵字，搜尋相關 Block。
                  </p>
                )}
                {matchedBlockList?.length === 0 && (
                  <p className="text-slate-400 text-xs">No matches found.</p>
                )}
                {matchedBlockList?.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => handlePick(i)}
                    onDoubleClick={() =>
                      ruleViewRef.current?.openInspectorById(m.id)
                    }
                    className={cn(
                      "text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors",
                      i === matchIndex
                        ? "border-green-500/50 bg-green-500/10 text-white"
                        : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/40 shrink-0">{i + 1}.</span>
                      <span className="font-semibold truncate flex-1 min-w-0">
                        {m.id}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[9px] font-mono px-1 py-px rounded border leading-none",
                          FIELD_TAG[m.field].cls,
                        )}
                      >
                        {FIELD_TAG[m.field].label}
                      </span>
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
            <div
              className={
                rightTab === "tracker"
                  ? "flex-1 min-h-0 flex flex-col"
                  : "hidden"
              }
            >
              <CaseQuery
                key={loadedRule}
                graph={graph}
                rules={rules}
                selectedRule={loadedRule}
                tracedLog={tracedLog}
                expandedBlocks={expandedBlocks}
                runtimeValues={runtimeValues}
                hoverBlock={hoverBlock}
                mode={trackerMode}
                onModeChange={setTrackerMode}
                impactVar={impactVar}
                onImpactVarChange={setImpactVar}
                impactResult={impactResult}
                onTraceLog={handleTraceLog}
                onToggleBlock={handleToggleBlock}
                onRuntimeValuesChange={handleRuntimeValuesChange}
                onHoverBlock={handleCanvasBlockHover}
                onFocusBlock={handleFocusBlock}
                onOpenInspector={handleOpenInspector}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
