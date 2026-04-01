// DevTableInspector.tsx — TableInspector 獨立測試頁
import { useRef, useState } from "react";
import { TableInspector, type TableRow } from "../../components/RTDRuleViewer/tableinfo";

// Mock 資料：模擬 API 回傳的資料表內容
const MOCK_TABLES: Record<string, TableRow[]> = {
  "WIP_LOT": Array.from({ length: 30 }, (_, i) => ({
    LOT_ID: `LOT-${String(i + 1).padStart(4, "0")}`,
    GRADE: ["A", "B", "C"][i % 3],
    HOLD_FLAG: i % 5 === 0 ? "Y" : "N",
    STEP_ID: `STEP-${(i % 8) + 1}`,
    STATUS: ["RUN", "WAIT", "HOLD"][i % 3],
    CREATE_TIME: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  "EQP_STATUS": Array.from({ length, length: 15 }, (_, i) => ({
    EQUIP_CODE: `EQP-${String(i + 1).padStart(3, "0")}`,
    STATUS: ["RUN", "IDLE", "DOWN", "PM"][i % 4],
    RECORD_TIME: `2025-03-${String((i % 28) + 1).padStart(2, "0")} 08:00:00`,
    CHAMBER: i % 2 === 0 ? "A" : "B",
  })),
  "RECIPE_MASTER": Array.from({ length: 20 }, (_, i) => ({
    RECIPE_NAME: `RECIPE-${String(i + 1).padStart(3, "0")}`,
    EQUIP_CODE: `EQP-${String((i % 5) + 1).padStart(3, "0")}`,
    VERSION: `V${(i % 4) + 1}.0`,
    EFFECTIVE_DATE: `2025-0${(i % 9) + 1}-01`,
    AUTHOR: `user${(i % 3) + 1}`,
  })),
};

const TABLE_NAMES = Object.keys(MOCK_TABLES);

export default function DevTableInspector() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [openTables, setOpenTables] = useState<string[]>([]);
  const [focusStack, setFocusStack] = useState<string[]>([]);

  function openTable(name: string) {
    if (!openTables.includes(name)) {
      setOpenTables((prev) => [...prev, name]);
      setFocusStack((prev) => [...prev, name]);
    }
  }

  function closeTable(name: string) {
    setOpenTables((prev) => prev.filter((t) => t !== name));
    setFocusStack((prev) => prev.filter((t) => t !== name));
  }

  function focusTable(name: string) {
    setFocusStack((prev) => [...prev.filter((t) => t !== name), name]);
  }

  return (
    <div className="h-full flex gap-4 p-4 bg-slate-100">
      {/* 左側：資料表列表 */}
      <div className="w-48 shrink-0 flex flex-col gap-2">
        <div className="text-gray-500 text-xs font-mono">可用資料表</div>
        {TABLE_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => openTable(name)}
            className="text-left px-3 py-2 rounded border text-sm font-mono bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
          >
            {name}
            <span className="text-gray-400 text-xs ml-1">({MOCK_TABLES[name].length})</span>
          </button>
        ))}
      </div>

      {/* 右側：TableInspector 浮動區 */}
      <div ref={wrapperRef} className="flex-1 relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
          點擊左側資料表開啟 TableInspector
        </div>

        {openTables.map((name, i) => (
          <TableInspector
            key={name}
            tableName={name}
            data={MOCK_TABLES[name]}
            initialX={40 + i * 30}
            initialY={40 + i * 30}
            wrapperRef={wrapperRef}
            inspectorDraggingRef={draggingRef}
            zIndex={200 + focusStack.indexOf(name)}
            onClose={() => closeTable(name)}
            onFocus={() => focusTable(name)}
          />
        ))}
      </div>
    </div>
  );
}
