// DevBlockTooltip.tsx — BlockTooltip 獨立測試頁
import { useState } from "react";
import { BlockTooltip } from "../../components/RTDRuleViewer/BlockTooltip";
import { buildBlocks } from "../../components/RTDRuleViewer/blockUtils";
import { MOCK_RULE_DATA } from "../../components/RTDRuleViewer/devMock";
import type { Block } from "../../components/RTDRuleViewer/types";

const blocks = buildBlocks(MOCK_RULE_DATA[Object.keys(MOCK_RULE_DATA)[0]] ?? []);

export default function DevBlockTooltip() {
  const [hovered, setHovered] = useState<Block | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const CANVAS = { w: 600, h: 400 };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-slate-100">
      <div className="text-gray-500 text-xs font-mono">DevBlockTooltip — 將滑鼠移到 Block 上</div>

      <div
        className="relative bg-white rounded-lg border border-gray-200 overflow-hidden"
        style={{ width: CANVAS.w, height: CANVAS.h }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => { setHovered(null); setMousePos(null); }}
      >
        {/* Block 卡片模擬 */}
        {blocks.slice(0, 8).map((b, i) => (
          <div
            key={b.id}
            className="absolute px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-default font-mono truncate"
            style={{ left: 30 + (i % 4) * 140, top: 40 + Math.floor(i / 4) * 120, width: 120 }}
            onMouseEnter={() => setHovered(b)}
            onMouseLeave={() => setHovered(null)}
          >
            {b.type} / {b.id}
          </div>
        ))}

        <div className="absolute inset-0 pointer-events-none">
          <BlockTooltip block={hovered} mousePos={mousePos} canvasSize={CANVAS} />
        </div>
      </div>
    </div>
  );
}
