// ============================================================
// useApi — 統一的 SWR 讀取 hook
// 自動拆信封：useApi<T> 回傳 data: T | null（已從 envelope.data 取出）。
// url 傳 null 時不打 API（conditional fetching）。
// 寫入操作（POST/PUT/DELETE）請改用 ./mutations。
// ============================================================

import useSWR, { type SWRConfiguration, type KeyedMutator } from "swr";
import { apiClient } from "./client";
import type { ApiEnvelope } from "./types";

const fetchEnvelope = async <T>(url: string): Promise<ApiEnvelope<T>> => {
  const res = await apiClient.get<ApiEnvelope<T>>(url);
  return res.data;
};

export interface UseApiResult<T> {
  /** 已拆信封的資料；尚未載入 / 出錯時為 null */
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  /** SWR mutate，重新驗證或本地更新用 */
  mutate: KeyedMutator<ApiEnvelope<T>>;
}

export const useApi = <T>(
  url: string | null,
  config?: SWRConfiguration<ApiEnvelope<T>, Error>,
): UseApiResult<T> => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiEnvelope<T>, Error>(
    url,
    (u: string) => fetchEnvelope<T>(u),
    { revalidateOnFocus: false, ...config },
  );

  return {
    data: data?.data ?? null,
    error: error ?? null,
    isLoading,
    isValidating,
    mutate,
  };
};
