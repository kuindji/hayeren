// The one definition of which files may live under data/. The site loader (import.meta.glob keys) and the disk
// validator (a directory walk) both classify paths through here, so a file the site would refuse can never pass
// `bun run validate`. Paths are relative to data/ and "/"-separated.
import { FOLDER_TO_TYPE, type WordType } from "./schema.ts";

export type DataPath =
  | { kind: "declensions" }
  | { kind: "case" }
  | { kind: "article"; caseId: string; slug: string }
  | { kind: "word"; type: WordType };

/** loadDataFiles only globs .json and .md files, so anything else under data/ is never loaded or validated. */
export const isDataFile = (rel: string): boolean => rel.endsWith(".json") || rel.endsWith(".md");

/** Classifies a .json/.md path; null means the site loader refuses the file. */
export function classifyDataPath(rel: string): DataPath | null {
  if (rel === "declensions.json") return { kind: "declensions" };
  const parts = rel.split("/");
  const [head, second, third] = parts;
  if (parts.length === 2 && head && second?.endsWith(".json")) {
    if (head === "cases") return { kind: "case" };
    if (Object.hasOwn(FOLDER_TO_TYPE, head)) return { kind: "word", type: FOLDER_TO_TYPE[head]! };
  }
  if (parts.length === 3 && head === "articles" && second && third?.endsWith(".md")) {
    return { kind: "article", caseId: second, slug: third.slice(0, -".md".length) };
  }
  return null;
}

export const unexpectedDataFile = (rel: string): Error => new Error(`${rel}: unexpected file in data/`);
