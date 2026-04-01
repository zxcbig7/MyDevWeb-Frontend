// DevBlockInspector.tsx — BlockInspector 獨立測試頁
import { useRef, useState } from "react";
import { BlockInspector } from "../../components/RTDRuleViewer/BlockInspector";
import { buildBlocks } from "../../components/RTDRuleViewer/blockUtils";
import { MOCK_RULE_DATA } from "../../components/RTDRuleViewer/devMock";
import type { Block } from "../../components/RTDRuleViewer/types";

const RULE_KEYS = Object.keys(MOCK_RULE_DATA);

export default function DevBlockInspector() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [ruleKey, setRuleKey] = useState(RULE_KEYS[0]);
  const [openBlocks, setOpenBlocks] = useState<Block[]>([]);
  const [focusStack, setFocusStack] = useState<string[]>([]);

  const rules = MOCK_RULE_DATA[ruleKey] ?? [];
  const blocks = buildBlocks(rules);

  function openBlock(b: Block) {
    if (openBlocks.some((x) => x.id === b.id)) return;
    setOpenBlocks((prev) => [...prev, b]);
    setFocusStack((prev) => [...prev, b.id]);
  }

  function closeBlock(id: string) {
    setOpenBlocks((prev) => prev.filter((b) => b.id !== id));
    setFocusStack((prev) => prev.filter((x) => x !== id));
  }

  function focusBlock(id: string) {
    setFocusStack((prev) => [...prev.filter((x) => x !== id), id]);
  }

  return (
    <div className="h-full flex gap-4 p-4 bg-slate-100">
      {/* 左側：Block 列表 */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            value={ruleKey}
            onChange={(e) => { setRuleKey(e.target.value); setOpenBlocks([]); setFocusStack([]); }}
          >
            {RULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 overflow-auto">
          {blocks.map((b) => (
            <button
              key={b.id}
              onClick={() => openBlock(b)}
              className="text-left px-3 py-1.5 rounded border text-xs font-mono bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors truncate"
            >
              <span className="text-gray-400 mr-1">{b.type}</span>
              {b.id}
            </button>
          ))}
        </div>
      </div>

      {/* 右側：Inspector 浮動區 */}
      <div ref={wrapperRef} className="flex-1 relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
          點擊左側 Block 開啟 Inspector
        </div>
        {openBlocks.map((b) => (
          <BlockInspector
            key={b.id}
            block={b}
            initialX={40}
            initialY={40}
            wrapperRef={wrapperRef}
            inspectorDraggingRef={draggingRef}
            zIndex={100 + focusStack.indexOf(b.id)}
            onClose={() => closeBlock(b.id)}
            onFocus={() => focusBlock(b.id)}
          />
        ))}
      </div>
    </div>
  );
}
