// ============================================================
// RuleDropdownSearch.tsx
// 兩階段 Rule 選擇：先選 Phase，再搜尋選 Rule Name，按鈕後載入
// 支援兩種查詢模式：
//   rule    → 直接搜尋 Rule Name
//   machine → 搜尋機台號，自動帶出對應 Rule Name
// 鍵盤支援：Phase↑↓Enter → 聚焦輸入框；輸入框↑↓Enter → 確認選擇
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import { cn } from "../../utls/clsx";
import type { MachineRule } from "./types";

type SearchMode = "rule" | "eqp";

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
  const [mode, setMode] = useState<SearchMode>("rule");

  // ── Rule 模式 state ────────────────────────────────────────
  const [ruleInput, setRuleInput]               = useState("");
  const [pendingRule, setPendingRule]           = useState<string | null>(null);
  const [ruleOpen, setRuleOpen]                 = useState(false);
  const [ruleHighlightIdx, setRuleHighlightIdx] = useState(-1);

  // ── Machine 模式 state ────────────────────────────────────
  const [machineInput, setMachineInput]                   = useState("");
  const [pendingMachine, setPendingMachine]               = useState<MachineRule | null>(null);
  const [machineOpen, setMachineOpen]                     = useState(false);
  const [machineHighlightIdx, setMachineHighlightIdx]     = useState(-1);

  const ruleWrapperRef    = useRef<HTMLDivElement>(null);
  const ruleInputRef      = useRef<HTMLInputElement>(null);
  const ruleListRef       = useRef<HTMLUListElement>(null);
  const machineWrapperRef = useRef<HTMLDivElement>(null);
  const machineInputRef   = useRef<HTMLInputElement>(null);
  const machineListRef    = useRef<HTMLUListElement>(null);

  // ── Phase 切換時全部清空 ──────────────────────────────────
  useEffect(() => {
    setRuleInput(""); setPendingRule(null); setRuleOpen(false); setRuleHighlightIdx(-1);
    setMachineInput(""); setPendingMachine(null); setMachineOpen(false); setMachineHighlightIdx(-1);
  }, [selectedPhase]);

  // ── Mode 切換時清空各自 state ─────────────────────────────
  useEffect(() => {
    setRuleInput(""); setPendingRule(null); setRuleOpen(false); setRuleHighlightIdx(-1);
    setMachineInput(""); setPendingMachine(null); setMachineOpen(false); setMachineHighlightIdx(-1);
  }, [mode]);

  // ── 點外部關閉 rule 下拉 ──────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ruleWrapperRef.current && !ruleWrapperRef.current.contains(e.target as Node))
        setRuleOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── 點外部關閉 machine 下拉 ───────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (machineWrapperRef.current && !machineWrapperRef.current.contains(e.target as Node))
        setMachineOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Rule 篩選 ─────────────────────────────────────────────
  const filteredRules = useMemo(() => {
    const kw = ruleInput.trim().toLowerCase();
    if (!kw) return ruleNames;
    return ruleNames.filter((r) => r.toLowerCase().includes(kw));
  }, [ruleNames, ruleInput]);

  // ── Machine 篩選 ──────────────────────────────────────────
  const filteredMachines = useMemo(() => {
    const kw = machineInput.trim().toLowerCase();
    if (!kw) return machineRuleMap;
    return machineRuleMap.filter((m) => m.machineId.toLowerCase().includes(kw));
  }, [machineRuleMap, machineInput]);

  useEffect(() => { setRuleHighlightIdx(-1);    }, [filteredRules]);
  useEffect(() => { setMachineHighlightIdx(-1); }, [filteredMachines]);

  // ── 高亮項目捲入可視範圍 ──────────────────────────────────
  useEffect(() => {
    if (ruleHighlightIdx < 0 || !ruleListRef.current) return;
    ruleListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]")
      [ruleHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [ruleHighlightIdx]);

  useEffect(() => {
    if (machineHighlightIdx < 0 || !machineListRef.current) return;
    machineListRef.current.querySelectorAll<HTMLLIElement>("li[data-item]")
      [machineHighlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [machineHighlightIdx]);

  const phaseOptions = phases.map((p) => ({ label: p, value: p }));

  // ── Rule 模式操作 ──────────────────────────────────────────
  function confirmRule(opt: string) {
    setRuleInput(opt); setPendingRule(opt); setRuleOpen(false); setRuleHighlightIdx(-1);
  }

  function handleLoad() {
    const target = mode === "rule" ? pendingRule : pendingMachine?.ruleName ?? null;
    if (target) onRuleSelect(target);
  }

  const canLoad = mode === "rule" ? !!pendingRule : !!pendingMachine;

  function handleRuleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setRuleOpen(true);
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

  // ── Machine 模式操作 ──────────────────────────────────────
  function confirmMachine(m: MachineRule) {
    setMachineInput(m.machineId);
    setPendingMachine(m);
    setMachineOpen(false);
    setMachineHighlightIdx(-1);
  }

  function handleMachineKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMachineOpen(true);
      setMachineHighlightIdx((i) => Math.min(i + 1, filteredMachines.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMachineHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (machineOpen && machineHighlightIdx >= 0 && filteredMachines[machineHighlightIdx])
        confirmMachine(filteredMachines[machineHighlightIdx]);
      else if (pendingMachine) handleLoad();
    } else if (e.key === "Escape") {
      setMachineOpen(false); setMachineHighlightIdx(-1);
    }
  }

  return (
    <div className="flex items-center gap-2">

      {/* ── Phase ── */}
      <Select
        placeholder="選擇 Phase"
        options={phaseOptions}
        value={selectedPhase ?? undefined}
        onChange={(v) => onPhaseChange(v ?? null)}
        onSelect={() => setTimeout(() => (mode === "rule" ? ruleInputRef : machineInputRef).current?.focus(), 50)}
        allowClear
        autoFocus
        style={{ width: 130 }}
        popupMatchSelectWidth={false}
        styles={{ popup: { root: { zIndex: 2000 } } }}
      />

      {selectedPhase && (<>

        {/* ── 模式切換 ── */}
        <div className="flex items-center text-xs rounded border border-white/15 bg-white/5 p-0.5 gap-0.5 shrink-0">
          {(["rule", "eqp"] as SearchMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn("px-2.5 py-1 rounded cursor-pointer transition-colors",
                mode === m
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {m === "rule" ? "Rule" : "EQP ID"}
            </button>
          ))}
        </div>

        {/* ── Rule 模式輸入框 ── */}
        {mode === "rule" && (
          <div ref={ruleWrapperRef} className="relative w-60">
            <input
              ref={ruleInputRef}
              className="w-full h-8 px-3 pr-7 text-sm rounded border outline-none
                bg-white border-gray-300 placeholder:text-gray-400
                cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
              placeholder="搜尋 Rule Name"
              value={ruleInput}
              onFocus={() => setRuleOpen(true)}
              onChange={(e) => { setRuleInput(e.target.value); setPendingRule(null); setRuleOpen(true); }}
              onKeyDown={handleRuleKeyDown}
            />
            {ruleInput && (
              <button
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); setRuleInput(""); setPendingRule(null); setRuleOpen(false); ruleInputRef.current?.focus(); }}
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
        )}

        {/* ── Machine 模式輸入框 ── */}
        {mode === "eqp" && (
          <div ref={machineWrapperRef} className="relative w-60">
            <input
              ref={machineInputRef}
              className="w-full h-8 px-3 pr-7 text-sm rounded border outline-none
                bg-white border-gray-300 placeholder:text-gray-400
                cursor-text focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
              placeholder="搜尋 EQP ID"
              value={machineInput}
              onFocus={() => { if (!pendingMachine) setMachineOpen(true); }}
              onChange={(e) => { setMachineInput(e.target.value); setPendingMachine(null); setMachineOpen(true); }}
              onKeyDown={handleMachineKeyDown}
            />
            {machineInput && (
              <button
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); setMachineInput(""); setPendingMachine(null); setMachineOpen(false); machineInputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer leading-none"
              >×</button>
            )}
            {machineOpen && (
              <ul ref={machineListRef} className="absolute top-full left-0 mt-1 w-full max-h-55 overflow-y-auto border border-gray-300 bg-white shadow-md list-none p-0 m-0 z-2000 rounded">
                {filteredMachines.length === 0
                  ? <li className="px-3 py-2 text-gray-400 text-sm cursor-default">No matches</li>
                  : filteredMachines.map((m, i) => (
                    <li key={m.machineId} data-item
                      className={cn("px-3 py-2 text-sm cursor-pointer",
                        i === machineHighlightIdx                  ? "bg-blue-200 text-blue-500"
                        : m.machineId === pendingMachine?.machineId ? "bg-blue-50 text-blue-500"
                        : "hover:bg-gray-100"
                      )}
                      onMouseDown={(e) => { e.preventDefault(); confirmMachine(m); }}
                    >
                      <span>{m.machineId}</span>
                      {/* 每個 machine 顯示對應的 rule name，方便確認 */}
                      <span className="ml-2 text-[11px] text-gray-400">→ {m.ruleName}</span>
                    </li>
                  ))
                }
              </ul>
            )}
            {/* 選完機台後顯示對應 Rule Name */}
            {pendingMachine && (
              <div className="absolute top-full left-0 mt-1 w-full px-3 py-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded z-2000">
                Rule：{pendingMachine.ruleName}
              </div>
            )}
          </div>
        )}

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
