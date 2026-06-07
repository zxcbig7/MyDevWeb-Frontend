// ============================================================
// BlockTooltip.tsx
// 滑鼠 hover Block 時顯示的浮動提示
// ============================================================

import { useEffect, useRef, useState } from "react";
import type { Block } from "./types";

type BlockTooltipProps = {
  block: Block | null;
  mousePos: { x: number; y: number } | null;
  canvasSize: { w: number; h: number };
};

export function BlockTooltip({ block, mousePos, canvasSize }: BlockTooltipProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!ref.current || !mousePos) return;

    const rect = ref.current.getBoundingClientRect();

    let x = mousePos.x - rect.width / 2;
    let y = mousePos.y + 16;

    // 超出右邊界
    if (x + rect.width > canvasSize.w) x = canvasSize.w - rect.width - 4;
    // 超出左邊界
    if (x < 4) x = 4;
    // 超出下邊界時往上貼（顯示在滑鼠正上方）
    if (y + rect.height > canvasSize.h) y = mousePos.y - rect.height - 8;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ x, y });
  }, [mousePos, canvasSize]);

  if (!block) return null;

  const r = block.raw;

  return (
    <div
      ref={ref}
      className="absolute bg-black/90 text-white px-2 py-1.5 rounded text-[10px] pointer-events-none max-w-80"
      style={{
        left: pos?.x ?? -9999,
        top: pos?.y ?? -9999,
      }}
    >
      {r.VALUES.map((v, i) => {
        const meta = [v.KEY, [v.COLUMN1, v.COLUMN2].filter(Boolean).join("/") || null].filter(Boolean).join(" ");
        const val = v.VALUE ? (v.VALUE.length > 55 ? v.VALUE.slice(0, 55) + "…" : v.VALUE) : null;
        const line = [meta, val].filter(Boolean).join(" ");
        return <div key={i} className="opacity-80 truncate">{`{ ${line} }`}</div>;
      })}
    </div>
  );
}
