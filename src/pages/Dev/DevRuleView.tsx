// DevRuleView.tsx — RuleView Canvas 獨立測試頁
import { useRef, useState } from "react";
import { RuleView } from "../../components/RTDRuleViewer/RuleView";
import {
  DEV_MOCK_RULES,
  DEV_MOCK_RULE_ICON,
  MOCK_RULE_DATA,
} from "../../components/RTDRuleViewer/devMock";
import type { RuleData, RuleViewHandle } from "../../components/RTDRuleViewer/types";

// MOCK_RULE_DATA / DEV_MOCK_* 已經是 RuleData[]，不需要再 convertDtosToData
const ALL_DATASETS: Record<string, RuleData[]> = {
  "主副線範例": DEV_MOCK_RULES,
  "Icon 總覽":  DEV_MOCK_RULE_ICON,
  ...MOCK_RULE_DATA,
};

export default function DevRuleView() {
  const [selected, setSelected] = useState<string>(Object.keys(ALL_DATASETS)[0]);
  const [useNewIcons, setUseNewIcons] = useState(true);
  const ref = useRef<RuleViewHandle | null>(null);
  const rules = ALL_DATASETS[selected] ?? [];

  return (
    <div className="h-full flex flex-col gap-3 p-3 bg-slate-100">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200">
        <span className="font-semibold text-gray-600 text-sm">RuleView</span>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {Object.keys(ALL_DATASETS).map((k) => (
            <option key={k} value={k}>{k}（{ALL_DATASETS[k].length} blocks）</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={useNewIcons} onChange={(e) => setUseNewIcons(e.target.checked)} />
          Moderns
        </label>
      </div>

      <div className="flex-1 min-h-0 rounded-lg bg-white border border-gray-200 overflow-hidden">
        <RuleView
          ref={ref}
          rules={rules}
          matchedBlockIds={null}
          useNewIcons={useNewIcons}
        />
      </div>
    </div>
  );
}
