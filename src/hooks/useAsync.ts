import { useState, useCallback, useRef } from "react";

type AsyncState<T> =
  | { status: "idle";    data: null;  error: null }
  | { status: "loading"; data: null;  error: null }
  | { status: "success"; data: T;     error: null }
  | { status: "error";   data: null;  error: Error };

/**
 * 包裝非同步函式，回傳 { execute, status, data, error, loading }
 *
 * @example
 * const { execute, loading, error } = useAsync(loadPhases);
 * // 在 useEffect 呼叫 execute()，onError 時顯示 Toast
 */
export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  onError?: (error: Error) => void,
) {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  // mountedRef：防止元件已卸載（unmount）後仍呼叫 setState 造成記憶體洩漏警告
  // React 18 之前這會報 "Can't perform a state update on an unmounted component"
  const mountedRef = useRef(true);

  // onErrorRef：讓 onError callback 永遠拿到最新版本，
  // 同時不需要將 onError 列入 useCallback 的 deps（避免重新建立 execute 函式）
  const onErrorRef = useRef(onError);
  // eslint-disable-next-line react-hooks/refs
  onErrorRef.current = onError;

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ status: "loading", data: null, error: null });
      try {
        const result = await fn(...args);
        if (mountedRef.current) {
          setState({ status: "success", data: result, error: null });
        }
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (mountedRef.current) {
          setState({ status: "error", data: null, error: err });
          onErrorRef.current?.(err);
        }
        return null;
      }
    },
    [fn],
  );

  return {
    execute,
    status:  state.status,
    data:    state.status === "success" ? state.data : null,
    error:   state.status === "error"   ? state.error : null,
    loading: state.status === "loading",
  };
}
