import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCopyBlocks, type Row } from "./pgdump";
import { stableStringify, compact } from "../src/data/json";
import { serializeFrontmatter } from "../src/data/frontmatter";
import {
  WORD_TYPES,
  WORD_FOLDERS,
  wordFileSchemaFor,
  CaseFileSchema,
  DeclensionsFileSchema,
  ArticleFileSchema,
  type WordType,
  type WordFile,
  type WordCase,
  type CaseFile,
  type CaseGroup,
  type CaseDeclension,
  type Declension,
  type Localized,
  type Example,
  type ArticleFile,
} from "../src/data/schema";

const LOCALIZED_KEYS = new Set(["russian", "english", "armenian", "transcription", "informal"]);
const ARTICLE_SLUGS: Record<string, string> = { "Форма слов": "forms", "Применение": "usage" };

export interface ImportResult {
  declensions: Declension[];
  cases: Record<string, CaseFile>;
  words: Record<WordType, Record<string, WordFile>>;
  articles: ArticleFile[];
}

const slug = (id: string) => id.replaceAll("/", "-");

// Row values are `string | null`, but reading a column off a `Record<string, ...>` under
// noUncheckedIndexedAccess also yields `undefined`, so both helpers accept that too.
function localized(json: string | null | undefined): Localized | undefined {
  if (!json) return undefined;
  const raw = JSON.parse(json) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (LOCALIZED_KEYS.has(k) && typeof v === "string" && v.trim() !== "") out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function form(json: string | null | undefined): (Localized & { comment?: Localized }) | undefined {
  if (!json) return undefined;
  const raw = JSON.parse(json) as Record<string, unknown>;
  const base = localized(JSON.stringify(raw)) ?? {};
  const comment =
    typeof raw.comment === "object" && raw.comment
      ? localized(JSON.stringify(raw.comment))
      : undefined;
  const out = { ...base, ...(comment ? { comment } : {}) };
  return Object.keys(out).length ? out : undefined;
}

const nonNull = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;

export function importDump(sql: string): ImportResult {
  const t = parseCopyBlocks(sql);
  const rows = (name: string): Row[] => t.get(`public.${name}`) ?? [];
  const caseOrder = new Map(rows("case").map((c) => [c.id, Number(c.position)]));

  const declensions: Declension[] = rows("declension").map((d) =>
    compact({
      id: d.id ?? "",
      name: localized(d.name) ?? {},
      description: localized(d.description),
      comment: localized(d.comment),
    }),
  );

  const words = {} as ImportResult["words"];
  for (const type of WORD_TYPES) {
    const byId: Record<string, WordFile> = {};
    const caseRows = rows(`${type}_case`);
    const exampleRows = rows(`${type}_case_example`);
    for (const w of rows(type)) {
      const id = w.id ?? "";
      const cases: WordCase[] = caseRows
        .filter((c) => c[`${type}_id`] === id)
        .sort((a, b) => (caseOrder.get(a.case_id) ?? 0) - (caseOrder.get(b.case_id) ?? 0))
        .map((c) => {
          const examples: Example[] = exampleRows
            .filter((e) => e[`${type}_id`] === id && e.case_id === c.case_id)
            .map((e) =>
              compact({
                ...(form(e.example) ?? {}),
                pposition:
                  type === "prepostposition"
                    ? undefined
                    : slug(e.prepostposition_id ?? "") || undefined,
              }),
            )
            .filter((e) => Object.keys(e).length > 0);
          return compact({
            case: c.case_id ?? "",
            declension: type === "noun" ? (c.declension_id ?? undefined) : undefined,
            single: form(c.single),
            plural: form(c.plural),
            comment: localized(c.comment),
            examples,
          });
        });
      // `cases` is required by WordFileSchema and may legitimately be empty (13 numerals and 10
      // prepostpositions in the 2023 dump have no *_case rows), so it is added after compaction.
      byId[slug(id)] = {
        ...compact({
          id: slug(id),
          name: type === "prepostposition" ? localized(w.name) : undefined,
          comment: localized(w.comment),
          description: localized(w.description),
        }),
        cases,
      };
    }
    words[type] = byId;
  }

  const groupRows = rows("case_noun_group");
  const groupNouns = rows("case_noun_group_noun");
  // `words` is required by CaseGroupSchema and may legitimately be empty, so — like `WordFile.cases`
  // below — it is spread in after compaction, which drops empty arrays.
  const groupOf = (g: Row): CaseGroup => ({
    ...compact({
      name: localized(g.name),
      description: localized(g.description),
      comment: localized(g.comment),
    }),
    words: groupNouns
      .filter((gn) => gn.case_noun_group_id === g.id)
      .map((gn) => slug(gn.noun_id ?? "")),
  });

  const articleRows = rows("article");
  const articles: ArticleFile[] = articleRows.map((a) => {
    const title = (a.title ?? "").trim();
    const s = ARTICLE_SLUGS[title];
    if (!s) throw new Error(`No slug mapping for article title "${title}"; add it to ARTICLE_SLUGS`);
    return {
      case: a.case_id ?? "",
      slug: s,
      title,
      // Passed through as-is: an unexpected language must fail ArticleFileSchema in writeData,
      // not be quietly relabelled as Russian.
      language: (a.language ?? "") as ArticleFile["language"],
      position: Number(a.position),
      text: (a.text ?? "").trim() + "\n",
    };
  });

  const cases: Record<string, CaseFile> = {};
  for (const c of rows("case")) {
    const id = c.id ?? "";
    const questions = rows("case_question")
      .filter((q) => q.case_id === id)
      .map((q) =>
        compact({
          type: (q.type as "noun" | "pronoun" | null) ?? undefined,
          pposition: slug(q.prepostposition_id ?? "") || undefined,
          question: localized(q.question) ?? {},
          comment: localized(q.comment),
        }),
      );
    const types = [...new Set(questions.map((q) => q.type).filter(nonNull))];
    const questionGroups = types.map((type) => ({
      type,
      name: { russian: type === "noun" ? "Для существительных" : "Для местоимений" },
    }));
    // First-seen order in noun_case, exactly what the old loadRemote() produced (old Database.js:432).
    const usedDeclensions = [
      ...new Set(
        rows("noun_case")
          .filter((nc) => nc.case_id === id && nc.declension_id)
          .map((nc) => nc.declension_id ?? ""),
      ),
    ];
    const declensionList: CaseDeclension[] = usedDeclensions.map((d) => {
      const groups = groupRows
        .filter((g) => g.case_id === id && g.declension_id === d)
        .map(groupOf);
      return groups.length ? { declension: d, groups } : d;
    });
    const groups = groupRows.filter((g) => g.case_id === id && !g.declension_id).map(groupOf);
    const caseArticles = articles
      .filter((a) => a.case === id)
      .sort((a, b) => a.position - b.position)
      .map((a) => a.slug);
    cases[id] = compact({
      id,
      position: Number(c.position),
      name: localized(c.name) ?? {},
      description: localized(c.description),
      articles: caseArticles,
      questionGroups,
      questions,
      declensions: declensionList,
      groups,
    });
  }

  return { declensions, cases, words, articles };
}

export function writeData(out: ImportResult, root: string): void {
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  writeFileSync(
    join(root, "declensions.json"),
    stableStringify(DeclensionsFileSchema.parse(out.declensions)),
  );
  mkdirSync(join(root, "cases"));
  for (const c of Object.values(out.cases))
    writeFileSync(join(root, "cases", `${c.id}.json`), stableStringify(CaseFileSchema.parse(c)));
  for (const type of WORD_TYPES) {
    mkdirSync(join(root, WORD_FOLDERS[type]));
    for (const w of Object.values(out.words[type]))
      writeFileSync(
        join(root, WORD_FOLDERS[type], `${w.id}.json`),
        stableStringify(wordFileSchemaFor(type).parse(w)),
      );
  }
  for (const a of out.articles) {
    const file = join("articles", a.case, `${a.slug}.md`);
    // Same guard as the JSON kinds above: never write a file the schema rejects. safeParse rather
    // than parse only so the message names the file the .md would have been written to.
    const parsed = ArticleFileSchema.safeParse(a);
    if (!parsed.success) throw new Error(`${file}: ${parsed.error.message}`);
    const { title, language, position, text } = parsed.data;
    mkdirSync(join(root, "articles", a.case), { recursive: true });
    writeFileSync(join(root, file), serializeFrontmatter({ title, language, position }, text));
  }
}

if (import.meta.main) {
  const [backup = "../db_cluster-15-11-2023@00-17-23.backup", root = "data"] = process.argv.slice(2);
  writeData(importDump(readFileSync(backup, "utf8")), root);
  console.log(`wrote ${root}/`);
}
