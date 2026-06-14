// DevRuleDropdownSearch.tsx — RuleDropdownSearch 獨立測試頁
import { useState } from "react";
import { RuleDropdownSearch } from "../../components/RTDRuleViewer/RuleDropdownSearch";
import { MOCK_EQP_RULES, MOCK_PHASES } from "../../components/RTDRuleViewer/devMock";

export default function DevRuleDropdownSearch() {
  const [selectedFab, setSelectedFab] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-slate-800">
      <div className="text-white/50 text-xs font-mono">DevRuleDropdownSearch</div>

      <div className="px-4 py-3 bg-slate-700 rounded-xl flex items-center gap-3">
        <RuleDropdownSearch
          phases={[...MOCK_PHASES]}
          eqpRules={MOCK_EQP_RULES}
          selectedFab={selectedFab}
          selectedPhase={selectedPhase}
          onFabChange={(f) => { setSelectedFab(f); setSelectedPhase(null); setSelectedRule(null); }}
          onPhaseChange={(p) => { setSelectedPhase(p); setSelectedRule(null); }}
          onRuleSelect={setSelectedRule}
        />
      </div>

      <div className="bg-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1">
        <div><span className="text-slate-500">selectedFab:  </span> {selectedFab   ?? "null"}</div>
        <div><span className="text-slate-500">selectedPhase:</span> {selectedPhase ?? "null"}</div>
        <div><span className="text-slate-500">selectedRule: </span> {selectedRule  ?? "null"}</div>
      </div>
    </div>
  );
}
