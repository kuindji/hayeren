import {
  WORD_TYPES, FOLDER_TO_TYPE, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ArticleFileSchema,
  type DataFiles, type ArticleFile,
} from "./schema";
import { parseFrontmatter } from "./frontmatter";

function parseOrThrow<T>(path: string, fn: () => T): T {
  try { return fn(); } catch (e) { throw new Error(`${path}: ${e instanceof Error ? e.message : String(e)}`, { cause: e }); }
}

export function buildDataFiles(files: Record<string, unknown>): DataFiles {
  const d: DataFiles = { declensions: [], cases: [], words: { noun: [], pronoun: [], numeral: [], question: [], prepostposition: [] }, articles: [] };
  for (const path of Object.keys(files).sort()) {
    const rel = path.replace(/^.*\/data\//, "");
    const parts = rel.split("/");
    const content = files[path];
    if (rel === "declensions.json") {
      d.declensions = parseOrThrow(rel, () => DeclensionsFileSchema.parse(content));
    } else if (parts[0] === "cases" && parts.length === 2) {
      const c = parseOrThrow(rel, () => CaseFileSchema.parse(content));
      if (`${c.id}.json` !== parts[1]) throw new Error(`${rel}: id "${c.id}" does not match filename`);
      d.cases.push(c);
    } else if (parts[0] === "articles" && parts.length === 3 && typeof content === "string") {
      const { data, body } = parseFrontmatter(content);
      const a: ArticleFile = parseOrThrow(rel, () =>
        ArticleFileSchema.parse({ ...data, position: Number(data.position), case: parts[1], slug: (parts[2] ?? "").replace(/\.md$/, ""), text: body }),
      );
      d.articles.push(a);
    } else if (parts.length === 2 && parts[0] && FOLDER_TO_TYPE[parts[0]] !== undefined) {
      // Bind once: under noUncheckedIndexedAccess a second FOLDER_TO_TYPE[...] lookup is WordType | undefined again.
      const type = FOLDER_TO_TYPE[parts[0]]!;
      const w = parseOrThrow(rel, () => wordFileSchemaFor(type).parse(content));
      if (`${w.id}.json` !== parts[1]) throw new Error(`${rel}: id "${w.id}" does not match filename`);
      d.words[type].push(w);
    } else {
      throw new Error(`${rel}: unexpected file in data/`);
    }
  }
  d.cases.sort((a, b) => a.position - b.position);
  for (const t of WORD_TYPES) d.words[t].sort((a, b) => a.id.localeCompare(b.id));
  return d;
}

export function loadDataFiles(): DataFiles {
  const json = import.meta.glob("/data/**/*.json", { eager: true, import: "default" });
  const md = import.meta.glob("/data/**/*.md", { eager: true, query: "?raw", import: "default" });
  return buildDataFiles({ ...json, ...md });
}
