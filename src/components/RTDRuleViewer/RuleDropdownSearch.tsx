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
import { cn } from "../../utils/clsx";
import type { EqpRuleListDTO } from "./types";

type Props = {
  phases: string[];
  eqpRules: EqpRuleListDTO[];
  selectedPhase: string | null;
  onPhaseChange: (phase: string | null) => void;
  onRuleSelect: (ruleName: string) => void;
};

export function RuleDropdownSearch({
  phases,
  eqpRules,
  selectedPhase,
  onPhaseChange,
  onRuleSelect,
}: Props) {
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

  useEffect(() => { setEqpHighlightIdx(-1);  }, [filteredEqp]);
  useEffect(() => { setRuleHighlightIdx(-1); }, [filteredRules]);

  // ── 高亮捲入可視範圍 ──────────────────────────────────────
  useEffect(() => {
    if (eqpHighlightIdx < 0 || !eqpListRef.current) return;
    eqpListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]")
      [eqpHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [eqpHighlightIdx]);

  useEffect(() => {
    if (ruleHighlightIdx < 0 || !ruleListRef.current) return;
    ruleListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]")
      [ruleHighlightIdx]?.scrollIntoView({ block: "nearest" });
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

      {/* ── Phase ── */}
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

      {selectedPhase && (<>

        {/* ── EQP ID 輸入框 ── */}
        <div ref={eqpWrapperRef} className="relative w-44">
          <input
            ref={eqpInputRef}
            disabled={ruleDirectActive}
            className={cn(
              "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
              ruleDirectActive
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder:text-gray-300"
                : selectedEqpId
                ? "bg-blue-50 border-blue-300 text-blue-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            )}
            placeholder="EQP ID（選填）"
            value={eqpInput}
            onFocus={() => { if (!selectedEqpId) setEqpOpen(true); }}
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

        {/* ── Rule Name 輸入框 ── */}
        <div ref={ruleWrapperRef} className="relative w-56">
          <input
            ref={ruleInputRef}
            className={cn(
              "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
              pendingRule
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            )}
            placeholder={selectedEqpId ? "選取 Rule…" : "Rule Name"}
            value={ruleInput}
            onFocus={() => { if (!pendingRule) setRuleOpen(true); }}
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
    </div>
  );
}
