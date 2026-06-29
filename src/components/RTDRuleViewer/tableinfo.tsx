// ============================================================
// tableinfo.tsx
// 浮動資料表面板：顯示 Block KEY 對應的 DB 資料表內容
// 支援：欄位搜尋、排序、拖曳交換欄位順序、欄位寬度調整
//
// 使用方式：
//   從 Block 的 KEY 取得資料表名稱 → 呼叫 API 取得資料 →
//   傳入此元件渲染浮動資料表
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type ColumnOrderState,
  type PaginationState,
  type Header,
  type Table,
} from "@tanstack/react-table";
import { cn } from "../../utils/clsx";



// ── Types ──────────────────────────────────────────────────────

export type TableRow = Record<string, unknown>;

export type TableInspectorProps = {
  tableName: string;
  data: TableRow[] | null;
  columnOrderHint?: string[]; // 指定欄位顯示順序（無則由 data keys 推導）
  isLoading?: boolean;
  initialX: number;
  initialY: number;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  inspectorDraggingRef: React.RefObject<boolean>;
  onFocus?: () => void;
  zIndex?: number;
};

// ── DraggableColumnHeader ──────────────────────────────────────
// 可拖曳排序 + 點擊排序 + 搜尋 + 欄位寬度調整

function DraggableColumnHeader({
  header,
  table,
}: {
  header: Header<TableRow, unknown>;
  table: Table<TableRow>;
}) {
  const { column } = header;
  const [dragOver, setDragOver] = useState(false);

  return (
    <th
      className={cn(
        "relative select-none text-left text-xs font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200 last:border-r-0",
        dragOver && "bg-blue-100"
      )}
      style={{ width: header.getSize(), minWidth: 80 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", column.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fromId = e.dataTransfer.getData("text/plain");
        if (fromId === column.id) return;
        const order = table.getState().columnOrder;
        const fromIdx = order.indexOf(fromId);
        const toIdx = order.indexOf(column.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const newOrder = [...order];
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, fromId);
        table.setColumnOrder(newOrder);
      }}
    >
      {/* 欄位名稱 + 排序指示器 */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={column.getToggleSortingHandler()}
      >
        <span className="truncate font-mono">
          {flexRender(column.columnDef.header, header.getContext())}
        </span>
        <span className="text-gray-400 text-[10px] shrink-0">
          {{ asc: "▲", desc: "▼" }[column.getIsSorted() as string] ?? "⇅"}
        </span>
      </div>

      {/* 欄位搜尋 */}
      <div className="px-1 pb-1">
        <input
          className="w-full text-[11px] px-1.5 py-0.5 rounded border border-gray-200 bg-white outline-none
            focus:border-blue-400 placeholder:text-gray-300 font-mono"
          placeholder="搜尋…"
          value={(column.getFilterValue() as string) ?? ""}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* 欄位寬度調整把手 */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
    </th>
  );
}

// ── TableInspector ─────────────────────────────────────────────

export function TableInspector({
  tableName,
  data,
  columnOrderHint,
  isLoading = false,
  initialX,
  initialY,
  wrapperRef,
  onClose,
  inspectorDraggingRef,
  onFocus,
  zIndex = 200,
}: TableInspectorProps) {
  "use no memo"; // TanStack Table 與 React Compiler 不相容，明確 opt-out

  const panelRef = useRef<HTMLDivElement | null>(null);

  // ── 面板拖曳 ────────────────────────────────────────────────
  const dragRef = useRef({
    dragging: false,
    startX: 0, startY: 0,
    originX: initialX, originY: initialY,
  });

  // ── 面板縮放 ────────────────────────────────────────────────
  const resizeRef = useRef({
    resizing: false,
    startX: 0, startY: 0,
    startW: 0, startH: 0,
  });

  // 初始位置
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transform = `translate(${initialX}px, ${initialY}px)`;
  }, [initialX, initialY]);

  // 拖曳 / resize 全域事件
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const panel = panelRef.current;
      const wrapper = wrapperRef.current;
      if (!panel || !wrapper) return;

      if (resizeRef.current.resizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const wrapperRect = wrapper.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const maxW = wrapperRect.width - panelRect.left + wrapperRect.left;
        const maxH = wrapperRect.height - panelRect.top + wrapperRect.top;
        panel.style.width = Math.min(Math.max(400, resizeRef.current.startW + dx), maxW) + "px";
        panel.style.height = Math.min(Math.max(250, resizeRef.current.startH + dy), maxH) + "px";
        return;
      }

      if (!dragRef.current.dragging) return;
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let x = dragRef.current.originX + (mx - dragRef.current.startX);
      let y = dragRef.current.originY + (my - dragRef.current.startY);
      const panelRect = panel.getBoundingClientRect();
      x = Math.max(0, Math.min(x, rect.width - panelRect.width));
      y = Math.max(0, Math.min(y, rect.height - panelRect.height));
      panel.style.transform = `translate(${x}px, ${y}px)`;
    }

    function onMouseUp() {
      const panel = panelRef.current;
      const wrapper = wrapperRef.current;
      if (!panel || !wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      if (resizeRef.current.resizing || dragRef.current.dragging) {
        resizeRef.current.resizing = false;
        dragRef.current.dragging = false;
        dragRef.current.originX = panel.getBoundingClientRect().left - rect.left;
        dragRef.current.originY = panel.getBoundingClientRect().top - rect.top;
        inspectorDraggingRef.current = false;
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [inspectorDraggingRef, wrapperRef]);

  // ── @tanstack/react-table 設定 ──────────────────────────────

  // 從資料第一列動態產生欄位定義
  const columns = useMemo<ColumnDef<TableRow, unknown>[]>(() => {
    if (!data || data.length === 0) return [];
    // 欄序：優先用 columnOrderHint（general-col 解析時的定義順序）；否則收集所有 row 的 key（處理稀疏資料）
    let keys: string[];
    if (columnOrderHint && columnOrderHint.length > 0) {
      keys = columnOrderHint;
    } else {
      const keySet = new Set<string>();
      for (const row of data) {
        for (const key of Object.keys(row)) keySet.add(key);
      }
      keys = [...keySet];
    }
    return keys.map((key) => ({
      id: key,
      accessorKey: key,
      header: key,
      cell: (info: { getValue: () => unknown }) => {
        const val = info.getValue();
        if (val == null) return <span className="text-gray-300 italic">null</span>;
        return String(val);
      },
      size: 150,
      minSize: 80,
      filterFn: "includesString" as const,
    }));
  }, [data, columnOrderHint]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 });

  // 欄位定義變更時重置欄位順序
  useEffect(() => {
    if (columns.length > 0) {
      setColumnOrder(columns.map((c) => c.id!));
      setSorting([]);
      setColumnFilters([]);
    }
  }, [columns]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, columnFilters, columnOrder, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = data?.length ?? 0;
  const pageCount = table.getPageCount();

  // ── Render ──────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="absolute top-0 left-0 w-175 h-105 flex flex-col bg-white
        shadow-[0_12px_30px_rgba(0,0,0,0.18)] pointer-events-auto overflow-hidden
        border border-gray-200 rounded"
      style={{ zIndex }}
      onMouseDown={(e) => { e.stopPropagation(); onFocus?.(); }}
    >
      {/* ── Header（拖曳區） ── */}
      <div
        className="flex items-center gap-2 select-none px-3 py-2 shrink-0 cursor-move
          border-b border-gray-200 bg-emerald-50"
        onMouseDown={(e) => {
          e.stopPropagation();
          onFocus?.();
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const rect = wrapper.getBoundingClientRect();
          inspectorDraggingRef.current = true;
          dragRef.current.dragging = true;
          dragRef.current.startX = e.clientX - rect.left;
          dragRef.current.startY = e.clientY - rect.top;
        }}
      >
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 shrink-0">
          TABLE
        </span>
        <strong className="text-sm truncate min-w-0">{tableName}</strong>
        <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
          {filteredCount === totalCount
            ? `${totalCount} rows`
            : `${filteredCount} / ${totalCount} rows`}
        </span>
        <button
          onClick={onClose}
          className="bg-transparent border-0 text-sm cursor-pointer px-1.5 py-0.5 leading-none
            text-gray-400 hover:text-red-500 shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── Table 主體 ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            載入中…
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {data ? "此資料表無資料" : "尚未載入"}
          </div>
        ) : (
          <table
            className="border-collapse min-w-full"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <DraggableColumnHeader key={header.id} header={header} table={table} />
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-blue-50/50",
                    rowIdx % 2 === 1 && "bg-gray-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 py-1 text-xs text-gray-700 border-b border-r border-gray-100
                        last:border-r-0 truncate font-mono"
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination Footer ── */}
      {pageCount > 1 && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-200 bg-gray-50 shrink-0 text-xs text-gray-500">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-0.5 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >‹</button>
          <span className="tabular-nums">
            {pagination.pageIndex + 1} / {pageCount}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-0.5 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >›</button>
          <span className="ml-auto text-gray-400">{pagination.pageSize} rows/page</span>
        </div>
      )}

      {/* ── Resize Handle ── */}
      <div
        className="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end"
        onMouseDown={(e) => {
          e.stopPropagation();
          onFocus?.();
          const panel = panelRef.current;
          if (!panel) return;
          resizeRef.current.resizing = true;
          inspectorDraggingRef.current = true;
          resizeRef.current.startX = e.clientX;
          resizeRef.current.startY = e.clientY;
          resizeRef.current.startW = panel.offsetWidth;
          resizeRef.current.startH = panel.offsetHeight;
        }}
      >
        <span className="text-[10px] text-gray-300 leading-none select-none">◢</span>
      </div>
    </div>
  );
}
