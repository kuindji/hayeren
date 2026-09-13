import { createContext } from "react";
import { createStore } from "@kuindji/reactive";
import type { Database } from "@/model/Database";
import type { FilterStore } from "@/model/filter";
import type { Case } from "@/model/Case";
import type { Tense } from "@/model/Tense";
import type { Language } from "@/model/strip";

export interface AppData { language: Language }
export const createAppStore = () => createStore<AppData>({ language: "russian" });
export type AppStore = ReturnType<typeof createAppStore>;

function named<T>(name: string) { const c = createContext<T | null>(null); c.displayName = name; return c; }
export const AppContext = named<AppStore>("App");
export const DatabaseContext = named<Database>("Database");
export const GlobalFilterContext = named<FilterStore>("GlobalFilter");
export const LocalFilterContext = named<FilterStore>("LocalFilter");
export const CaseContext = named<Case>("Case");
export const TenseContext = named<Tense>("Tense");
