import {
  WORD_TYPES, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ConjugationsFileSchema, ArticleFileSchema, TenseFileSchema, VerbFileSchema, emptyDataFiles,
  type DataFiles, type ArticleFile,
} from "./schema";
import { parseFrontmatter } from "./frontmatter";
import { classifyDataPath, unexpectedDataFile } from "./paths";

function parseOrThrow<T>(path: string, fn: () => T): T {
  try { return fn(); } catch (e) { throw new Error(`${path}: ${e instanceof Error ? e.message : String(e)}`, { cause: e }); }
}

export function buildDataFiles(files: Record<string, unknown>): DataFiles {
  const d = emptyDataFiles();
  for (const path of Object.keys(files).sort()) {
    // Strip only the glob key's own "/data/" prefix: a greedy match would also eat a "data" case or article folder.
    const rel = path.replace(/^\/data\//, "");
    const content = files[path];
    const kind = classifyDataPath(rel);
    const fileName = rel.split("/").pop();
    if (kind?.kind === "declensions") {
      d.declensions = parseOrThrow(rel, () => DeclensionsFileSchema.parse(content));
    } else if (kind?.kind === "conjugations") {
      d.conjugations = parseOrThrow(rel, () => ConjugationsFileSchema.parse(content));
    } else if (kind?.kind === "case") {
      const c = parseOrThrow(rel, () => CaseFileSchema.parse(content));
      if (`${c.id}.json` !== fileName) throw new Error(`${rel}: id "${c.id}" does not match filename`);
      d.cases.push(c);
    } else if (kind?.kind === "tense") {
      const t = parseOrThrow(rel, () => TenseFileSchema.parse(content));
      if (`${t.id}.json` !== fileName) throw new Error(`${rel}: id "${t.id}" does not match filename`);
      d.tenses.push(t);
    } else if (kind?.kind === "verb") {
      const v = parseOrThrow(rel, () => VerbFileSchema.parse(content));
      if (`${v.id}.json` !== fileName) throw new Error(`${rel}: id "${v.id}" does not match filename`);
      d.verbs.push(v);
    } else if (kind?.kind === "article" && typeof content === "string") {
      const { data, body } = parseFrontmatter(content);
      const a: ArticleFile = parseOrThrow(rel, () =>
        ArticleFileSchema.parse({ ...data, position: Number(data.position), owner: kind.owner, ownerId: kind.ownerId, slug: kind.slug, text: body }),
      );
      d.articles.push(a);
    } else if (kind?.kind === "word") {
      const w = parseOrThrow(rel, () => wordFileSchemaFor(kind.type).parse(content));
      if (`${w.id}.json` !== fileName) throw new Error(`${rel}: id "${w.id}" does not match filename`);
      d.words[kind.type].push(w);
    } else {
      throw unexpectedDataFile(rel);
    }
  }
  d.cases.sort((a, b) => a.position - b.position);
  d.tenses.sort((a, b) => a.position - b.position);
  d.verbs.sort((a, b) => a.id.localeCompare(b.id));
  for (const t of WORD_TYPES) d.words[t].sort((a, b) => a.id.localeCompare(b.id));
  return d;
}

export function loadDataFiles(): DataFiles {
  const json = import.meta.glob("/data/**/*.json", { eager: true, import: "default" });
  const md = import.meta.glob("/data/**/*.md", { eager: true, query: "?raw", import: "default" });
  return buildDataFiles({ ...json, ...md });
}
