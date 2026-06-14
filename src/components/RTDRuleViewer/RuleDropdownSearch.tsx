// ============================================================
// RuleDropdownSearch.tsx
// 兩階段 Rule 選擇：先選 Phase，再透過 EQP ID 或 Rule Name 載入
//
// 互斥邏輯：
//   EQP 有選取 → Rule 下拉只顯示該 EQP 對應的 Rules（可能多條），需再選取 Rule
//   Rule 直接輸入（未選 EQP）→ EQP 欄位停用
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import { ApartmentOutlined, BankOutlined, DesktopOutlined, FileTextOutlined } from "@ant-design/icons";
import { cn } from "../../utils/clsx";
import type { EqpRuleListDTO } from "./types";

// FAB 清單先寫死；目前假設 F01/F02/F03 都回一樣的資料（後端 fab 不驗證）。之後接後端再換成 SWR。
const FAB_OPTIONS = ["F01", "F02", "F03"];

type Props = {
  phases: string[];
  eqpRules: EqpRuleListDTO[];
  selectedFab: string | null;   // 受控：FAB 狀態提升到 RuleViewer（route /api/{fab}/...）
  selectedPhase: string | null;
  phasesLoading?: boolean;   // Phase 清單載入中 → Select 顯示「讀取中…」且停用
  eqpLoading?: boolean;      // 該 Phase 的 EQP/Rule 載入中 → 兩欄顯示「讀取中…」且停用
  onFabChange: (fab: string | null) => void;   // 換/清 FAB → 由 RuleViewer 連帶清下游
  onPhaseChange: (phase: string | null) => void;
  onRuleSelect: (ruleName: string) => void;
};

export function RuleDropdownSearch({
  phases,
  eqpRules,
  selectedFab,
  selectedPhase,
  phasesLoading = false,
  eqpLoading = false,
  onFabChange,
  onPhaseChange,
  onRuleSelect,
}: Props) {
  // FAB 清單先寫死（FAB_OPTIONS）；選了 FAB 才往下開放 Phase。
  // 狀態與「換 FAB 清下游」邏輯都在 RuleViewer，此處只負責呈現 + 回拋 onFabChange。

  // ── 從 eqpRules 衍生當前 phase 的資料 ────────────────────
  const phaseEqpRules = useMemo(
    () => (selectedPhase ? eqpRules.filter((e) => e.PHASE === selectedPhase) : []),
    [eqpRules, selectedPhase]
  );

  const allRuleNames = useMemo(
    () => [...new Set(phaseEqpRules.map((e) => e.RULE_NAME))],
    [phaseEqpRules]
  );

  // ── EQP state ─────────────────────────────────────────────
  const [eqpInput, setEqpInput]           = useState("");
  const [selectedEqpId, setSelectedEqpId] = useState<string | null>(null);
  const [eqpOpen, setEqpOpen]             = useState(false);
  const [eqpHighlightIdx, setEqpHighlightIdx] = useState(-1);

  // ── Rule state ────────────────────────────────────────────
  const [ruleInput, setRuleInput]     = useState("");
  const [pendingRule, setPendingRule] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen]       = useState(false);
  const [ruleHighlightIdx, setRuleHighlightIdx] = useState(-1);

  const eqpWrapperRef  = useRef<HTMLDivElement>(null);
  const eqpInputRef    = useRef<HTMLInputElement>(null);
  const eqpListRef     = useRef<HTMLUListElement>(null);
  const ruleWrapperRef = useRef<HTMLDivElement>(null);
  const ruleInputRef   = useRef<HTMLInputElement>(null);
  const ruleListRef    = useRef<HTMLUListElement>(null);

  // Rule 直接輸入中（未透過 EQP）→ EQP 欄位停用
  const ruleDirectActive = !!ruleInput && !selectedEqpId;

  // ── Phase 切換時全部清空 ──────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEqpInput(""); setSelectedEqpId(null); setEqpOpen(false); setEqpHighlightIdx(-1);
    setRuleInput(""); setPendingRule(null); setRuleOpen(false); setRuleHighlightIdx(-1);
  }, [selectedPhase]);

  // ── 點外部關閉下拉 ────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (eqpWrapperRef.current && !eqpWrapperRef.current.contains(e.target as Node))
        setEqpOpen(false);
      if (ruleWrapperRef.current && !ruleWrapperRef.current.contains(e.target as Node))
        setRuleOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── 篩選清單 ──────────────────────────────────────────────
  const filteredEqp = useMemo(() => {
    const kw = eqpInput.trim().toLowerCase();
    // 去重：每個 EQP_ID 只出現一次
    const seen = new Set<string>();
    return phaseEqpRules.filter((m) => {
      if (seen.has(m.EQP_ID)) return false;
      seen.add(m.EQP_ID);
      return !kw || m.EQP_ID.toLowerCase().includes(kw);
    });
  }, [phaseEqpRules, eqpInput]);

  // Rule 清單來源：若有選 EQP → 只顯示該 EQP 的 Rules；否則顯示全部
  const baseRuleNames = useMemo(() => {
    if (!selectedEqpId) return allRuleNames;
    return [...new Set(
      phaseEqpRules.filter((e) => e.EQP_ID === selectedEqpId).map((e) => e.RULE_NAME)
    )];
  }, [phaseEqpRules, selectedEqpId, allRuleNames]);

  const filteredRules = useMemo(() => {
    const kw = ruleInput.trim().toLowerCase();
    if (!kw) return baseRuleNames;
    return baseRuleNames.filter((r) => r.toLowerCase().includes(kw));
  }, [baseRuleNames, ruleInput]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setEqpHighlightIdx(-1);  }, [filteredEqp]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRuleHighlightIdx(-1); }, [filteredRules]);

  // ── 高亮捲入可視範圍 ──────────────────────────────────────
  useEffect(() => {
    if (eqpHighlightIdx < 0 || !eqpListRef.current) return;
    const eqpItems = eqpListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]");
    eqpItems[eqpHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [eqpHighlightIdx]);

  useEffect(() => {
    if (ruleHighlightIdx < 0 || !ruleListRef.current) return;
    const ruleItems = ruleListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]");
    ruleItems[ruleHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [ruleHighlightIdx]);

  // ── 載入 ──────────────────────────────────────────────────
  const canLoad = !!pendingRule;

  function handleLoad() {
    if (pendingRule) onRuleSelect(pendingRule);
  }

  // ── EQP 操作 ──────────────────────────────────────────────
  function confirmEqp(eqpId: string) {
    setEqpInput(eqpId);
    setSelectedEqpId(eqpId);
    setEqpOpen(false);
    setEqpHighlightIdx(-1);
    // EQP 確認後清除 Rule 選取，打開 Rule 下拉讓使用者選
    setRuleInput(""); 
    setPendingRule(null);
    setRuleOpen(true);
  }

  function clearEqp() {
    setEqpInput(""); 
    setSelectedEqpId(null); 
    setEqpOpen(false); 
    setEqpHighlightIdx(-1);
    setRuleInput(""); 
    setPendingRule(null);
  }

  function handleEqpKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault(); setEqpOpen(true);
      setEqpHighlightIdx((i) => Math.min(i + 1, filteredEqp.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEqpHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (eqpOpen && eqpHighlightIdx >= 0 && filteredEqp[eqpHighlightIdx])
        confirmEqp(filteredEqp[eqpHighlightIdx].EQP_ID);
      else setEqpOpen(false);
    } else if (e.key === "Escape") {
      setEqpOpen(false); setEqpHighlightIdx(-1);
    }
  }

  // ── Rule 操作 ─────────────────────────────────────────────
  function confirmRule(opt: string) {
    setRuleInput(opt); 
    setPendingRule(opt); 
    setRuleOpen(false); 
    setRuleHighlightIdx(-1);
  }

  function clearRule() {
    setRuleInput(""); 
    setPendingRule(null); 
    setRuleOpen(false); 
    setRuleHighlightIdx(-1);
  }

  // 選澤的快捷鍵 (上下、enter、esc)
  function handleRuleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault(); setRuleOpen(true);
      setRuleHighlightIdx((i) => Math.min(i + 1, filteredRules.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setRuleHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ruleOpen && ruleHighlightIdx >= 0 && filteredRules[ruleHighlightIdx])
        confirmRule(filteredRules[ruleHighlightIdx]);
      else if (pendingRule) handleLoad();
    } else if (e.key === "Escape") {
      setRuleOpen(false); setRuleHighlightIdx(-1);
    }
  }

  const phaseOptions = phases.map((p) => ({ label: p, value: p }));




  return (
    <div className="flex items-center gap-2">

      {/* ── FAB（先寫死 F01/F02/F03，純 UI、不影響 API）── */}
      <div className="flex items-center gap-1.5">
        <BankOutlined style={{ color: "white", fontSize: 14 }} />
        <Select
          placeholder="FAB"
          options={FAB_OPTIONS.map((f) => ({ label: f, value: f }))}
          value={selectedFab ?? undefined}
          onChange={(v) => onFabChange(v ?? null)}
          allowClear
          style={{ width: 110 }}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { zIndex: 2000 } } }}
        />
      </div>

      {/* 選了 FAB 才開放 Phase 以下 */}
      {selectedFab && (<>

      {/* ── Phase ── */}
      <div className="flex items-center gap-1.5">
        <ApartmentOutlined style={{ color: "white", fontSize: 14 }} />
        {phasesLoading ? (
          // 載入中：用與 EQP/Rule 一致的淺色框顯示「讀取中…」，資料到了才 render 真正的 Select
          <div
            style={{ width: 130 }}
            className="h-8 flex items-center px-3 text-sm rounded-md border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed select-none"
          >
            讀取中…
          </div>
        ) : (
          <Select
            placeholder="Phase"
            options={phaseOptions}
            value={selectedPhase ?? undefined}
            onChange={(v) => onPhaseChange(v ?? null)}
            allowClear
            style={{ width: 130 }}
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { zIndex: 2000 } } }}
          />
        )}
      </div>

      {selectedPhase && (<>

        {/* ── EQP ID 輸入框 ── */}
        <div className="flex items-center gap-1.5">
          <DesktopOutlined style={{ color: "white", fontSize: 14 }} />
          <div ref={eqpWrapperRef} className="relative w-44">
            <input
              ref={eqpInputRef}
              disabled={ruleDirectActive || eqpLoading}
              className={cn(
                "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
                ruleDirectActive || eqpLoading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder:text-gray-300"
                  : selectedEqpId
                  ? "bg-blue-50 border-blue-300 text-blue-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
              )}
              placeholder={eqpLoading ? "讀取中…" : "EQP ID（選填）"}
              value={eqpInput}
              onFocus={() => { if (!selectedEqpId && !eqpLoading) setEqpOpen(true); }}
              onChange={(e) => { setEqpInput(e.target.value); setSelectedEqpId(null); setEqpOpen(true); setPendingRule(null); setRuleInput(""); }}
              onKeyDown={handleEqpKeyDown}
            />
            {eqpInput && !ruleDirectActive && (
              <button
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); clearEqp(); eqpInputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer leading-none"
              >×</button>
            )}
            {eqpOpen && !ruleDirectActive && (
              <ul ref={eqpListRef} className="absolute top-full left-0 mt-1 w-full max-h-55 overflow-y-auto border border-gray-300 bg-white shadow-md list-none p-0 m-0 z-2000 rounded">
                {filteredEqp.length === 0
                  ? <li className="px-3 py-2 text-gray-400 text-sm cursor-default">No matches</li>
                  : filteredEqp.map((m, i) => (
                    <li key={m.EQP_ID} data-item
                      className={cn("px-3 py-2 text-sm cursor-pointer",
                        i === eqpHighlightIdx          ? "bg-blue-200 text-blue-500"
                        : m.EQP_ID === selectedEqpId   ? "bg-blue-50 text-blue-500"
                        : "hover:bg-gray-100"
                      )}
                      onMouseDown={(e) => { e.preventDefault(); confirmEqp(m.EQP_ID); }}
                    >
                      {m.EQP_ID}
                    </li>
                  ))
                }
              </ul>
            )}
          </div>
        </div>

        {/* ── Rule Name 輸入框 ── */}
        <div className="flex items-center gap-1.5">
          <FileTextOutlined style={{ color: "white", fontSize: 14 }} />
          <div ref={ruleWrapperRef} className="relative w-56">
            <input
              ref={ruleInputRef}
              disabled={eqpLoading}
              className={cn(
                "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
                eqpLoading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder:text-gray-300"
                  : pendingRule
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
              )}
              placeholder={eqpLoading ? "讀取中…" : selectedEqpId ? "選取 Rule…" : "Rule Name"}
              value={ruleInput}
              onFocus={() => { if (!pendingRule && !eqpLoading) setRuleOpen(true); }}
              onChange={(e) => { setRuleInput(e.target.value); setPendingRule(null); setRuleOpen(true); }}
              onKeyDown={handleRuleKeyDown}
            />
            {ruleInput && (
              <button
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); clearRule(); ruleInputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer leading-none"
              >×</button>
            )}
            {ruleOpen && (
              <ul ref={ruleListRef} className="absolute top-full left-0 mt-1 w-full max-h-55 overflow-y-auto border border-gray-300 bg-white shadow-md list-none p-0 m-0 z-2000 rounded">
                {filteredRules.length === 0
                  ? <li className="px-3 py-2 text-gray-400 text-sm cursor-default">No matches</li>
                  : filteredRules.map((opt, i) => (
                    <li key={opt} data-item
                      className={cn("px-3 py-2 text-sm cursor-pointer",
                        i === ruleHighlightIdx ? "bg-blue-200 text-blue-500"
                        : opt === pendingRule  ? "bg-blue-50 text-blue-500"
                        : "hover:bg-gray-100"
                      )}
                      onMouseDown={(e) => { e.preventDefault(); confirmRule(opt); }}
                    >{opt}</li>
                  ))
                }
              </ul>
            )}
          </div>
        </div>

        {/* ── 載入按鈕 ── */}
        <button
          onClick={handleLoad}
          disabled={!canLoad}
          className={cn("h-8 px-4 rounded text-sm font-semibold transition-colors",
            canLoad
              ? "bg-blue-500 text-white hover:bg-blue-400 cursor-pointer"
              : "bg-gray-100 text-black/25 cursor-not-allowed border border-gray-300"
          )}
        >
          載入
        </button>

      </>)}
      </>)}
    </div>
  );
}
