import type { ReactNode } from "react";
import type { Localized } from "@/data/schema";
import { useLanguage } from "@/site/hooks";

function marks(t: string): ReactNode {
  if (!t.includes("*")) return t;
  return t.split("*").map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

export function Text({ t }: { t: string | Localized | undefined }) {
  const language = useLanguage();
  if (!t) return null;
  if (typeof t === "string") return <>{marks(t)}</>;
  const value = t[language];
  return value ? <>{marks(value)}</> : null;
}
