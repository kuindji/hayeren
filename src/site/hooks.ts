import { useMemo, type Context as RC } from "react";
import { useStoreState, useStoreSelector } from "@kuindji/reactive/react";
import { AppContext, DatabaseContext, GlobalFilterContext } from "./contexts";
import { combineFilters, type FilterData, type FilterStore } from "@/model/filter";
import type { Database } from "@/model/Database";
import { useRequired } from "@/shared/hooks/useRequired";

export const useDatabase = (): Database => useRequired(DatabaseContext);
export const useFilter = (ctx: RC<FilterStore | null> = GlobalFilterContext): FilterStore => useRequired(ctx);
export function useFilterKey<K extends keyof FilterData>(key: K, ctx: RC<FilterStore | null> = GlobalFilterContext): FilterData[K] {
  return useStoreState(useRequired(ctx), key)[0];
}
const VOLATILE = ["query", "word", "pposition"] as const;
const useFilterVersion = (st: FilterStore) => useStoreSelector(st, VOLATILE, (q, w, p) => JSON.stringify([q, w, p]));
/** Filter data of one store; re-renders when query/word/pposition change. */
export function useFilterData(store: FilterStore): FilterData {
  const v = useFilterVersion(store);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => combineFilters(store), [store, v]);
}
/** Global + local filter data combined (local wins); re-renders when either store's volatile keys change. */
export function useCombinedFilterData(global: FilterStore, local: FilterStore): FilterData {
  const vg = useFilterVersion(global);
  const vl = useFilterVersion(local);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => combineFilters(global, local), [global, local, vg, vl]);
}
export const useLanguage = () => useStoreState(useRequired(AppContext), "language")[0];
type TableName = "noun" | "pronoun" | "numeral" | "question" | "prepostposition" | "case" | "declension" | "article";
export function useGet<N extends TableName>(table: N, id: string): ReturnType<Database[N]["get"]> {
  const db = useDatabase();
  return useMemo(() => db[table].get(id) as ReturnType<Database[N]["get"]>, [db, table, id]);
}
export function useQuery<N extends TableName>(table: N): ReturnType<Database[N]["query"]> {
  const db = useDatabase();
  return useMemo(() => db[table].query() as ReturnType<Database[N]["query"]>, [db, table]);
}
export function useWordById(id: string | null | undefined) {
  const db = useDatabase();
  return useMemo(() => (id ? db.findWord(id) : null), [db, id]);
}
