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
    
    let x = mousePos.x + 12;
    let y = mousePos.y + 12;

    // 超出右邊界時往左貼
    if (x + rect.width > canvasSize.w) {
      x = canvasSize.w - rect.width - 4;
    }
    // 超出下邊界時往上貼
    if (y + rect.height > canvasSize.h) {
      y = canvasSize.h - rect.height - 4;
    }

    if (x < 4) x = 4;
    if (y < 4) y = 4;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ x, y });
  }, [mousePos, canvasSize]);

  if (!block) return null;

  const r = block.raw;

  return (
    <div
      ref={ref}
      className="absolute bg-black/90 text-white px-2 py-1.5 rounded text-xs pointer-events-none whitespace-nowrap"
      style={{
        left: pos?.x ?? -9999,
        top: pos?.y ?? -9999,
      }}
    >
      <div><b>Block:</b> {r.BLOCK_NAME}</div>
      <div><b>Type:</b>  {r.BLOCK_TYPE}</div>
      {r.KEY && <div><b>Key:</b> {r.KEY}</div>}
      <div><b>Conditions:</b> {r.VALUES.length}</div>
    </div>
  );
}
