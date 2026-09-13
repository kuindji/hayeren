// The one definition of which files may live under data/. The site loader (import.meta.glob keys) and the disk
// validator (a directory walk) both classify paths through here, so a file the site would refuse can never pass
// `bun run validate`. Paths are relative to data/ and "/"-separated.
import { ARTICLE_FOLDER_TO_OWNER, FOLDER_TO_TYPE, type ArticleOwner, type WordType } from "./schema.ts";

export type DataPath =
  | { kind: "declensions" }
  | { kind: "conjugations" }
  | { kind: "case" }
  | { kind: "tense" }
  | { kind: "verb" }
  | { kind: "article"; owner: ArticleOwner; ownerId: string; slug: string }
  | { kind: "word"; type: WordType };

/** loadDataFiles only globs .json and .md files, so anything else under data/ is never loaded or validated. */
export const isDataFile = (rel: string): boolean => rel.endsWith(".json") || rel.endsWith(".md");

/** Classifies a .json/.md path; null means the site loader refuses the file. */
export function classifyDataPath(rel: string): DataPath | null {
  if (rel === "declensions.json") return { kind: "declensions" };
  if (rel === "conjugations.json") return { kind: "conjugations" };
  const parts = rel.split("/");
  const [head, second, third, fourth] = parts;
  if (parts.length === 2 && head && second?.endsWith(".json")) {
    if (head === "cases") return { kind: "case" };
    if (head === "tenses") return { kind: "tense" };
    if (head === "verbs") return { kind: "verb" };
    if (Object.hasOwn(FOLDER_TO_TYPE, head)) return { kind: "word", type: FOLDER_TO_TYPE[head]! };
  }
  // articles/<cases|tenses>/<ownerId>/<slug>.md
  if (parts.length === 4 && head === "articles" && second && Object.hasOwn(ARTICLE_FOLDER_TO_OWNER, second) && third && fourth?.endsWith(".md")) {
    return { kind: "article", owner: ARTICLE_FOLDER_TO_OWNER[second]!, ownerId: third, slug: fourth.slice(0, -".md".length) };
  }
  return null;
}

export const unexpectedDataFile = (rel: string): Error => new Error(`${rel}: unexpected file in data/`);
