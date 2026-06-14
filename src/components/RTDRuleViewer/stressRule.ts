// ============================================================
// stressRule.ts  —— 後端 DEV/STRESS mock 的前端快照（自動生成，勿手改）
// 來源：MyDevWebBackend/Data/RTDMockData.cs → 同 dataTransform 邏輯
// 用途：不開後端也能在 DevCaseQuery / 離線測 Tracker。重生：_gen_stress.mjs
// ============================================================
import type { RuleData } from "./types";

export const STRESS_RULES: RuleData[] = [
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_MAIN",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "1",
    "POSX": 0,
    "POSY": 0,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "LOT_LIST",
        "COLUMN1": "LOT_ID, PRIORITY_FLAG, STAGE_CODE, ROUTE_STEP, LOT_STATUS, DUE_DATE, PRODUCT_TYPE",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S1X",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G1X",
    "BLOCK_SEQ": "2",
    "POSX": 120,
    "POSY": 420,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "CONSTRAINT_TBL",
        "COLUMN1": "LOT_ID, CONSTRAINT_CODE, TOOL_LIMIT, RESERVE_FLAG",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S1X",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G1X",
    "BLOCK_SEQ": "3",
    "POSX": 240,
    "POSY": 420,
    "PREBLOCK": [
      "DB_S1X"
    ],
    "VALUES": [
      {
        "KEY": "CONSTRAINT_FLAG",
        "COLUMN1": "CONSTRAINT_FLAG",
        "COLUMN2": "CONSTRAINT_CODE",
        "VALUE": "/* 治具 / 預約約束程度 */ IF RESERVE_FLAG == \"Y\" OR TOOL_LIMIT < 3 THEN \"TIGHT\" ELSE IF CONSTRAINT_CODE != \"NONE\" THEN \"SOFT\" ELSE \"FREE\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S1X",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G1X",
    "BLOCK_SEQ": "4",
    "POSX": 360,
    "POSY": 420,
    "PREBLOCK": [
      "FUNC_S1X"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "CONSTRAINT_FLAG != \"FREE\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S1",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "5",
    "POSX": 120,
    "POSY": 240,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "HOLD_HIST",
        "COLUMN1": "LOT_ID, HOLD_FLAG, HOLD_COUNT, WAIT_TIME, LOT_STATUS, RELEASE_CODE",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S1A",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "6",
    "POSX": 240,
    "POSY": 240,
    "PREBLOCK": [
      "DB_S1"
    ],
    "VALUES": [
      {
        "KEY": "HOLD_SEVERITY",
        "COLUMN1": "HOLD_SEVERITY",
        "COLUMN2": "HOLD_FLAG",
        "VALUE": "IF COUNT(HOLD_FLAG, 5) > 3 AND WAIT_TIME > 120 THEN \"HIGH\" ELSE IF HOLD_COUNT >= 2 THEN \"MID\" ELSE \"LOW\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX_S1",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "7",
    "POSX": 360,
    "POSY": 240,
    "PREBLOCK": [
      "FUNC_S1A",
      "FILTER_S1X"
    ],
    "VALUES": [
      {
        "KEY": "IDX_CONSTRAINT",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "CONSTRAINT_FLAG"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S1B",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "8",
    "POSX": 480,
    "POSY": 240,
    "PREBLOCK": [
      "INDEX_S1"
    ],
    "VALUES": [
      {
        "KEY": "HOLD_RISK",
        "COLUMN1": "HOLD_RISK",
        "COLUMN2": "HOLD_SEVERITY",
        "VALUE": "/* 嚴重度 + 狀態 + 約束 */ IF HOLD_SEVERITY == \"HIGH\" OR (LOT_STATUS == \"HOLD\" AND RELEASE_CODE != \"OK\") OR CONSTRAINT_FLAG == \"TIGHT\" THEN \"RISK\" ELSE IF HOLD_SEVERITY == \"MID\" OR CONSTRAINT_FLAG == \"SOFT\" THEN \"WATCH\" ELSE \"OK\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S1C",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "9",
    "POSX": 600,
    "POSY": 240,
    "PREBLOCK": [
      "FUNC_S1B"
    ],
    "VALUES": [
      {
        "KEY": "HOLD_PRIORITY",
        "COLUMN1": "HOLD_PRIORITY",
        "COLUMN2": "HOLD_RISK",
        "VALUE": "IF HOLD_RISK == \"RISK\" AND CONSTRAINT_FLAG == \"TIGHT\" THEN \"P1\" ELSE IF HOLD_COUNT > 5 OR HOLD_RISK == \"WATCH\" THEN \"P2\" ELSE \"P3\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S1",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G1",
    "BLOCK_SEQ": "10",
    "POSX": 720,
    "POSY": 240,
    "PREBLOCK": [
      "FUNC_S1C"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "HOLD_RISK != \"OK\" OR HOLD_PRIORITY != \"P3\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX1",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "11",
    "POSX": 480,
    "POSY": 0,
    "PREBLOCK": [
      "DB_MAIN",
      "FILTER_S1"
    ],
    "VALUES": [
      {
        "KEY": "IDX_HOLD",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "HOLD_RISK\nHOLD_PRIORITY"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S2X",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G2X",
    "BLOCK_SEQ": "12",
    "POSX": 480,
    "POSY": 780,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "TOOL_CAP_TBL",
        "COLUMN1": "LOT_ID, TOOL_ID, TOOL_WIP, TOOL_CAP",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S2X",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G2X",
    "BLOCK_SEQ": "13",
    "POSX": 600,
    "POSY": 780,
    "PREBLOCK": [
      "DB_S2X"
    ],
    "VALUES": [
      {
        "KEY": "CAP_FLAG",
        "COLUMN1": "CAP_FLAG",
        "COLUMN2": "TOOL_WIP",
        "VALUE": "/* 機台負載 */ IF TOOL_WIP > 80 AND TOOL_CAP < 100 THEN \"OVER\" ELSE IF TOOL_WIP > 50 THEN \"NEAR\" ELSE \"OK\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S2X",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G2X",
    "BLOCK_SEQ": "14",
    "POSX": 720,
    "POSY": 780,
    "PREBLOCK": [
      "FUNC_S2X"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "CAP_FLAG != \"OK\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S2",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G2",
    "BLOCK_SEQ": "15",
    "POSX": 480,
    "POSY": 600,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "WIP_QUEUE",
        "COLUMN1": "LOT_ID, WIP_QTY, PENDING_CNT, STEP_TIME, RWORK_CNT",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S2A",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G2",
    "BLOCK_SEQ": "16",
    "POSX": 600,
    "POSY": 600,
    "PREBLOCK": [
      "DB_S2"
    ],
    "VALUES": [
      {
        "KEY": "QUEUE_FLAG",
        "COLUMN1": "QUEUE_FLAG",
        "COLUMN2": "WIP_QTY",
        "VALUE": "/* 聚合 WIP / 佇列 */ IF SUM(WIP_QTY) > 500 OR MAX(PENDING_CNT) > 20 THEN \"BUSY\" ELSE IF AVG(STEP_TIME) > 30 THEN \"SLOW\" ELSE \"NORMAL\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX_S2",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "G2",
    "BLOCK_SEQ": "17",
    "POSX": 720,
    "POSY": 600,
    "PREBLOCK": [
      "FUNC_S2A",
      "FILTER_S2X"
    ],
    "VALUES": [
      {
        "KEY": "IDX_CAP",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "CAP_FLAG"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S2B",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G2",
    "BLOCK_SEQ": "18",
    "POSX": 840,
    "POSY": 600,
    "PREBLOCK": [
      "INDEX_S2"
    ],
    "VALUES": [
      {
        "KEY": "WIP_RISK",
        "COLUMN1": "WIP_RISK",
        "COLUMN2": "QUEUE_FLAG",
        "VALUE": "IF QUEUE_FLAG == \"BUSY\" AND (RWORK_CNT > 2 OR CAP_FLAG == \"OVER\") THEN \"HIGH\" ELSE IF QUEUE_FLAG == \"SLOW\" OR CAP_FLAG == \"NEAR\" THEN \"MID\" ELSE \"LOW\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S2",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G2",
    "BLOCK_SEQ": "19",
    "POSX": 960,
    "POSY": 600,
    "PREBLOCK": [
      "FUNC_S2B"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "WIP_QTY > 0 AND WIP_RISK != \"LOW\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX2",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "20",
    "POSX": 800,
    "POSY": 0,
    "PREBLOCK": [
      "INDEX1",
      "FILTER_S2"
    ],
    "VALUES": [
      {
        "KEY": "IDX_QUEUE",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "QUEUE_FLAG\nWIP_RISK"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S3X",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G3X",
    "BLOCK_SEQ": "21",
    "POSX": 840,
    "POSY": 1140,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "RECIPE_TBL",
        "COLUMN1": "LOT_ID, RECIPE_ID, QUAL_FLAG, LAST_RUN",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S3X",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G3X",
    "BLOCK_SEQ": "22",
    "POSX": 960,
    "POSY": 1140,
    "PREBLOCK": [
      "DB_S3X"
    ],
    "VALUES": [
      {
        "KEY": "RECIPE_STATE",
        "COLUMN1": "RECIPE_STATE",
        "COLUMN2": "QUAL_FLAG",
        "VALUE": "/* 配方資格狀態 */ IF QUAL_FLAG != \"Y\" THEN \"UNQUAL\" ELSE IF LAST_RUN == \"FAIL\" THEN \"SUSPECT\" ELSE \"READY\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S3X",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G3X",
    "BLOCK_SEQ": "23",
    "POSX": 1080,
    "POSY": 1140,
    "PREBLOCK": [
      "FUNC_S3X"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "RECIPE_STATE != \"READY\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DB_S3",
    "BLOCK_TYPE": "Database",
    "BLOCK_GROUP": "G3",
    "BLOCK_SEQ": "24",
    "POSX": 840,
    "POSY": 960,
    "PREBLOCK": null,
    "VALUES": [
      {
        "KEY": "EQP_STATUS",
        "COLUMN1": "LOT_ID, EQP_STATE, RECIPE_FLAG, MOVE_FLAG, PM_DUE",
        "COLUMN2": null,
        "VALUE": null
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S3A",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G3",
    "BLOCK_SEQ": "25",
    "POSX": 960,
    "POSY": 960,
    "PREBLOCK": [
      "DB_S3"
    ],
    "VALUES": [
      {
        "KEY": "EQP_HEALTH",
        "COLUMN1": "EQP_HEALTH",
        "COLUMN2": "EQP_STATE",
        "VALUE": "IF EQP_STATE == \"DOWN\" OR PM_DUE == \"Y\" THEN \"BAD\" ELSE IF EQP_STATE == \"IDLE\" THEN \"OK\" ELSE \"RUN\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX_S3",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "G3",
    "BLOCK_SEQ": "26",
    "POSX": 1080,
    "POSY": 960,
    "PREBLOCK": [
      "FUNC_S3A",
      "FILTER_S3X"
    ],
    "VALUES": [
      {
        "KEY": "IDX_RECIPE",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "RECIPE_STATE"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_S3B",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "G3",
    "BLOCK_SEQ": "27",
    "POSX": 1200,
    "POSY": 960,
    "PREBLOCK": [
      "INDEX_S3"
    ],
    "VALUES": [
      {
        "KEY": "EQP_READY",
        "COLUMN1": "EQP_READY",
        "COLUMN2": "EQP_HEALTH",
        "VALUE": "/* 設備健康 + 配方資格 */ IF EQP_HEALTH == \"BAD\" OR RECIPE_STATE == \"UNQUAL\" THEN \"BLOCKED\" ELSE IF RECIPE_FLAG == \"Y\" AND MOVE_FLAG == \"Y\" AND RECIPE_STATE == \"READY\" THEN \"READY\" ELSE \"WAIT\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FILTER_S3",
    "BLOCK_TYPE": "Filter",
    "BLOCK_GROUP": "G3",
    "BLOCK_SEQ": "28",
    "POSX": 1320,
    "POSY": 960,
    "PREBLOCK": [
      "FUNC_S3B"
    ],
    "VALUES": [
      {
        "KEY": null,
        "COLUMN1": null,
        "COLUMN2": null,
        "VALUE": "EQP_READY != \"WAIT\"  // 只留決策相關（READY / BLOCKED）"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "INDEX3",
    "BLOCK_TYPE": "Index",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "29",
    "POSX": 1120,
    "POSY": 0,
    "PREBLOCK": [
      "INDEX2",
      "FILTER_S3"
    ],
    "VALUES": [
      {
        "KEY": "IDX_EQP",
        "COLUMN1": "LOT_ID",
        "COLUMN2": "LOT_ID",
        "VALUE": "EQP_READY\nRECIPE_STATE"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_M1",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "30",
    "POSX": 1360,
    "POSY": 0,
    "PREBLOCK": [
      "INDEX3"
    ],
    "VALUES": [
      {
        "KEY": "RISK_SCORE",
        "COLUMN1": "RISK_SCORE",
        "COLUMN2": "HOLD_RISK",
        "VALUE": "/* 主線風險分數：彙整三副線旗標 + 主線優先序 */ IF HOLD_RISK == \"RISK\" AND (WIP_RISK == \"HIGH\" OR EQP_READY == \"BLOCKED\") THEN \"P1\" ELSE IF HOLD_RISK == \"WATCH\" OR WIP_RISK == \"MID\" OR HOLD_PRIORITY == \"P1\" OR PRIORITY_FLAG == \"HIGH\" THEN \"P2\" ELSE \"P3\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_M2",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "31",
    "POSX": 1600,
    "POSY": 0,
    "PREBLOCK": [
      "FUNC_M1"
    ],
    "VALUES": [
      {
        "KEY": "BLOCK_STATE",
        "COLUMN1": "BLOCK_STATE",
        "COLUMN2": "EQP_READY",
        "VALUE": "IF EQP_READY == \"BLOCKED\" OR RISK_SCORE == \"P1\" THEN \"BLOCKED\" ELSE IF (STAGE_CODE == \"CRIT\" AND RISK_SCORE == \"P2\") OR WIP_RISK == \"HIGH\" THEN \"WARN\" ELSE \"CLEAR\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_M3",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "32",
    "POSX": 1840,
    "POSY": 0,
    "PREBLOCK": [
      "FUNC_M2"
    ],
    "VALUES": [
      {
        "KEY": "URGENCY",
        "COLUMN1": "URGENCY",
        "COLUMN2": "BLOCK_STATE",
        "VALUE": "/* 緊迫度：風險 + 阻擋 + 交期 */ IF (RISK_SCORE == \"P1\" AND BLOCK_STATE == \"BLOCKED\") OR DUE_DATE == \"OVERDUE\" THEN \"CRITICAL\" ELSE IF BLOCK_STATE == \"WARN\" OR RISK_SCORE == \"P2\" THEN \"HIGH\" ELSE \"LOW\""
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "FUNC_DECIDE",
    "BLOCK_TYPE": "Function",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "33",
    "POSX": 2080,
    "POSY": 0,
    "PREBLOCK": [
      "FUNC_M3"
    ],
    "VALUES": [
      {
        "KEY": "disablereason",
        "COLUMN1": "disablereason",
        "COLUMN2": "URGENCY",
        "VALUE": "/* 唯一產 [$$] 的判斷：彙整主線決策變數，無命中則空字串 */ IF URGENCY == \"CRITICAL\" AND HOLD_RISK == \"RISK\" THEN [$ALREADY_ON_HOLD$] ELSE IF BLOCK_STATE == \"BLOCKED\" AND EQP_READY == \"BLOCKED\" THEN [$EQP_DOWN_HOLD$] ELSE IF WIP_RISK == \"HIGH\" AND STAGE_CODE != \"DONE\" THEN [$WIP_OVER_LIMIT$] ELSE IF RISK_SCORE == \"P1\" AND HOLD_PRIORITY == \"P1\" THEN [$CONSTRAINT_HOLD$] ELSE IF RECIPE_STATE == \"UNQUAL\" THEN [$RECIPE_NOT_READY$] ELSE IF HOLD_RISK == \"WATCH\" AND (WIP_RISK == \"MID\" OR BLOCK_STATE == \"WARN\") THEN [$PENDING_RELEASE$] ELSE \"\""
      },
      {
        "KEY": "DISPATCH_DECISION",
        "COLUMN1": "DISPATCH_DECISION",
        "COLUMN2": "BLOCK_STATE",
        "VALUE": "IF BLOCK_STATE == \"CLEAR\" AND RISK_SCORE == \"P3\" AND EQP_READY == \"READY\" THEN \"DISPATCH\" ELSE IF URGENCY == \"HIGH\" THEN \"WATCH\" ELSE \"HOLD\" // 一般派工決策，無 disable reason"
      }
    ]
  },
  {
    "PHASE": "DEV",
    "RULE_NAME": "STRESS",
    "BLOCK_NAME": "DS_STRESS",
    "BLOCK_TYPE": "DispatchScreen",
    "BLOCK_GROUP": "MAIN",
    "BLOCK_SEQ": "34",
    "POSX": 2320,
    "POSY": 0,
    "PREBLOCK": [
      "FUNC_DECIDE"
    ],
    "VALUES": []
  }
];
