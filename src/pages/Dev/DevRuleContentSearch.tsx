// DevRuleContentSearch.tsx — RuleContentSearch + SearchNavigator 獨立測試頁
import { useState } from "react";
import { RuleContentSearch, SearchNavigator, type MatchResult } from "../../components/RTDRuleViewer/RuleContentSearch";
import { MOCK_RULE_DATA } from "../../components/RTDRuleViewer/devMock";

const RULE_KEYS = Object.keys(MOCK_RULE_DATA);

export default function DevRuleContentSearch() {
  const [ruleKey, setRuleKey] = useState(RULE_KEYS[0]);
  const [searchKey, setSearchKey] = useState(0);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [idx, setIdx] = useState(0);

  const rules = MOCK_RULE_DATA[ruleKey] ?? [];

  function handleRuleChange(k: string) {
    setRuleKey(k);
    setMatches(null);
    setKeyword("");
    setIdx(0);
    setSearchKey((n) => n + 1);
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-slate-800">
      <div className="text-white/50 text-xs font-mono">DevRuleContentSearch</div>

      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">Rule：</span>
        <select
          className="border border-slate-600 rounded px-2 py-1 text-sm bg-slate-700 text-white"
          value={ruleKey}
          onChange={(e) => handleRuleChange(e.target.value)}
        >
          {RULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <span className="text-slate-500 text-xs">{rules.length} blocks</span>
      </div>

      <div className="bg-slate-900 rounded-lg p-4 flex flex-col gap-3 w-80">
        <RuleContentSearch
          key={searchKey}
          rules={rules}
          onMatchChange={(list, kw) => { setMatches(list); setKeyword(kw); setIdx(0); }}
        />
        {matches && (
          <div className="flex items-center gap-2">
            <SearchNavigator
              total={matches.length}
              index={idx}
              onPrev={() => setIdx((i) => Math.max(0, i - 1))}
              onNext={() => setIdx((i) => Math.min(matches.length - 1, i + 1))}
            />
            <span className="text-slate-400 text-xs ml-auto">{matches.length} matches</span>
          </div>
        )}
      </div>

      <div className="bg-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1 overflow-auto max-h-64">
        <div className="text-slate-500 mb-2">keyword: "{keyword}"</div>
        {matches?.map((m, i) => (
          <div key={m.id} className={i === idx ? "text-green-400" : ""}>
            {i + 1}. {m.id} {m.snippet && <span className="text-slate-500">— {m.snippet}</span>}
          </div>
        ))}
        {matches?.length === 0 && <div className="text-slate-500">no matches</div>}
        {matches === null && <div className="text-slate-500">尚未搜尋</div>}
      </div>
    </div>
  );
}
