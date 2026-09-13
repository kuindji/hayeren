import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORD_TYPES, WORD_FOLDERS, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ConjugationsFileSchema, ArticleFileSchema, TenseFileSchema, VerbFileSchema, emptyDataFiles,
  type DataFiles,
} from "./schema.ts";
import { parseFrontmatter } from "./frontmatter.ts";
import { classifyDataPath, isDataFile, unexpectedDataFile } from "./paths.ts";

export type { DataFiles };

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

/** Every .json/.md file under `root`, relative and "/"-separated, like the site loader's glob keys minus "/data/". */
function listDataFiles(root: string, dir = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listDataFiles(root, rel));
    else if (isDataFile(rel)) out.push(rel);
  }
  return out;
}

export function readDataFromDisk(root: string): DataFiles {
  // declensions.json is required on disk: reading it first throws with its path when it is missing.
  const declensions = parseJsonFile(join(root, "declensions.json"), (v) => DeclensionsFileSchema.parse(v));
  const conjugations = parseJsonFile(join(root, "conjugations.json"), (v) => ConjugationsFileSchema.parse(v));
  const d: DataFiles = { ...emptyDataFiles(), declensions, conjugations };
  for (const rel of listDataFiles(root).sort()) {
    const kind = classifyDataPath(rel);
    // Same acceptance rules as buildDataFiles: a file the site loader would refuse fails validation too.
    if (!kind) throw unexpectedDataFile(rel);
    const file = join(root, rel);
    const fileName = rel.split("/").pop();
    if (kind.kind === "case") {
      const c = parseJsonFile(file, (v) => CaseFileSchema.parse(v));
      if (`${c.id}.json` !== fileName) throw new Error(`${rel}: id "${c.id}" does not match filename`);
      d.cases.push(c);
    } else if (kind.kind === "tense") {
      const t = parseJsonFile(file, (v) => TenseFileSchema.parse(v));
      if (`${t.id}.json` !== fileName) throw new Error(`${rel}: id "${t.id}" does not match filename`);
      d.tenses.push(t);
    } else if (kind.kind === "verb") {
      const v = parseJsonFile(file, (v) => VerbFileSchema.parse(v));
      if (`${v.id}.json` !== fileName) throw new Error(`${rel}: id "${v.id}" does not match filename`);
      d.verbs.push(v);
    } else if (kind.kind === "word") {
      const w = parseJsonFile(file, (v) => wordFileSchemaFor(kind.type).parse(v));
      if (`${w.id}.json` !== fileName) throw new Error(`${rel}: id "${w.id}" does not match filename`);
      d.words[kind.type].push(w);
    } else if (kind.kind === "article") {
      const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
      d.articles.push(parseOrThrowFile(rel, () => ArticleFileSchema.parse({ ...data, position: Number(data.position), case: kind.caseId, slug: kind.slug, text: body })));
    }
  }
  d.cases.sort((a, b) => a.position - b.position);
  d.tenses.sort((a, b) => a.position - b.position);
  d.verbs.sort((a, b) => a.id.localeCompare(b.id));
  for (const t of WORD_TYPES) d.words[t].sort((a, b) => a.id.localeCompare(b.id));
  return d;
}

/**
 * "unlisted-article" is an article file its case does not list. The admin's two-step article save (file, then case)
 * and delete (case, then file) pass through exactly that state, so the admin API does not refuse a write over it.
 */
export type ReferenceProblemKind = "reference" | "unlisted-article";
export interface ReferenceProblem { kind: ReferenceProblemKind; message: string }

export function checkReferences(d: DataFiles): string[] {
  return findReferenceProblems(d).map((p) => p.message);
}

export function findReferenceProblems(d: DataFiles): ReferenceProblem[] {
  const problems: ReferenceProblem[] = [];
  const push = (message: string, kind: ReferenceProblemKind = "reference") => { problems.push({ kind, message }); };
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
      if (other) push(`${where}: id "${w.id}" is already used by ${other}`);
      else idOwner.set(w.id, where);
      for (const c of w.cases) {
        if (!caseIds.has(c.case)) push(`${where}: unknown case "${c.case}"`);
        if (c.declension && !declIds.has(c.declension)) push(`${where}: unknown declension "${c.declension}"`);
        for (const e of c.examples ?? []) if (e.pposition && !ppIds.has(e.pposition)) push(`${where}: unknown pposition "${e.pposition}"`);
      }
    }
  }
  for (const c of d.cases) {
    const where = `cases/${c.id}.json`;
    for (const a of c.articles ?? []) if (!articleKeys.has(`${c.id}/${a}`)) push(`${where}: unknown article "${a}"`);
    for (const q of c.questions ?? []) if (q.pposition && !ppIds.has(q.pposition)) push(`${where}: unknown pposition "${q.pposition}"`);
    for (const g of c.groups ?? []) for (const w of g.words) {
      if (!nounIds.has(w)) push(`${where}: unknown noun "${w}" in group`);
      // Case renders custom groups with db.noun.query(g.words) unfiltered; a noun without a form for this case would show an empty row.
      else if (!nounCase.has(`${w}|${c.id}`)) push(`${where}: noun "${w}" in group has no form for this case`);
    }
    for (const x of c.declensions ?? []) {
      const id = typeof x === "string" ? x : x.declension;
      if (!declIds.has(id)) push(`${where}: unknown declension "${id}"`);
      if (typeof x === "string") continue;
      for (const g of x.groups) for (const w of g.words) {
        if (!nounIds.has(w)) push(`${where}: unknown noun "${w}" in group`);
        // Case renders a declension group as db.noun.query(g.words).filter(inDecl), so a listed noun without
        // { case: c.id, declension: id } would pass validation and silently vanish from the page.
        else if (!nounDecl.has(`${w}|${c.id}|${id}`)) push(`${where}: noun "${w}" in declension "${id}" group has no "${id}" form for this case`);
      }
    }
  }
  // An article file that its case does not list is invisible on the site (Case only renders file.articles),
  // so it is reported here; the admin's two-step article save/delete can leave exactly this state behind.
  const listed = new Set(d.cases.flatMap((c) => (c.articles ?? []).map((a) => `${c.id}/${a}`)));
  for (const a of d.articles) {
    const where = `articles/${a.case}/${a.slug}.md`;
    if (!caseIds.has(a.case)) push(`${where}: unknown case "${a.case}"`);
    else if (!listed.has(`${a.case}/${a.slug}`)) push(`${where}: not listed in cases/${a.case}.json articles`, "unlisted-article");
  }
  // verbs and tenses
  const tenseIds = new Set(d.tenses.map((t) => t.id));
  const conjIds = new Set(d.conjugations.map((c) => c.id));
  const verbIds = new Set(d.verbs.map((v) => v.id));
  const verbTense = new Set(d.verbs.flatMap((v) => v.tenses.map((t) => `${v.id}|${t.tense}`)));
  for (const v of d.verbs) {
    const where = `verbs/${v.id}.json`;
    if (!conjIds.has(v.conjugation)) push(`${where}: unknown conjugation "${v.conjugation}"`);
    for (const t of v.tenses) if (!tenseIds.has(t.tense)) push(`${where}: unknown tense "${t.tense}"`);
  }
  const positionOwner = new Map<number, string>();
  for (const t of d.tenses) {
    const where = `tenses/${t.id}.json`;
    const other = positionOwner.get(t.position);
    if (other) push(`${where}: position ${t.position} is also used by ${other}`);
    else positionOwner.set(t.position, where);
    for (const g of t.groups ?? []) for (const w of g.words) {
      if (!verbIds.has(w)) push(`${where}: unknown verb "${w}" in group`);
      // Tense renders a custom group as db.verb.query(g.words).filter(hasTense); a listed verb without an entry would vanish.
      else if (!verbTense.has(`${w}|${t.id}`)) push(`${where}: verb "${w}" in group has no entry for this tense`);
    }
  }
  return problems;
}
