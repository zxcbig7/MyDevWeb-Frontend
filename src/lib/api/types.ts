// ============================================================
// API 回應信封型別
// 後端所有 endpoint 統一回傳 { success, code, message, data }
// 列表 endpoint 用 useApi<SomeDTO[]>，單一物件用 useApi<SomeDTO>
// ============================================================

export interface ApiEnvelope<T> {
  /** 實際資料；列表回 [] 而非 null */
  data: T;
  /** 操作是否成功；false 時前端顯示 error */
  success: boolean;
  /** 錯誤說明（success=true 時為 "OK" 或 ""） */
  message: string;
  /** HTTP 狀態碼（200 / 400 / 500…） */
  code: number;
}

/** 後端回 success:false 時拋出，帶上 code 方便分流處理 */
export class ApiError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}
