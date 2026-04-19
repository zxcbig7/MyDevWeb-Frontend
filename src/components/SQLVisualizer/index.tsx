import { useState, useEffect, useMemo } from "react";
import { Tabs } from "antd";
import {
  DatabaseOutlined,
  BranchesOutlined,
  SearchOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

import { parseSql } from "./parser";
import { SAMPLE_SQL } from "./sampleSql";
import SqlEditor from "./SqlEditor";
import StatsPanel from "./StatsPanel";
import TableDiagram from "./TableDiagram";
import FlowDiagram from "./FlowDiagram";
import ConditionsPanel from "./ConditionsPanel";
import type { SqlAnalysis } from "./types";

export default function SQLVisualizer() {
  const [sql, setSql] = useState(SAMPLE_SQL);
  const [analysis, setAnalysis] = useState<SqlAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState("stats");

  const handleParse = () => {
    try {
      setAnalysis(parseSql(sql));
      setActiveTab("stats");
    } catch (e) {
      console.error("Parse error:", e);
    }
  };

  useEffect(() => {
    setAnalysis(parseSql(SAMPLE_SQL));
  }, []);

  const tabItems = useMemo(
    () =>
      analysis
        ? [
            {
              key: "stats",
              label: <span className="flex items-center gap-1.5"><BarChartOutlined /> 統計概覽</span>,
              children: <StatsPanel analysis={analysis} />,
            },
            {
              key: "diagram",
              label: <span className="flex items-center gap-1.5"><DatabaseOutlined /> 表關聯圖</span>,
              children: <TableDiagram analysis={analysis} />,
            },
            {
              key: "flow",
              label: <span className="flex items-center gap-1.5"><BranchesOutlined /> 流程圖</span>,
              children: <FlowDiagram analysis={analysis} />,
            },
            {
              key: "conditions",
              label: <span className="flex items-center gap-1.5"><SearchOutlined /> 條件解析</span>,
              children: <ConditionsPanel analysis={analysis} />,
            },
          ]
        : [],
    [analysis]
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">SQL 視覺化分析</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            支援 SELECT / INSERT / UPDATE / DELETE / TRUNCATE / FOR LOOP · WHERE · CASE WHEN
          </p>
        </div>

        {/* SQL Input */}
        <div className="space-y-2">
          <SqlEditor value={sql} onChange={setSql} />
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <PlayCircleOutlined /> 解析
            </button>
            <button
              onClick={() => { setSql(SAMPLE_SQL); setAnalysis(parseSql(SAMPLE_SQL)); }}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm rounded-lg transition-colors"
            >
              載入範例
            </button>
            <button
              onClick={() => { setSql(""); setAnalysis(null); }}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm rounded-lg transition-colors"
            >
              清除
            </button>
            {analysis && (
              <span className="ml-auto text-xs text-slate-400">
                {analysis.statements.length} statements ·{" "}
                {Object.keys(analysis.tableStats).length} tables ·{" "}
                {analysis.allJoins.length} joins
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {analysis && (
          <div className="border rounded-2xl bg-white p-4 shadow-sm">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="small" />
          </div>
        )}
      </div>
    </div>
  );
}
