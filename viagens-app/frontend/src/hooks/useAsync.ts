// Executa uma busca assíncrona, com estado de carregando/erro e cancelamento ao mudar.

import { useEffect, useState } from "react";

export interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ loading: enabled, data: null, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ loading: true, data: s.data, error: null }));
    fn(ctrl.signal).then(
      (data) => !ctrl.signal.aborted && setState({ loading: false, data, error: null }),
      (error: Error) => !ctrl.signal.aborted && error.name !== "AbortError" && setState({ loading: false, data: null, error }),
    );
    return () => ctrl.abort();
  }, [...deps, tick, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: () => setTick((t) => t + 1) };
}
