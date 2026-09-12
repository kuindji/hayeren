import { useEffect, useRef } from "react";

/** Like useEffect, but skips the first run (mount). */
export function useUpdateEffect(fn: () => void, deps: unknown[]): void {
  const callRef = useRef(0);
  useEffect(() => {
    if (callRef.current > 0) fn();
    callRef.current += 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
