import { createStore } from "@kuindji/reactive";
import type { Language } from "./strip";
export type { Language };

export interface PPositionFilter { pposition: string | null; type: string | undefined }
export interface FilterData {
  language: Language;
  query?: string | null;
  word?: string | null;
  pposition?: PPositionFilter | null;
}

export const createFilter = (initial: FilterData) => createStore<FilterData>(initial);
export type FilterStore = ReturnType<typeof createFilter>;

export function combineFilters(...stores: FilterStore[]): FilterData {
  const out: FilterData = { language: "russian" };
  for (const st of stores) {
    const data = st.getData();
    // Typed keys, not Object.entries: FilterData has no index signature, so entries() would yield `any` values.
    for (const k of Object.keys(data) as (keyof FilterData)[]) {
      if (data[k] !== undefined) Object.assign(out, { [k]: data[k] });
    }
  }
  return out;
}

export function matchPPosition(pp: PPositionFilter | null | undefined, smth: { pposition?: string | undefined }): boolean {
  if (!pp) return true;
  return (smth.pposition ?? null) === (pp.pposition ?? null);
}
