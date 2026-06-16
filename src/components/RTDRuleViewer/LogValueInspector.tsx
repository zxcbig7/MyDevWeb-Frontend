// ============================================================
// LogValueInspector.tsx
// 浮動小面板：對照某 block 的變數在 Runtime Log 的數值。
// 從 BlockInspector 的「Log Value」鈕開啟（需先在 Runtime Log 設值）。
// 看 rule block 邏輯時當「已知值」的參考。
// ============================================================

import { useMemo, useRef, useState } from "react";
import { cn } from "../../utils/clsx";
import type { Block } from "./types";
import { extractVars } from "./apfParse";

type Props = {
  block: Block;
  runtimeValues: Record<string, string>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  inspectorDraggingRef: React.MutableRefObject<boolean>;
  initialX: number;
  initialY: number;
  zIndex?: number;
  onClose: () => void;
};

const isField = (s: string): boolean => /^[A-Z][A-Z0-9_]+$/.test(s);

export function LogValueInspector({
  block,
  runtimeValues,
  inspectorDraggingRef,
  initialX,
  initialY,
  zIndex = 200,
  onClose,
}: Props) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragRef = useRef({ dragging: false, ox: 0, oy: 0, sx: 0, sy: 0 });

  // 該 block 牽涉到的變數（COLUMN1/2 欄位 + VALUE 引用），對照 runtime 數值
  const rows = useMemo(() => {
    const r = block.raw;
    const names = new Set<string>();
    const addCols = (s: string | null): void =>
      s?.split(",").forEach((c) => {
        const t = c.trim();
        if (isField(t)) names.add(t);
      });
    for (const v of r.VALUES ?? []) {
      addCols(v.COLUMN1);
      addCols(v.COLUMN2);
      if (v.VALUE)
        for (const d of extractVars(v.VALUE, "result")) names.add(d.varName);
    }
    return [...names]
      .sort()
      .map((name) => ({ name, value: runtimeValues[name] }));
  }, [block, runtimeValues]);

  const onHeaderDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    inspectorDraggingRef.current = true;
    dragRef.current = {
      dragging: true,
      ox: pos.x,
      oy: pos.y,
      sx: e.clientX,
      sy: e.clientY,
    };
    const move = (ev: MouseEvent): void => {
      if (!dragRef.current.dragging) return;
      setPos({
        x: dragRef.current.ox + (ev.clientX - dragRef.current.sx),
        y: dragRef.current.oy + (ev.clientY - dragRef.current.sy),
      });
    };
    const up = (): void => {
      dragRef.current.dragging = false;
      inspectorDraggingRef.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className="absolute top-0 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-800 w-64 overflow-hidden"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, zIndex }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 cursor-move select-none"
        onMouseDown={onHeaderDown}
      >
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500 text-white shrink-0">
          Log Value
        </span>
        <strong className="text-xs truncate min-w-0">
          {block.raw.BLOCK_NAME}
        </strong>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="ml-auto text-gray-400 hover:text-gray-700 cursor-pointer text-sm leading-none bg-transparent border-0"
        >
          ✕
        </button>
      </div>
      <div className="p-2 max-h-80 overflow-auto flex flex-col gap-1">
        {rows.length === 0 ? (
          <div className="text-xs text-gray-400 px-1 py-2 text-center">
            此 block 無可對應的變數
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center gap-2 text-xs px-1.5 py-1 rounded border border-gray-100"
            >
              <span className="font-mono font-semibold text-gray-700 truncate min-w-0">
                {row.name}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono px-1.5 py-px rounded shrink-0",
                  row.value !== undefined
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400",
                )}
              >
                {row.value !== undefined ? row.value : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
