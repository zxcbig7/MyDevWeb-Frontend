// ============================================================
// api.ts
// DEV  → 回傳 Mock 資料（不打 API）
// STAGE / PROD → 打真實 API
// ============================================================

import axios from "axios";
import type { EqpRuleDTO, RuleDTO, RuleData } from "./types";
import {
  DEV_MOCK_RULE_NAME, DEV_MOCK_RULE_NAME_ICON,
  DEV_MOCK_RULES, MOCK_RULE_DATA, DEV_MOCK_RULE_ICON,
  MOCK_EQP_RULES,
} from "./devMock";
import { convertDtosToData } from "./dataTransform";

// ── 環境判斷 ────────────────────────────────────────────────

// 透過 Vite 的環境變數來判斷目前運行環境（DEV / STAGE / PROD）
// 檔案: .env.development, .env.staging, .env.production 中定義 VITE_APP_ENV=DEV|STAGE|PROD
const APP_ENV = import.meta.env.VITE_APP_ENV as "DEV" | "STAGE" | "PROD";
const IS_DEV = APP_ENV === "DEV";

// ── 真實 API Client ──────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000,
  headers: {
    FAB: "",
    CID: "ruleviewer-frontend",
    Account: "ruleviewer-frontend",
    SSO_TOKEN: "",
  },
});

// ── Mock 實作 ────────────────────────────────────────────────

const MOCK_RULE_LOOKUP: Record<string, RuleData[]> = {
  [DEV_MOCK_RULE_NAME]:      DEV_MOCK_RULES,
  [DEV_MOCK_RULE_NAME_ICON]: DEV_MOCK_RULE_ICON,
  ...(MOCK_RULE_DATA as Record<string, RuleData[]>),
};

async function mockLoadEqpRules(): Promise<EqpRuleDTO[]> {
  return MOCK_EQP_RULES;
}

async function mockLoadRuleData(_phase: string, ruleName: string): Promise<RuleData[]> {
  return MOCK_RULE_LOOKUP[ruleName] ?? [];
}

// ── 真實 API 實作 ────────────────────────────────────────────

async function apiLoadEqpRules(): Promise<EqpRuleDTO[]> {
  const res = await client.get<EqpRuleDTO[]>("/api/RuleViewer/eqpRules");
  return res.data;
}

async function apiLoadRuleData(phase: string, ruleName: string): Promise<RuleData[]> {
  const res = await client.get<RuleDTO[]>(
    `/api/RuleViewer/${encodeURIComponent(phase)}/${encodeURIComponent(ruleName)}`
  );
  return convertDtosToData(res.data);
}

// ── 統一對外介面 ─────────────────────────────────────────────
// DEV：回傳 Mock 資料
// STAGE / PROD：打真實 API，失敗時往上拋，由 UI 層決定如何處理

export async function loadEqpRules(): Promise<EqpRuleDTO[]> {
  if (IS_DEV) return mockLoadEqpRules();
  const data = await apiLoadEqpRules();
  return Array.isArray(data) ? data : [];
}

export async function loadRuleData(phase: string, ruleName: string): Promise<RuleData[]> {
  if (IS_DEV) return mockLoadRuleData(phase, ruleName);
  const data = await apiLoadRuleData(phase, ruleName);
  return Array.isArray(data) ? data : [];
}
