// ============================================================
// api.ts
// DEV  → 回傳 Mock 資料（不打 API）
// STAGE / PROD → 打真實 API
// ============================================================

import axios from "axios";
import type { RuleDTO, RuleData, MachineRule } from "./types";
import {
  DEV_MOCK_PHASE, DEV_MOCK_RULE_NAME, DEV_MOCK_RULE_NAME_ICON,
  DEV_MOCK_RULES, MOCK_PHASES, MOCK_RULES_BY_PHASE, MOCK_RULE_DATA, DEV_MOCK_RULE_ICON,
  MOCK_MACHINE_RULE_BY_PHASE,
} from "./devMock";
import { convertDtosToData } from "./dataTransform";

// ── 環境判斷 ────────────────────────────────────────────────

// 透過 Vite 的環境變數來判斷目前運行環境（DEV / STAGE / PROD
// 檔案: .env.development, .env.staging, .env.production 中定義 VITE_APP_ENV=DEV|STAGE|PROD
const APP_ENV = import.meta.env.VITE_APP_ENV as "DEV" | "STAGE" | "PROD";
const IS_DEV = APP_ENV === "DEV";

// ── 真實 API Client ──────────────────────────────────────────

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 5000,
  headers: {
    CID: "ruleviewer-frontend",
    Account: "ruleviewer-frontend",
  },
});

// ── Mock 實作 ────────────────────────────────────────────────

const MOCK_PHASE_RULES: Record<string, string[]> = {
  [DEV_MOCK_PHASE]: [DEV_MOCK_RULE_NAME, DEV_MOCK_RULE_NAME_ICON],
  ...(MOCK_RULES_BY_PHASE as Record<string, string[]>),
};

const MOCK_RULE_LOOKUP: Record<string, RuleData[]> = {
  [DEV_MOCK_RULE_NAME]:      DEV_MOCK_RULES,
  [DEV_MOCK_RULE_NAME_ICON]: DEV_MOCK_RULE_ICON,
  ...(MOCK_RULE_DATA as Record<string, RuleData[]>),
};

const MOCK_PHASES_ALL = [DEV_MOCK_PHASE, ...MOCK_PHASES];

async function mockLoadPhases(): Promise<string[]> {
  return MOCK_PHASES_ALL;
}

async function mockLoadRuleNamesByPhase(phase: string): Promise<string[]> {
  return MOCK_PHASE_RULES[phase] ?? [];
}

async function mockLoadRuleData(_phase: string, ruleName: string): Promise<RuleData[]> {
  return MOCK_RULE_LOOKUP[ruleName] ?? [];
}

async function mockLoadMachineRuleMap(phase: string): Promise<MachineRule[]> {
  return MOCK_MACHINE_RULE_BY_PHASE[phase] ?? [];
}

// ── 真實 API 實作 ────────────────────────────────────────────

async function apiLoadPhases(): Promise<string[]> {
  const res = await client.get<string[]>("/api/RuleViewer/phases");
  return res.data;
}

async function apiLoadRuleNamesByPhase(phase: string): Promise<string[]> {
  const res = await client.get<string[]>(
    `/api/RuleViewer/names/${encodeURIComponent(phase)}`
  );
  return res.data;
}

async function apiLoadRuleData(phase: string, ruleName: string): Promise<RuleData[]> {
  const res = await client.get<RuleDTO[]>(
    `/api/RuleViewer/${encodeURIComponent(phase)}/${encodeURIComponent(ruleName)}`
  );
  return convertDtosToData(res.data);
}

async function apiLoadMachineRuleMap(phase: string): Promise<MachineRule[]> {
  const res = await client.get<MachineRule[]>(
    `/api/RuleViewer/${encodeURIComponent(phase)}/machines`
  );
  return res.data;
}

// ── 統一對外介面 ─────────────────────────────────────────────
// DEV：先打真實 API，失敗時 fallback 到 Mock（不讓網站死掉）
// STAGE / PROD：打真實 API，失敗時回傳空值

// DEV  ：API + Mock 合併（API 失敗時 fallback mock，不拋錯）
// PROD/STAGE：API only（失敗時往上拋，由 UI 層決定如何處理）

export async function loadPhases(): Promise<string[]> {
  if (IS_DEV) return mockLoadPhases();
  const data = await apiLoadPhases();
  return Array.isArray(data) ? data : [];
}

export async function loadRuleNamesByPhase(phase: string): Promise<string[]> {
  if (IS_DEV) return mockLoadRuleNamesByPhase(phase);
  const data = await apiLoadRuleNamesByPhase(phase);
  return Array.isArray(data) ? data : [];
}

export async function loadRuleData(phase: string, ruleName: string): Promise<RuleData[]> {
  if (IS_DEV) return mockLoadRuleData(phase, ruleName);
  const data = await apiLoadRuleData(phase, ruleName);
  return Array.isArray(data) ? data : [];
}

export async function loadMachineRuleMap(phase: string): Promise<MachineRule[]> {
  if (IS_DEV) return mockLoadMachineRuleMap(phase);
  const data = await apiLoadMachineRuleMap(phase);
  return Array.isArray(data) ? data : [];
}
