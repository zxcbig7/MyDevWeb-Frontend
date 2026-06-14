// ============================================================
// RuleView.tsx
// Canvas 主體元件：負責渲染 Block、Arrow、Grid、Minimap，
// 以及處理所有滑鼠互動（拖曳、縮放、hover、雙擊 inspector、右鍵 context action）
// ============================================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../utils/clsx";

import type { Block, RuleData, RuleViewHandle, TrackerEdge, FireState, AlignOp, DistributeAxis } from "./types";
import { buildBlocks, drawBlocks, hitTestBlock, blocksInRect } from "./blockUtils";
import { buildArrows, drawArrows, decideConnectionSides, getSideCenter } from "./arrowUtils";
import { alignBlocks, distributeBlocks } from "./alignUtils";
import { drawGrid, drawMinimap, getWorldBounds, snap, GRID_SIZE } from "./canvasUtils";
import { BlockTooltip } from "./BlockTooltip";
import { BlockInspector } from "./BlockInspector";
import { TableInspector } from "./tableinfo";
import { useImportTableResponse } from "./api";

type RuleViewProps = {
  fab?: string | null;                            // route /api/{fab}/... — import table fetch 需要
  rules: RuleData[];
  matchedBlockIds: Set<string> | null;
  selectedBlockId?: string | null;
  trackerLogIds?: Set<string>;
  trackerVarIds?: Set<string>;
  trackerEdges?: TrackerEdge[];
  previewEdges?: TrackerEdge[];                   // 全展邊集，hover 預覽用
  hoverBlockId?: string | null;                   // 外部（側欄）hover 的 block → canvas 連動高亮
  useNewIcons?: boolean;
  layoutVersion?: number;                         // +1 → 重建 blocks（block 位置回原始 POSX/POSY）
  searchKeyword?: string;
  trackedLogName?: string;
  onBlockContextMenu?: (id: string) => void;      // 右鍵 block → 依模式的 context action（Tracker: 展開上游）
  onBlockHover?: (id: string | null) => void;     // hover block → 連動側欄
};

// Tracker 連線依層次的顏色（對照右側 tree 的 LAYER_STYLES：blue→emerald→purple→orange→pink）
const TRACKER_EDGE_COLORS = [
  "rgba(59,130,246,0.85)",   // 0 blue-500
  "rgba(16,185,129,0.85)",   // 1 emerald-500
  "rgba(168,85,247,0.85)",   // 2 purple-500
  "rgba(249,115,22,0.85)",   // 3 orange-500
  "rgba(236,72,153,0.85)",   // 4 pink-500
];

type InspectorState = {
  block: Block;
  x: number;
  y: number;
};

// 沿結構箭頭（PREBLOCK）找 from→to 的最短 block 路徑，讓 tracker 線串著既有連線走、不抄斜線捷徑。
// parentsOf：block → 它的上游（PREBLOCK）block 們。回 [from, …中繼…, to]，找不到則 null。
function structPath(from: string, to: string, parentsOf: Map<string, string[]>): string[] | null {
  if (from === to) return [from];
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  for (let h = 0; h < queue.length; h++) {
    const cur = queue[h];
    for (const p of parentsOf.get(cur) ?? []) {
      if (prev.has(p)) continue;
      prev.set(p, cur);
      if (p === to) {
        const path: string[] = [];
        for (let n: string | null = to; n != null; n = prev.get(n) ?? null) path.push(n);
        return path.reverse();                    // [from, …, to]
      }
      queue.push(p);
    }
  }
  return null;
}

export const RuleView = forwardRef<RuleViewHandle, RuleViewProps>(
  function RuleView({ fab = null, rules, matchedBlockIds, selectedBlockId, trackerLogIds, trackerVarIds, trackerEdges = [], previewEdges = [], hoverBlockId = null, useNewIcons = true, layoutVersion = 0, searchKeyword = "", trackedLogName = "", onBlockContextMenu, onBlockHover }, ref) {

    // ── Canvas refs ────────────────────────────────────────
    const canvasStageRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const minimapRef = useRef<HTMLCanvasElement | null>(null);
    const dprRef = useRef(1);
    const sizeRef = useRef({ w: 0, h: 0 });

    // ── 資料 ─────────────────────────────────────────────
    // layoutVersion 變動（按「載入」）→ 重建 blocks，丟棄手動拖曳、回到原始 POSX/POSY
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const blocks = useMemo(() => buildBlocks(rules), [rules, layoutVersion]);
    const arrows = useMemo(() => buildArrows(rules), [rules]);
    // 結構反向鄰接：block → 上游 PREBLOCK block 們（給 tracker 串接路由用）
    const parentsOf = useMemo(() => {
      const m = new Map<string, string[]>();
      for (const a of arrows) (m.get(a.to) ?? m.set(a.to, []).get(a.to)!).push(a.from);
      return m;
    }, [arrows]);

    // ── UI 狀態 ───────────────────────────────────────────
    const [inspectors, setInspectors] = useState<InspectorState[]>([]);
    const [focusStack, setFocusStack] = useState<string[]>([]);
    const [importTableName, setImportTableName] = useState<string | null>(null);
    const { data: importTableData, isLoading: importTableLoading } = useImportTableResponse(fab, importTableName);
    const importTableRows = useMemo(() => {
      if (!importTableData) return null;
      return importTableData.Rows.map((row: string[]) =>
        Object.fromEntries(importTableData.Columns.map((col: string, i: number) => [col, row[i]]))
      );
    }, [importTableData]);
    const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const inspectorDraggingRef = useRef(false);
    const activeBlockRef = useRef<Block | null>(null);

    // ── Group 框選 / 範圍拖曳（spec 2026-06-14）──────────────
    const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
    const selectedBlocksRef = useRef(selectedBlocks);
    useEffect(() => { selectedBlocksRef.current = selectedBlocks; });
    const marqueeRef = useRef<{ active: boolean; sx: number; sy: number; ex: number; ey: number } | null>(null);
    const groupDragRef = useRef(false);
    const pointerMovedRef = useRef(false);     // 區分「點擊」與「拖曳」（空白點擊才清選取）
    const [repaintTick, setRepaintTick] = useState(0);   // 就地改 block 座標後觸發重繪

    const handleAlign = useCallback((op: AlignOp) => {
      const sel = blocks.filter((b) => selectedBlocks.has(b.id));
      alignBlocks(sel, op);
      for (const b of sel) { b.x = snap(b.x, GRID_SIZE); b.y = snap(b.y, GRID_SIZE); }
      setRepaintTick((t) => t + 1);
    }, [blocks, selectedBlocks]);
    const handleDistribute = useCallback((axis: DistributeAxis) => {
      const sel = blocks.filter((b) => selectedBlocks.has(b.id));
      distributeBlocks(sel, axis);
      for (const b of sel) { b.x = snap(b.x, GRID_SIZE); b.y = snap(b.y, GRID_SIZE); }
      setRepaintTick((t) => t + 1);
    }, [blocks, selectedBlocks]);

    // ESC 清除選取 / 方向鍵微調（spec 2026-06-14）。無選取時不攔截（ESC 交給 inspector 關閉）
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (selectedBlocksRef.current.size === 0) return;
        if (e.key === "Escape") { setSelectedBlocks(new Set()); return; }
        let dx = 0, dy = 0;
        if (e.key === "ArrowLeft") dx = -GRID_SIZE;
        else if (e.key === "ArrowRight") dx = GRID_SIZE;
        else if (e.key === "ArrowUp") dy = -GRID_SIZE;
        else if (e.key === "ArrowDown") dy = GRID_SIZE;
        else return;
        e.preventDefault();
        for (const b of blocks) if (selectedBlocksRef.current.has(b.id)) { b.x += dx; b.y += dy; }
        setRepaintTick((t) => t + 1);
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [blocks]);

    const lastHoverIdRef = useRef<string | null>(null);
    // callback 用 ref 持有，避免進 mouse effect 依賴而重掛 listener
    const onBlockContextMenuRef = useRef(onBlockContextMenu);
    const onBlockHoverRef = useRef(onBlockHover);
    useEffect(() => { onBlockContextMenuRef.current = onBlockContextMenu; onBlockHoverRef.current = onBlockHover; });

    const inspectedBlockIds = useMemo(
      () => new Set(inspectors.map((i) => i.block.id)),
      [inspectors]
    );

    // hover 預覽：被 hover 的 block + 它的直接上游 block（畫 sky 環）；僅追蹤中啟用
    const hoverPreviewIds = useMemo(() => {
      if (!hoverBlockId || previewEdges.length === 0) return null;
      const s = new Set<string>([hoverBlockId]);
      for (const e of previewEdges) if (e.from === hoverBlockId) s.add(e.to);
      return s;
    }, [hoverBlockId, previewEdges]);

    // ── Inspector 面板的當前位置（用於畫虛線連線） ────────
    const inspectorPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

    useEffect(() => {
      // 初始化新開的 inspector 位置
      inspectors.forEach(({ block, x, y }) => {
        if (!inspectorPositionsRef.current.has(block.id)) {
          inspectorPositionsRef.current.set(block.id, { x, y });
        }
      });
      // 移除已關閉的 inspector
      for (const id of inspectorPositionsRef.current.keys()) {
        if (!inspectors.some((i) => i.block.id === id)) {
          inspectorPositionsRef.current.delete(id);
        }
      }
    }, [inspectors]);

    // ── 視圖狀態（pan / zoom） ────────────────────────────
    // NATURAL_SCALE：block 看起來「正常大小」的縮放比例，作為 1:1 的基準
    const NATURAL_SCALE = 0.7;
    const DEFAULT_SCALE = NATURAL_SCALE; // 載入預設 1:1
    const viewRef = useRef({ translateX: 0, translateY: 0, scale: DEFAULT_SCALE });
    const [displayScale, setDisplayScale] = useState(DEFAULT_SCALE);

    const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

    // ── 顯示設定 ──────────────────────────────────────────
    const [showGrid, setShowGrid] = useState(true);
    const showGridRef = useRef(true);
    const [showMinimap, setShowMinimap] = useState(true);
    const [showConnectors, setShowConnectors] = useState(true);
    const showConnectorsRef = useRef(true);

    // ── 小地圖尺寸（與 viewport 同比例） ─────────────────
    const MM_MAX = 250; // 最長邊 px
    const [minimapSize, setMinimapSize] = useState({ w: MM_MAX, h: Math.round(MM_MAX * 9 / 16) });

    function syncMinimapSize(vw: number, vh: number) {
      const aspect = vw / vh;
      const size = aspect >= 1
        ? { w: MM_MAX, h: Math.round(MM_MAX / aspect) }
        : { w: Math.round(MM_MAX * aspect), h: MM_MAX };
      // 同時命令式更新 canvas buffer（確保 redraw 讀到新尺寸）
      const mm = minimapRef.current;
      if (mm) { mm.width = size.w; mm.height = size.h; }
      setMinimapSize(size);
    }

    // ── redraw ────────────────────────────────────────────
    const redraw = useCallback(
      (ctx: CanvasRenderingContext2D, blocks: Block[]) => {
        const view = viewRef.current;
        const dpr = dprRef.current;
        const { w, h } = sizeRef.current;

        // setTransform(dpr, 0, 0, dpr, 0, 0)：每次 redraw 先完整重設變換矩陣
        // 套用 DPR（devicePixelRatio）讓 canvas 在 Retina 螢幕上不模糊
        // 先重設再 translate/scale，避免多次 redraw 累積誤差
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        // 套用 pan（translate）和 zoom（scale），順序不能對調
        ctx.translate(view.translateX, view.translateY);
        ctx.scale(view.scale, view.scale);

        // ── Tracker 運作中：算出「依賴路徑上的基礎主/副線」，淡化無關者、點亮關聯者 ──
        //    每條依賴邊沿 PREBLOCK 結構路徑展開成基礎箭頭；上色 fired 優先、其次較淺 depth。
        let related: Map<string, { depth: number; fired?: FireState }> | null = null;
        if (trackerEdges.length > 0) {
          related = new Map();
          for (const edge of trackerEdges) {
            const path = structPath(edge.from, edge.to, parentsOf);
            if (!path) continue;
            for (let i = 0; i < path.length - 1; i++) {
              const key = `${path[i + 1]}|${path[i]}`;      // 基礎箭頭 = from(上游 parent)|to(下游 child)
              const ex = related.get(key);
              const take = !ex
                || (edge.fired === "yes" && ex.fired !== "yes")
                || (ex.fired !== "yes" && edge.depth < ex.depth);
              if (take) related.set(key, { depth: edge.depth, fired: edge.fired });
            }
          }
        }

        if (showGridRef.current) drawGrid(ctx, view, sizeRef.current);
        drawArrows(ctx, blocks, arrows, view.scale, !!related, related ? new Set(related.keys()) : undefined);
        drawBlocks(ctx, blocks, inspectedBlockIds, matchedBlockIds, selectedBlockId, trackerLogIds, trackerVarIds, useNewIcons);

        // ── 框選選取高亮（world 空間）─ spec 2026-06-14 ──
        if (selectedBlocksRef.current.size > 0) {
          ctx.save();
          ctx.strokeStyle = "rgba(56,189,248,0.95)";
          ctx.lineWidth = 2 / view.scale;
          ctx.setLineDash([]);
          for (const b of blocks) {
            if (!selectedBlocksRef.current.has(b.id)) continue;
            ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
          }
          ctx.restore();
        }

        // ── 點亮依賴路徑上的既有主/副線（bool 標記關聯）。命中(yes)綠、未成立(no)淡灰；否則依 depth 上色 ──
        if (related) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.setLineDash([]);
          for (const a of arrows) {
            const info = related.get(`${a.from}|${a.to}`);
            if (!info) continue;                            // 沒關聯到 tracker → 維持原樣（不畫高亮）
            const fb = blocks.find((b) => b.id === a.from);
            const tb = blocks.find((b) => b.id === a.to);
            if (!fb || !tb) continue;
            const hit = info.fired === "yes";
            const color = hit ? "rgba(34,197,94,0.95)"
              : info.fired === "no" ? "rgba(148,163,184,0.55)"
              : TRACKER_EDGE_COLORS[info.depth % TRACKER_EDGE_COLORS.length];
            const { fromSide, toSide } = decideConnectionSides(fb, tb);
            const s = getSideCenter(fb, fromSide);
            const e = getSideCenter(tb, toSide);

            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = hit ? 6 : 4;
            ctx.lineWidth = hit ? 3 : 2.4;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // ── hover 預覽：被 hover 的 block + 其直接上游 block，畫 sky 虛線環 ──
        if (hoverPreviewIds) {
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(56,189,248,0.9)";
          ctx.shadowColor = "rgba(56,189,248,0.5)";
          ctx.shadowBlur = 6;
          for (const id of hoverPreviewIds) {
            const b = blocks.find((bl) => bl.id === id);
            if (!b) continue;
            ctx.beginPath();
            ctx.roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 7);
            ctx.stroke();
          }
          ctx.restore();
        }

        // ── Inspector 虛線連線（切回螢幕像素空間繪製） ────
        // 虛線連線必須在螢幕座標系繪製（不受 world scale 影響）
        // 因此先用 setTransform 切回「只有 DPR」的狀態，再手動換算座標
        const posMap = inspectorPositionsRef.current;
        if (posMap.size > 0 && showConnectorsRef.current) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const INSP_W = 340;
          const INSP_HEADER = 40;

          for (const [blockId, pos] of posMap) {
            const b = blocks.find((bl) => bl.id === blockId);
            if (!b) continue;

            // Block 中心換算到螢幕座標
            // 公式：screen = translate + world * scale
            const bCx = view.translateX + (b.x + b.w / 2) * view.scale;
            const bCy = view.translateY + (b.y + b.h / 2) * view.scale;

            // Inspector header 四側中點（上 / 下 / 左 / 右）
            // 用 Math.hypot（歐幾里得距離）找距 Block 中心最近的那個作為連線錨點
            // 這樣連線看起來最自然，不會從 Inspector 遠端穿越過去
            const icx = pos.x + INSP_W / 2;
            const icy = pos.y + INSP_HEADER / 2;
            const candidates = [
              { x: icx, y: pos.y },
              { x: icx, y: pos.y + INSP_HEADER },
              { x: pos.x, y: icy },
              { x: pos.x + INSP_W, y: icy },
            ];
            const anchor = candidates.reduce((best, a) =>
              Math.hypot(a.x - bCx, a.y - bCy) <
                Math.hypot(best.x - bCx, best.y - bCy) ? a : best
            );

            ctx.save();

            // 虛線段
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = "rgba(99, 102, 241, 0.65)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(anchor.x, anchor.y);
            ctx.lineTo(bCx, bCy);
            ctx.stroke();

            // Block 中心圓點
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
            ctx.beginPath();
            ctx.arc(bCx, bCy, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }

        // ── marquee 框選矩形（螢幕空間，自帶 dpr 變換）─ spec 2026-06-14 ──
        const mq = marqueeRef.current;
        if (mq?.active) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const x = Math.min(mq.sx, mq.ex), y = Math.min(mq.sy, mq.ey);
          const w = Math.abs(mq.ex - mq.sx), h = Math.abs(mq.ey - mq.sy);
          ctx.save();
          ctx.fillStyle = "rgba(56,189,248,0.12)";
          ctx.strokeStyle = "rgba(56,189,248,0.85)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          ctx.restore();
        }

        const mm = minimapRef.current;
        if (mm) {
          const mmCtx = mm.getContext("2d");
          if (mmCtx) drawMinimap(mmCtx, blocks, viewRef.current, mm, sizeRef.current);
        }
      },
      [arrows, parentsOf, inspectedBlockIds, matchedBlockIds, selectedBlockId, trackerLogIds, trackerVarIds, trackerEdges, hoverPreviewIds, useNewIcons]
    );

    // ── 初始化 Canvas（只在 blocks 變更時重設畫布尺寸） ──
    useEffect(() => {
      const canvas = canvasRef.current;
      const wrapper = canvasStageRef.current;
      if (!canvas || !wrapper) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctxRef.current = ctx;

      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      sizeRef.current = { w: rect.width, h: rect.height };

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      syncMinimapSize(rect.width, rect.height);

      // blocks 載入時自動 fit-to-view，並確保最低縮放不低於 1.2
      if (blocks.length > 0) {
        const bounds = getWorldBounds(blocks);
        const worldW = bounds.maxX - bounds.minX;
        const worldH = bounds.maxY - bounds.minY;
        const fitScale = Math.min(
          (rect.width * 0.85) / worldW,
          (rect.height * 0.85) / worldH
        );
        const scale = Math.max(DEFAULT_SCALE, fitScale);
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        viewRef.current = {
          scale,
          translateX: rect.width / 2 - cx * scale,
          translateY: rect.height / 2 - cy * scale,
        };
        setDisplayScale(scale);
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks]);

    // ── Canvas 尺寸追蹤（ResizeObserver，容器縮放也能即時反應） ──
    useEffect(() => {
      const wrapper = canvasStageRef.current;
      if (!wrapper) return;

      const ro = new ResizeObserver(() => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        const rect = wrapper.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        sizeRef.current = { w: rect.width, h: rect.height };
        dprRef.current = dpr;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        syncMinimapSize(rect.width, rect.height);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redraw(ctx, blocks);
      });

      ro.observe(wrapper);
      return () => ro.disconnect();
    }, [blocks, redraw]);

    // ── 主 Canvas 滑鼠事件 ────────────────────────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 螢幕座標 → world 座標的反變換
      // 渲染時：screen = translate + world * scale
      // 反推：world = (screen - translate) / scale
      function screenToWorld(mx: number, my: number) {
        const view = viewRef.current;
        return {
          x: (mx - view.translateX) / view.scale,
          y: (my - view.translateY) / view.scale,
        };
      }

      function onMouseDown(e: MouseEvent) {
        if (inspectorDraggingRef.current) return;
        if (e.button !== 0) return;

        const rect = canvas!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { x: wx, y: wy } = screenToWorld(mx, my);
        const hitBlock = hitTestBlock(wx, wy, blocks);

        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        pointerMovedRef.current = false;

        // Shift → 一律走 marquee 框選（即使在 block 上）
        if (e.shiftKey) {
          marqueeRef.current = { active: true, sx: mx, sy: my, ex: mx, ey: my };
          return;
        }

        if (hitBlock) {
          // 打到「已選取」的 block → 整組拖曳；打到未選 block → 清除多選、退回單拖
          if (selectedBlocksRef.current.has(hitBlock.id)) {
            groupDragRef.current = true;
          } else if (selectedBlocksRef.current.size > 0) {
            setSelectedBlocks(new Set());
          }
          activeBlockRef.current = hitBlock; // 拖 Block
        } else {
          dragRef.current.dragging = true;   // 拖 Canvas
          canvas!.style.cursor = "grabbing";
        }
      }

      // 左鍵雙擊 → 開 inspector
      function onDoubleClick(e: MouseEvent) {
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const cx = e.clientX - canvasRect.left;
        const cy = e.clientY - canvasRect.top;
        const { x: wx, y: wy } = screenToWorld(cx, cy);
        const hitBlock = hitTestBlock(wx, wy, blocks);
        if (!hitBlock) return;

        const { w, h } = sizeRef.current;
        const ix = Math.max(0, w / 2 - 170);
        const iy = Math.max(0, h / 4);

        // 雙擊「已選取且多選」的 block → 打開整組 inspector（位置略錯開）；否則單一（現有）
        const sel = selectedBlocksRef.current;
        const targets = (sel.has(hitBlock.id) && sel.size > 1)
          ? blocks.filter((b) => sel.has(b.id))
          : [hitBlock];

        setInspectors((prev) => {
          const next = [...prev];
          targets.forEach((blk, i) => {
            if (next.some((it) => it.block.id === blk.id)) return;
            next.push({ block: blk, x: ix + i * 24, y: iy + i * 24 });
          });
          return next;
        });
        setFocusStack((prev) => {
          const next = [...prev];
          for (const blk of targets) if (!next.includes(blk.id)) next.push(blk.id);
          return next;
        });
      }

      // 右鍵 → 依模式的 context action（交由父層處理；擋掉瀏覽器原生選單）
      function onContextMenu(e: MouseEvent) {
        e.preventDefault();
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const cx = e.clientX - canvasRect.left;
        const cy = e.clientY - canvasRect.top;
        const { x: wx, y: wy } = screenToWorld(cx, cy);
        const hitBlock = hitTestBlock(wx, wy, blocks);
        if (hitBlock) onBlockContextMenuRef.current?.(hitBlock.id);
      }

      function onMouseMove(e: MouseEvent) {
        if (inspectorDraggingRef.current) return;

        const ctx = ctxRef.current;
        if (!ctx) return;

        const rect = canvas!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        if (dx !== 0 || dy !== 0) pointerMovedRef.current = true;

        if (marqueeRef.current?.active) {
          // 更新框選矩形（螢幕座標），redraw 會畫
          marqueeRef.current.ex = mx;
          marqueeRef.current.ey = my;
          setHoveredBlock(null);
          setMousePos(null);
        } else if (groupDragRef.current) {
          // 整組拖曳：所有 selectedBlocks 一起位移
          const scale = viewRef.current.scale;
          for (const b of blocks) {
            if (selectedBlocksRef.current.has(b.id)) { b.x += dx / scale; b.y += dy / scale; }
          }
          setHoveredBlock(null);
          setMousePos(null);
        } else if (activeBlockRef.current) {
          // 拖曳 Block（單一）
          const b = activeBlockRef.current;
          const scale = viewRef.current.scale;
          b.x += dx / scale;
          b.y += dy / scale;
          setHoveredBlock(null);
          setMousePos(null);
        } else if (dragRef.current.dragging) {
          // 拖曳 Canvas
          viewRef.current.translateX += dx;
          viewRef.current.translateY += dy;
          setHoveredBlock(null);
          setMousePos(null);
        } else {
          // Hover
          const { x: wx, y: wy } = screenToWorld(mx, my);
          const hit = hitTestBlock(wx, wy, blocks);
          setHoveredBlock(hit);
          setMousePos({ x: mx, y: my });
          const hid = hit?.id ?? null;
          if (hid !== lastHoverIdRef.current) { lastHoverIdRef.current = hid; onBlockHoverRef.current?.(hid); }
        }

        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        redraw(ctx, blocks);
      }

      function onMouseUp() {
        // marquee 放開 → 換算 world 矩形 → 框內 block 成 selectedBlocks（取代式）
        const mq = marqueeRef.current;
        if (mq) {
          const p1 = screenToWorld(mq.sx, mq.sy);
          const p2 = screenToWorld(mq.ex, mq.ey);
          const rectWorld = {
            x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y),
            w: Math.abs(p2.x - p1.x), h: Math.abs(p2.y - p1.y),
          };
          setSelectedBlocks(new Set(blocksInRect(rectWorld, blocks)));
        } else if (groupDragRef.current) {
          // 整組拖曳放開 → 全部 snap
          for (const b of blocks) if (selectedBlocksRef.current.has(b.id)) {
            b.x = snap(b.x, GRID_SIZE);
            b.y = snap(b.y, GRID_SIZE);
          }
        } else if (activeBlockRef.current) {
          const b = activeBlockRef.current;
          b.x = snap(b.x, GRID_SIZE);
          b.y = snap(b.y, GRID_SIZE);
        } else if (dragRef.current.dragging && !pointerMovedRef.current && selectedBlocksRef.current.size > 0) {
          // 空白「點擊」（非拖曳）→ 清除選取
          setSelectedBlocks(new Set());
        }

        activeBlockRef.current = null;
        marqueeRef.current = null;
        groupDragRef.current = false;
        dragRef.current.dragging = false;
        canvas!.style.cursor = "default";
        const ctx = ctxRef.current;
        if (ctx) redraw(ctx, blocks);
      }

      function onWheel(e: WheelEvent) {
        if (!e.ctrlKey) return;
        e.preventDefault();

        const ctx = ctxRef.current;
        if (!ctx || !canvas) return;

        const view = viewRef.current;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // 以滑鼠游標位置為縮放中心（zoom-to-cursor）
        // 步驟：
        //   1. 記錄游標對應的 world 座標 (wx, wy)
        //   2. 套用新的 scale
        //   3. 反推新 translate，使 (wx, wy) 仍對應到螢幕同一位置
        //      公式：mx = translateX + wx * newScale  → translateX = mx - wx * newScale
        const wx = (mx - view.translateX) / view.scale;
        const wy = (my - view.translateY) / view.scale;

        // Math.exp(-deltaY * 0.0015)：平滑指數縮放
        // 向上滾動 deltaY < 0 → factor > 1 → 放大；向下反之
        // 限制在 0.05 ~ 5 倍之間
        const newScale = Math.max(0.05, Math.min(5,
          view.scale * Math.exp(-e.deltaY * 0.0015)
        ));

        view.scale = newScale;
        view.translateX = mx - wx * newScale;
        view.translateY = my - wy * newScale;
        setDisplayScale(newScale);

        redraw(ctx, blocks);
      }

      function onWindowBlur() {
        dragRef.current.dragging = false;
        activeBlockRef.current = null;
        canvas!.style.cursor = "default";
      }

      canvas.style.cursor = "default";
      canvas.style.touchAction = "none";

      function onMouseLeave() {
        setHoveredBlock(null);
        setMousePos(null);
        if (lastHoverIdRef.current !== null) { lastHoverIdRef.current = null; onBlockHoverRef.current?.(null); }
      }

      canvas.addEventListener("dblclick", onDoubleClick);
      canvas.addEventListener("contextmenu", onContextMenu);
      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("blur", onWindowBlur);

      return () => {
        canvas.removeEventListener("dblclick", onDoubleClick);
        canvas.removeEventListener("contextmenu", onContextMenu);
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseleave", onMouseLeave);
        canvas.removeEventListener("wheel", onWheel);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("blur", onWindowBlur);
      };
    }, [blocks, redraw]);

    // ── Minimap 點擊跳轉 ──────────────────────────────────
    useEffect(() => {
      const canvas = minimapRef.current;
      if (!canvas) return;

      function onMouseDown(e: MouseEvent) {
        if (inspectorDraggingRef.current) return;
        if (blocks.length === 0) return;

        const rect = canvas!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const bounds = getWorldBounds(blocks);

        const FIT_RATIO = 0.85;
        const worldW = bounds.maxX - bounds.minX;
        const worldH = bounds.maxY - bounds.minY;
        const mmScale = Math.min(canvas!.width / worldW, canvas!.height / worldH) * FIT_RATIO;
        const ox = (canvas!.width - worldW * mmScale) / 2 - bounds.minX * mmScale;
        const oy = (canvas!.height - worldH * mmScale) / 2 - bounds.minY * mmScale;

        const wx = (mx - ox) / mmScale;
        const wy = (my - oy) / mmScale;

        const view = viewRef.current;
        view.translateX = sizeRef.current.w / 2 - wx * view.scale;
        view.translateY = sizeRef.current.h / 2 - wy * view.scale;

        redraw(ctxRef.current!, blocks);
      }

      canvas.addEventListener("mousedown", onMouseDown);
      return () => canvas.removeEventListener("mousedown", onMouseDown);
    }, [blocks, redraw]);

    // ── Rules 換了 / 按載入 → 清空 Inspectors + 選取 ───────────
    useEffect(() => {
      setInspectors([]);
      setFocusStack([]);
      setSelectedBlocks(new Set());
      marqueeRef.current = null;
    }, [rules, layoutVersion]);

    // ── Esc → 關閉 focusStack 最頂端的 Inspector ─────────
    useEffect(() => {
      function onKeyDown(e: KeyboardEvent) {
        if (e.key !== "Escape") return;
        setFocusStack((prev) => {
          if (prev.length === 0) return prev;
          const topId = prev[prev.length - 1];
          setInspectors((insp) => insp.filter((i) => i.block.id !== topId));
          return prev.slice(0, -1);
        });
      }
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // ── 重新 Render（matchedIds / inspectedIds / 選取 / 對齊分佈 改變時） ──
    useEffect(() => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      redraw(ctx, blocks);
    }, [blocks, redraw, selectedBlocks, repaintTick]);

    // ── 聚焦 Block ────────────────────────────────────────
    const focusBlock = useCallback(
      (b: Block) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        const view = viewRef.current;
        const { w, h } = sizeRef.current;

        // 讓指定 block 的中心對齊 viewport 中心
        // 公式：viewportCenter = translate + blockCenter * scale
        // 反推：translate = viewportCenter - blockCenter * scale
        view.translateX = w / 2 - (b.x + b.w / 2) * view.scale;
        view.translateY = h / 2 - (b.y + b.h / 2) * view.scale;

        redraw(ctx, blocks);
      },
      [blocks, redraw]
    );

    const focusBlockById = useCallback(
      (id: string) => {
        const b = blocks.find((x) => x.id === id);
        if (b) focusBlock(b);
      },
      [blocks, focusBlock]
    );

    const openInspectorById = useCallback(
      (id: string) => {
        const b = blocks.find((x) => x.id === id);
        if (!b) return;
        focusBlock(b);
        const { w, h } = sizeRef.current;
        const mx = Math.max(0, w / 2 - 170);
        const my = Math.max(0, h / 4);
        setInspectors((prev) => {
          if (prev.some((i) => i.block.id === b.id)) return prev;
          return [...prev, { block: b, x: mx, y: my }];
        });
        setFocusStack((prev) => {
          if (prev.includes(b.id)) return prev;
          return [...prev, b.id];
        });
      },
      [blocks, focusBlock]
    );

    useImperativeHandle(ref, () => ({ focusBlockById, openInspectorById }), [focusBlockById, openInspectorById]);

    // ── 縮放按鈕 ──────────────────────────────────────────
    // zoomBy：以 viewport 正中央為縮放中心（按鈕縮放，不跟滑鼠走）
    // 邏輯同 onWheel，但固定以畫面中心點 (cx, cy) 為錨點
    const zoomBy = useCallback((factor: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const view = viewRef.current;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const wx = (cx - view.translateX) / view.scale;
      const wy = (cy - view.translateY) / view.scale;
      const newScale = Math.max(0.05, Math.min(5, view.scale * factor));
      view.scale = newScale;
      view.translateX = cx - wx * newScale;
      view.translateY = cy - wy * newScale;
      setDisplayScale(newScale);
      redraw(ctx, blocks);
    }, [blocks, redraw]);

    const zoomReset = useCallback(() => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      viewRef.current = { translateX: 0, translateY: 0, scale: NATURAL_SCALE };
      setDisplayScale(NATURAL_SCALE);
      redraw(ctx, blocks);
    }, [blocks, redraw]);

    // ── Inspector 位置更新（拖曳時同步並觸發重繪） ────────
    const updateInspectorPosition = useCallback(
      (blockId: string, x: number, y: number) => {
        inspectorPositionsRef.current.set(blockId, { x, y });
        const ctx = ctxRef.current;
        if (ctx) redraw(ctx, blocks);
      },
      [blocks, redraw]
    );

    // ── Render ────────────────────────────────────────────
    return (
      <div ref={wrapperRef} className="relative w-full h-full">
        <div ref={canvasStageRef} className="relative w-full h-full">
          <canvas ref={canvasRef} className="block w-full h-full" />

          {/* 對齊 / 分佈 toolbar（選取 ≥2 顯示）— spec 2026-06-14 */}
          {selectedBlocks.size >= 2 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-lg bg-slate-800/95 border border-white/15 px-2 py-1 shadow-lg text-xs text-white">
              <span className="text-slate-400 pr-1">{selectedBlocks.size} 選取</span>
              {([
                ["left", "靠左"], ["centerX", "水平置中"], ["right", "靠右"],
                ["top", "靠上"], ["centerY", "垂直置中"], ["bottom", "靠下"],
              ] as [AlignOp, string][]).map(([op, label]) => (
                <button key={op} onClick={() => handleAlign(op)} title={label}
                  className="px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer">{label}</button>
              ))}
              <span className="w-px h-4 bg-white/15 mx-0.5" />
              {([["horizontal", "水平分佈"], ["vertical", "垂直分佈"]] as [DistributeAxis, string][]).map(([axis, label]) => (
                <button key={axis} onClick={() => handleDistribute(axis)} title={label}
                  disabled={selectedBlocks.size < 3}
                  className="px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-default">{label}</button>
              ))}
            </div>
          )}

          {/* Tooltip（穿透滑鼠事件） */}
          <div className="absolute inset-0 pointer-events-none">
            <BlockTooltip
              block={hoveredBlock}
              mousePos={mousePos}
              canvasSize={sizeRef.current}
            />
          </div>

          {/* Inspectors（順序固定，z-index 由 focusStack 位置決定） */}
          {inspectors.map(({ block, x, y }) => {
            const zIndex = 100 + focusStack.indexOf(block.id);
            return (
              <BlockInspector
                key={block.id}
                block={block}
                searchKeyword={searchKeyword}
                trackedLogName={trackedLogName}
                initialX={x}
                initialY={y}
                wrapperRef={canvasStageRef}
                inspectorDraggingRef={inspectorDraggingRef}
                zIndex={zIndex}
                onPositionChange={(nx, ny) => updateInspectorPosition(block.id, nx, ny)}
                onClose={() => {
                  setInspectors((prev) => prev.filter((i) => i.block.id !== block.id));
                  setFocusStack((prev) => prev.filter((id) => id !== block.id));
                }}
                onFocus={() =>
                  setFocusStack((prev) => {
                    const filtered = prev.filter((id) => id !== block.id);
                    return [...filtered, block.id];
                  })
                }
                onViewImportData={(tableName) => setImportTableName(tableName)}
              />
            );
          })}
          {importTableName && (
            <TableInspector
              tableName={importTableName}
              data={importTableRows}
              isLoading={importTableLoading}
              initialX={Math.max(0, (sizeRef.current.w - 700) / 2)}
              initialY={Math.max(0, (sizeRef.current.h - 500) / 2)}
              wrapperRef={canvasStageRef}
              inspectorDraggingRef={inspectorDraggingRef}
              onClose={() => setImportTableName(null)}
            />
          )}
        </div>

        {/* Minimap + Controls */}
        <div className="absolute left-5 bottom-5 flex flex-col gap-1.5 items-start">
          {/* Minimap — 用 hidden 隱藏而非 unmount，保持 ref 與事件監聽器有效 */}
          <div className={cn("border border-gray-400 bg-white self-start", !showMinimap && "hidden")}>
            <canvas ref={minimapRef} width={minimapSize.w} height={minimapSize.h} style={{ display: "block" }} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 h-9">
            {/* Connector lines toggle  ╌ = dashed line */}
            <button
              onClick={() => {
                setShowConnectors((v) => {
                  showConnectorsRef.current = !v;
                  const ctx = ctxRef.current;
                  if (ctx) redraw(ctx, blocks);
                  return !v;
                });
              }}
              title="開關連線顯示"
              className={cn("w-9 h-9 flex items-center justify-center rounded border text-base cursor-pointer shadow-sm transition-colors", showConnectors
                  ? "bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600"
                  : "bg-white border-gray-400 text-gray-400 hover:bg-gray-100"
                )}
            >╌</button>
            {/* Grid toggle  # = grid */}
            <button
              onClick={() => {
                setShowGrid((v) => {
                  showGridRef.current = !v;
                  const ctx = ctxRef.current;
                  if (ctx) redraw(ctx, blocks);
                  return !v;
                });
              }}
              title="開關網格"
              className={cn("w-9 h-9 flex items-center justify-center rounded border text-base cursor-pointer shadow-sm transition-colors", showGrid
                  ? "bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600"
                  : "bg-white border-gray-400 text-gray-400 hover:bg-gray-100"
                )}
            >#</button>
            {/* Minimap toggle  ⊡ = overview box */}
            <button
              onClick={() => setShowMinimap((v) => !v)}
              title="開關小地圖"
              className={cn("w-9 h-9 flex items-center justify-center rounded border text-base cursor-pointer shadow-sm transition-colors", showMinimap
                  ? "bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600"
                  : "bg-white border-gray-400 text-gray-400 hover:bg-gray-100"
                )}
            >⊡</button>
            {/* Divider */}
            <div className="w-px self-stretch bg-gray-300 mx-0.5" />
            {/* Zoom buttons */}
            <button
              onClick={() => zoomBy(1.25)}
              title="放大顯示(Ctrl+滑鼠滾輪向上)"
              className="w-9 h-9 flex items-center justify-center rounded bg-white border border-gray-400 text-gray-700 text-base hover:bg-gray-100 cursor-pointer shadow-sm"
            >+</button>
            <button
              onClick={() => zoomBy(0.8)}
              title="縮小顯示(Ctrl+滑鼠滾輪向下)"
              className="w-9 h-9 flex items-center justify-center rounded bg-white border border-gray-400 text-gray-700 text-base hover:bg-gray-100 cursor-pointer shadow-sm"
            >−</button>
            <button
              onClick={zoomReset}
              title="重置縮放"
              className="px-2 h-9 flex items-center justify-center rounded bg-white border border-gray-400 text-gray-700 text-xs hover:bg-gray-100 cursor-pointer shadow-sm tabular-nums"
            >{Math.round((displayScale / NATURAL_SCALE) * 100)}%</button>
          </div>
        </div>
      </div>
    );
  }
);
