import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  WORD_TYPES, WORD_FOLDERS, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ArticleFileSchema,
  type WordType, type WordFile, type CaseFile, type Declension, type ArticleFile,
} from "./schema";
import { parseFrontmatter } from "./frontmatter";

export interface DataFiles {
  declensions: Declension[];
  cases: CaseFile[];
  words: Record<WordType, WordFile[]>;
  articles: ArticleFile[];
}

function parseJsonFile<T>(path: string, parse: (v: unknown) => T): T {
  try {
    return parse(JSON.parse(readFileSync(path, "utf8")));
  } catch (e) {
    throw new Error(`${path}: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

function parseOrThrowFile<T>(path: string, fn: () => T): T {
  try { return fn(); } catch (e) { throw new Error(`${path}: ${e instanceof Error ? e.message : String(e)}`, { cause: e }); }
}

const listFiles = (dir: string, ext: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : []);

export function readDataFromDisk(root: string): DataFiles {
  const declensions = parseJsonFile(join(root, "declensions.json"), (v) => DeclensionsFileSchema.parse(v));
  const cases = listFiles(join(root, "cases"), ".json").map((f) => {
    const c = parseJsonFile(join(root, "cases", f), (v) => CaseFileSchema.parse(v));
    if (c.id !== basename(f, ".json")) throw new Error(`cases/${f}: id "${c.id}" does not match filename`);
    return c;
  });
  const words = {} as DataFiles["words"];
  for (const type of WORD_TYPES) {
    const dir = join(root, WORD_FOLDERS[type]);
    words[type] = listFiles(dir, ".json").map((f) => {
      const w = parseJsonFile(join(dir, f), (v) => wordFileSchemaFor(type).parse(v));
      if (w.id !== basename(f, ".json")) throw new Error(`${WORD_FOLDERS[type]}/${f}: id "${w.id}" does not match filename`);
      return w;
    });
  }
  const articles: ArticleFile[] = [];
  const artRoot = join(root, "articles");
  for (const caseId of existsSync(artRoot) ? readdirSync(artRoot).sort() : []) {
    for (const f of listFiles(join(artRoot, caseId), ".md")) {
      const { data, body } = parseFrontmatter(readFileSync(join(artRoot, caseId, f), "utf8"));
      const rel = `articles/${caseId}/${f}`;
      articles.push(parseOrThrowFile(rel, () => ArticleFileSchema.parse({ ...data, position: Number(data.position), case: caseId, slug: basename(f, ".md"), text: body })));
    }
  }
  return { declensions, cases, words, articles };
}

export function checkReferences(d: DataFiles): string[] {
  const problems: string[] = [];
  const caseIds = new Set(d.cases.map((c) => c.id));
  const declIds = new Set(d.declensions.map((x) => x.id));
  const ppIds = new Set(d.words.prepostposition.map((p) => p.id));
  const nounIds = new Set(d.words.noun.map((n) => n.id));
  const nounDecl = new Set(d.words.noun.flatMap((n) => n.cases.filter((c) => c.declension).map((c) => `${n.id}|${c.case}|${c.declension ?? ""}`)));
  const nounCase = new Set(d.words.noun.flatMap((n) => n.cases.map((c) => `${n.id}|${c.case}`)));
  const articleKeys = new Set(d.articles.map((a) => `${a.case}/${a.slug}`));

  // Word ids are global: the pinned-word filter and Database.findWord() look words up by id alone.
  const idOwner = new Map<string, string>();
  for (const type of WORD_TYPES) {
    for (const w of d.words[type]) {
      const where = `${WORD_FOLDERS[type]}/${w.id}.json`;
      const other = idOwner.get(w.id);
      if (other) problems.push(`${where}: id "${w.id}" is already used by ${other}`);
      else idOwner.set(w.id, where);
      for (const c of w.cases) {
        if (!caseIds.has(c.case)) problems.push(`${where}: unknown case "${c.case}"`);
        if (c.declension && !declIds.has(c.declension)) problems.push(`${where}: unknown declension "${c.declension}"`);
        for (const e of c.examples ?? []) if (e.pposition && !ppIds.has(e.pposition)) problems.push(`${where}: unknown pposition "${e.pposition}"`);
      }
    }
  }
  for (const c of d.cases) {
    const where = `cases/${c.id}.json`;
    for (const a of c.articles ?? []) if (!articleKeys.has(`${c.id}/${a}`)) problems.push(`${where}: unknown article "${a}"`);
    for (const q of c.questions ?? []) if (q.pposition && !ppIds.has(q.pposition)) problems.push(`${where}: unknown pposition "${q.pposition}"`);
    for (const g of c.groups ?? []) for (const w of g.words) {
      if (!nounIds.has(w)) problems.push(`${where}: unknown noun "${w}" in group`);
      // Case renders custom groups with db.noun.query(g.words) unfiltered; a noun without a form for this case would show an empty row.
      else if (!nounCase.has(`${w}|${c.id}`)) problems.push(`${where}: noun "${w}" in group has no form for this case`);
    }
    for (const x of c.declensions ?? []) {
      const id = typeof x === "string" ? x : x.declension;
      if (!declIds.has(id)) problems.push(`${where}: unknown declension "${id}"`);
      if (typeof x === "string") continue;
      for (const g of x.groups) for (const w of g.words) {
        if (!nounIds.has(w)) problems.push(`${where}: unknown noun "${w}" in group`);
        // Case renders a declension group as db.noun.query(g.words).filter(inDecl), so a listed noun without
        // { case: c.id, declension: id } would pass validation and silently vanish from the page.
        else if (!nounDecl.has(`${w}|${c.id}|${id}`)) problems.push(`${where}: noun "${w}" in declension "${id}" group has no "${id}" form for this case`);
      }
    }
  }
  // An article file that its case does not list is invisible on the site (Case only renders file.articles),
  // so it is reported here; the admin's two-step article save/delete can leave exactly this state behind.
  const listed = new Set(d.cases.flatMap((c) => (c.articles ?? []).map((a) => `${c.id}/${a}`)));
  for (const a of d.articles) {
    const where = `articles/${a.case}/${a.slug}.md`;
    if (!caseIds.has(a.case)) problems.push(`${where}: unknown case "${a.case}"`);
    else if (!listed.has(`${a.case}/${a.slug}`)) problems.push(`${where}: not listed in cases/${a.case}.json articles`);
  }
  return problems;
}
