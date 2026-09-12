import { useContext, type Context } from "react";

// Named as a hook: it calls useContext, and eslint-plugin-react-hooks rejects hook calls from plain functions.
export function useRequired<T>(ctx: Context<T | null>): T {
  const v = useContext(ctx);
  if (!v) throw new Error(`${ctx.displayName ?? "context"} provider missing`);
  return v;
}
