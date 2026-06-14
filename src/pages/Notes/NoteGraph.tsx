import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D, { type NodeObject } from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import { buildGraphData } from "./noteUtils";

type Node = { id: string; name: string; val: number; x?: number; y?: number };

const GRAPH_DATA = buildGraphData();

export default function NoteGraph() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as Node;
      const r = Math.sqrt(n.val) * 4;
      const isHovered = n.id === hoveredId;

      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? "#4f46e5" : "#6366f1";
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = "#c7d2fe";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const fontSize = Math.max(10, 12 / globalScale);
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHovered ? "#1e293b" : "#475569";
      ctx.fillText(n.name, n.x!, n.y! + r + 2 / globalScale);
    },
    [hoveredId]
  );

  const paintPointerArea = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as Node;
      const r = Math.sqrt(n.val) * 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fill();
    },
    []
  );

  return (
    <div ref={containerRef} className="h-full w-full relative bg-slate-50 overflow-hidden">
      {/* 返回按鈕 */}
      <button
        onClick={() => navigate("/notes")}
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm"
      >
        ← 筆記列表
      </button>

      {/* 說明 */}
      <div className="absolute top-4 right-4 z-10 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
        滾輪縮放・拖曳移動・點擊開啟筆記
      </div>

      {/* 節點數 badge */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
        {GRAPH_DATA.nodes.length} 篇筆記・{GRAPH_DATA.links.length} 條連結
      </div>

      <ForceGraph2D
        graphData={GRAPH_DATA}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#f8fafc"
        nodeLabel=""
        linkColor={() => "#cbd5e1"}
        linkWidth={1}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={paintPointerArea}
        onNodeClick={(node) => navigate(`/notes/${(node as Node).id}`)}
        onNodeHover={(node) => {
          setHoveredId(node ? (node as Node).id : null);
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
          }
        }}
        cooldownTicks={80}
      />
    </div>
  );
}
