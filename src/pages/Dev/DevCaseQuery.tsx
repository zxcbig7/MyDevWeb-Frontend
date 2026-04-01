// DevCaseQuery.tsx — CaseQuery (Tracker) 獨立測試頁
import { useState } from "react";
import { CaseQuery } from "../../components/RTDRuleViewer/CaseQuery";
import { MOCK_RULE_DATA } from "../../components/RTDRuleViewer/devMock";

const RULE_KEYS = Object.keys(MOCK_RULE_DATA);

export default function DevCaseQuery() {
  const [ruleKey, setRuleKey] = useState(RULE_KEYS[0]);
  const [logIds, setLogIds] = useState<string[]>([]);
  const [varIds, setVarIds] = useState<string[]>([]);

  const rules = MOCK_RULE_DATA[ruleKey] ?? [];

  return (
    <div className="h-full flex gap-4 p-4 bg-slate-900">
      <div className="w-80 shrink-0 flex flex-col gap-3 bg-slate-800 rounded-xl p-3 min-h-0">
        <div className="flex items-center gap-2 shrink-0">
          <select
            className="flex-1 border border-slate-600 rounded px-2 py-1 text-sm bg-slate-700 text-white"
            value={ruleKey}
            onChange={(e) => setRuleKey(e.target.value)}
          >
            {RULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div className="flex-1 min-h-0 flex flex-col text-white">
          <CaseQuery
            key={ruleKey}
            rules={rules}
            selectedRule={ruleKey}
            onHighlight={(l, v) => { setLogIds(l); setVarIds(v); }}
          />
        </div>
      </div>

      {/* 高亮結果 */}
      <div className="flex-1 bg-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto">
        <div className="text-slate-500 mb-3">onHighlight 回傳值</div>
        <div className="mb-2">
          <span className="text-yellow-400">logIds</span>（{logIds.length}）：
          {logIds.length === 0
            ? <span className="text-slate-600">[]</span>
            : logIds.map((id) => <span key={id} className="ml-1 px-1 bg-yellow-500/20 text-yellow-300 rounded">{id}</span>)
          }
        </div>
        <div>
          <span className="text-purple-400">varIds</span>（{varIds.length}）：
          {varIds.length === 0
            ? <span className="text-slate-600">[]</span>
            : varIds.map((id) => <span key={id} className="ml-1 px-1 bg-purple-500/20 text-purple-300 rounded">{id}</span>)
          }
        </div>
      </div>
    </div>
  );
}
