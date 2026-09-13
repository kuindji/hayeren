import { createStore } from "@kuindji/reactive";
import { loadDataFiles } from "@/data/loader";
import type { DataFiles } from "@/data/schema";
export const dataStore = createStore<{ files: DataFiles; version: number }>({ files: loadDataFiles(), version: 0 });
if (import.meta.hot) {
  import.meta.hot.accept("@/data/loader", (mod) => {
    if (!mod) return;
    dataStore.set({ files: (mod as unknown as typeof import("@/data/loader")).loadDataFiles(), version: dataStore.get("version") + 1 });
  });
}
