// ============================================================
// 寫入操作 helper（POST / PUT / PATCH / DELETE）
// 自動拆信封 + success:false 時丟 ApiError。
// 讀取請改用 ./useApi（SWR）。
//
// 範例：
//   await apiPost<RuleDTO, CreateRuleBody>("/api/RuleViewer/rules", body);
// ============================================================

import { apiClient } from "./client";
import { ApiError, type ApiEnvelope } from "./types";

const unwrap = <T>(envelope: ApiEnvelope<T>): T => {
  if (!envelope.success) {
    throw new ApiError(envelope.message || "API request failed", envelope.code);
  }
  return envelope.data;
};

export const apiGet = async <T>(url: string): Promise<T> => {
  const res = await apiClient.get<ApiEnvelope<T>>(url);
  return unwrap(res.data);
};

export const apiPost = async <T, B = unknown>(url: string, body?: B): Promise<T> => {
  const res = await apiClient.post<ApiEnvelope<T>>(url, body);
  return unwrap(res.data);
};

export const apiPut = async <T, B = unknown>(url: string, body?: B): Promise<T> => {
  const res = await apiClient.put<ApiEnvelope<T>>(url, body);
  return unwrap(res.data);
};

export const apiPatch = async <T, B = unknown>(url: string, body?: B): Promise<T> => {
  const res = await apiClient.patch<ApiEnvelope<T>>(url, body);
  return unwrap(res.data);
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const res = await apiClient.delete<ApiEnvelope<T>>(url);
  return unwrap(res.data);
};
