import { useCallback, type SyntheticEvent } from "react";
export function useSwallowEventCallback(fn: () => void, deps: unknown[]): (e?: SyntheticEvent) => void {
  // Caller-supplied deps are the point of this hook, so neither rule can see a literal array here.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  return useCallback((e?: SyntheticEvent) => { e?.preventDefault(); e?.stopPropagation(); fn(); }, deps);
}
