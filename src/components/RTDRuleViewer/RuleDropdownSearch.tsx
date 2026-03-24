// ============================================================
// RuleDropdownSearch.tsx
// 兩階段 Rule 選擇：先選 Phase，再透過 EQP ID 或 Rule Name 載入
// 互斥邏輯：
//   EQP 有輸入 → Rule Name 自動帶入（唯讀）
//   Rule Name 有輸入 → EQP 欄位停用
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import { cn } from "../../utls/clsx";
import type { MachineRule } from "./types";

type Props = {
  phases: string[];
  selectedPhase: string | null;
  ruleNames: string[];
  machineRuleMap: MachineRule[];
  onPhaseChange: (phase: string | null) => void;
  onRuleSelect: (ruleName: string) => void;
};

export function RuleDropdownSearch({
  phases,
  selectedPhase,
  ruleNames,
  machineRuleMap,
  onPhaseChange,
  onRuleSelect,
}: Props) {
  // ── EQP state ─────────────────────────────────────────────
  const [eqpInput, setEqpInput]             = useState("");
  const [pendingMachine, setPendingMachine] = useState<MachineRule | null>(null);
  const [eqpOpen, setEqpOpen]               = useState(false);
  const [eqpHighlightIdx, setEqpHighlightIdx] = useState(-1);

  // ── Rule state ────────────────────────────────────────────
  const [ruleInput, setRuleInput]           = useState("");
  const [pendingRule, setPendingRule]       = useState<string | null>(null);
  const [ruleOpen, setRuleOpen]             = useState(false);
  const [ruleHighlightIdx, setRuleHighlightIdx] = useState(-1);

  const eqpWrapperRef  = useRef<HTMLDivElement>(null);
  const eqpInputRef    = useRef<HTMLInputElement>(null);
  const eqpListRef     = useRef<HTMLUListElement>(null);
  const ruleWrapperRef = useRef<HTMLDivElement>(null);
  const ruleInputRef   = useRef<HTMLInputElement>(null);
  const ruleListRef    = useRef<HTMLUListElement>(null);

  // 互斥狀態：哪個欄位目前「主導」
  const eqpActive  = !!eqpInput;   // EQP 有輸入 → Rule 唯讀
  const ruleActive = !!ruleInput;  // Rule 有輸入 → EQP 停用

  // ── Phase 切換時全部清空 ──────────────────────────────────
  useEffect(() => {
    setEqpInput(""); setPendingMachine(null); setEqpOpen(false); setEqpHighlightIdx(-1);
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
    if (!kw) return machineRuleMap;
    return machineRuleMap.filter((m) => m.machineId.toLowerCase().includes(kw));
  }, [machineRuleMap, eqpInput]);

  const filteredRules = useMemo(() => {
    const kw = ruleInput.trim().toLowerCase();
    if (!kw) return ruleNames;
    return ruleNames.filter((r) => r.toLowerCase().includes(kw));
  }, [ruleNames, ruleInput]);

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
  const canLoad = !!pendingMachine || !!pendingRule;

  function handleLoad() {
    const target = pendingMachine?.ruleName ?? pendingRule;
    if (target) onRuleSelect(target);
  }

  // ── EQP 操作 ──────────────────────────────────────────────
  function confirmEqp(m: MachineRule) {
    setEqpInput(m.machineId);
    setPendingMachine(m);
    setEqpOpen(false);
    setEqpHighlightIdx(-1);
  }

  function clearEqp() {
    setEqpInput(""); setPendingMachine(null); setEqpOpen(false); setEqpHighlightIdx(-1);
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
        confirmEqp(filteredEqp[eqpHighlightIdx]);
      else if (pendingMachine) handleLoad();
    } else if (e.key === "Escape") {
      setEqpOpen(false); setEqpHighlightIdx(-1);
    }
  }

  // ── Rule 操作 ─────────────────────────────────────────────
  function confirmRule(opt: string) {
    setRuleInput(opt); setPendingRule(opt); setRuleOpen(false); setRuleHighlightIdx(-1);
  }

  function clearRule() {
    setRuleInput(""); setPendingRule(null); setRuleOpen(false); setRuleHighlightIdx(-1);
  }

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
        placeholder="選擇 Phase"
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
            disabled={ruleActive}
            className={cn(
              "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
              ruleActive
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder:text-gray-300"
                : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            )}
            placeholder="EQP ID"
            value={eqpInput}
            onFocus={() => { if (!pendingMachine) setEqpOpen(true); }}
            onChange={(e) => { setEqpInput(e.target.value); setPendingMachine(null); setEqpOpen(true); }}
            onKeyDown={handleEqpKeyDown}
          />
          {eqpInput && !ruleActive && (
            <button
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); clearEqp(); eqpInputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer leading-none"
            >×</button>
          )}
          {eqpOpen && !ruleActive && (
            <ul ref={eqpListRef} className="absolute top-full left-0 mt-1 w-full max-h-55 overflow-y-auto border border-gray-300 bg-white shadow-md list-none p-0 m-0 z-2000 rounded">
              {filteredEqp.length === 0
                ? <li className="px-3 py-2 text-gray-400 text-sm cursor-default">No matches</li>
                : filteredEqp.map((m, i) => (
                  <li key={m.machineId} data-item
                    className={cn("px-3 py-2 text-sm cursor-pointer",
                      i === eqpHighlightIdx                    ? "bg-blue-200 text-blue-500"
                      : m.machineId === pendingMachine?.machineId ? "bg-blue-50 text-blue-500"
                      : "hover:bg-gray-100"
                    )}
                    onMouseDown={(e) => { e.preventDefault(); confirmEqp(m); }}
                  >
                    {m.machineId}
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
            // EQP 有選：唯讀顯示對應 rule；EQP 有輸入中：停用
            disabled={eqpActive}
            readOnly={!!pendingMachine}
            className={cn(
              "w-full h-8 px-3 pr-7 text-sm rounded border outline-none transition-colors",
              pendingMachine
                ? "bg-blue-50 border-blue-200 text-blue-700 cursor-default"
                : eqpActive
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder:text-gray-300"
                : "bg-white border-gray-300 placeholder:text-gray-400 cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            )}
            placeholder="Rule Name"
            value={pendingMachine ? pendingMachine.ruleName : ruleInput}
            onFocus={() => { if (!pendingRule && !eqpActive) setRuleOpen(true); }}
            onChange={(e) => {
              if (pendingMachine || eqpActive) return;
              setRuleInput(e.target.value); setPendingRule(null); setRuleOpen(true);
            }}
            onKeyDown={handleRuleKeyDown}
          />
          {ruleInput && !eqpActive && (
            <button
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); clearRule(); ruleInputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer leading-none"
            >×</button>
          )}
          {ruleOpen && !eqpActive && (
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
