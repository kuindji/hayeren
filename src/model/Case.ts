import type { CaseFile, CaseQuestion, CaseGroup, Localized, Declension, WordFile } from "@/data/schema";
import type { Database } from "./Database";
import type { FilterData } from "./filter";
import type { Word } from "./Word";
import { articleId, type Article } from "./Article";

// `| undefined` because CaseGroup (zod-inferred) spreads its optional fields in as `T | undefined` under exactOptionalPropertyTypes.
export interface WordGroupView { name?: Localized | undefined; description?: Localized | undefined; comment?: Localized | undefined; words: Word[] }
export interface DeclensionView extends Declension { groups: WordGroupView[] }
export interface QuestionGroupView { type?: string; name?: Localized; questions: CaseQuestion[] }
export interface CaseView {
  id: string; name: Localized; description: Localized | undefined;
  articles: Article[]; questionGroups: QuestionGroupView[];
  pronouns: Word[]; nouns: Word[]; wordGroups: WordGroupView[]; declensions: DeclensionView[];
  numerals: Word[]; questionWords: Word[]; prepostpositions: Word[];
}

const nonNull = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;

export class Case {
  readonly id: string; readonly position: number; readonly name: Localized; readonly description: Localized | undefined;
  readonly articles: Article[]; readonly questionGroups: QuestionGroupView[];
  readonly pronouns: Word[]; readonly nouns: Word[]; readonly wordGroups: WordGroupView[]; readonly declensions: DeclensionView[];
  readonly numerals: Word[]; readonly questionWords: Word[]; readonly prepostpositions: Word[];
  private readonly allWords = new Set<Word>();

  constructor(file: CaseFile, db: Database) {
    const id = file.id;
    this.id = id; this.position = file.position; this.name = file.name; this.description = file.description;

    this.articles = (file.articles ?? []).map((slug) => db.article.get(articleId(id, slug))).filter(nonNull);

    // questions
    const groups: QuestionGroupView[] = (file.questionGroups ?? []).map((g) => ({ type: g.type, name: g.name, questions: [] }));
    const byType = new Map<string, QuestionGroupView>(groups.map((g) => [g.type ?? "default", g]));
    // Every question needs a home. A question whose type has no questionGroups entry (or no type at all)
    // gets a nameless group for that type, created on first use, so a valid file never loses a question.
    for (const q of file.questions ?? []) {
      const key = q.type ?? "default";
      let g = byType.get(key);
      if (!g) { g = q.type ? { type: q.type, questions: [] } : { questions: [] }; groups.push(g); byType.set(key, g); }
      g.questions.push(q);
    }
    this.questionGroups = groups.filter((g) => g.questions.length > 0);

    // custom word groups and regular nouns
    const wordsInGroups = (file.groups ?? []).flatMap((g) => g.words);
    this.wordGroups = (file.groups ?? []).map((g) => ({ ...g, words: db.noun.query(g.words) })).filter((g) => g.words.length > 0);
    this.nouns = db.noun.query((w) => !wordsInGroups.includes(w.id) && w.cases.some((c) => c.case === id && !c.declension));
    this.pronouns = db.pronoun.query((w) => w.cases.some((c) => c.case === id));
    this.numerals = db.numeral.query((w) => w.cases.some((c) => c.case === id));
    this.prepostpositions = db.prepostposition.query((w) => w.cases.some((c) => c.case === id));
    this.questionWords = db.question.query((w) => w.cases.some((c) => c.case === id));

    // declensions
    // Table.query passes WordFile rows, not Word entities, so type the helper against the fields it reads.
    const inDecl = (w: Pick<WordFile, "cases">, d: string) => w.cases.some((c) => c.case === id && c.declension === d);
    // A noun is shown either as a regular noun (no declension) or under its declension. The case file lists
    // declensions only to order them and to attach named groups; any declension a noun actually uses in this
    // case is appended automatically (first-seen order), exactly like the old loadRemote() derived the list from
    // noun_case. Otherwise assigning a new declension in the word editor would silently hide the noun.
    const listed = new Set((file.declensions ?? []).map((e) => (typeof e === "string" ? e : e.declension)));
    const unlisted: string[] = [];
    for (const w of db.noun.query()) for (const c of w.cases) {
      if (c.case === id && c.declension && !listed.has(c.declension)) { listed.add(c.declension); unlisted.push(c.declension); }
    }
    this.declensions = [...(file.declensions ?? []), ...unlisted]
      .map((entry): DeclensionView | null => {
        const declId = typeof entry === "string" ? entry : entry.declension;
        const base = db.declension.get(declId);
        if (!base) return null;
        let groups: WordGroupView[];
        if (typeof entry === "string") {
          groups = [{ words: db.noun.query((w) => inDecl(w, declId)) }];
        } else {
          const grouped = entry.groups.flatMap((g: CaseGroup) => g.words);
          groups = entry.groups.map((g) => ({ ...g, words: db.noun.query(g.words).filter((w) => inDecl(w, declId)) }));
          const rest = db.noun.query((w) => !grouped.includes(w.id) && inDecl(w, declId));
          if (rest.length > 0) groups.unshift({ words: rest });
        }
        groups = groups.filter((g) => g.words.length > 0);
        return groups.length ? { ...base, groups } : null;
      })
      .filter(nonNull);

    for (const list of [this.nouns, this.pronouns, this.numerals, this.prepostpositions, this.questionWords]) list.forEach((w) => this.allWords.add(w));
    for (const g of this.wordGroups) g.words.forEach((w) => this.allWords.add(w));
    for (const d of this.declensions) for (const g of d.groups) g.words.forEach((w) => this.allWords.add(w));
  }

  getData(filter: FilterData): CaseView {
    const keep = (ws: Word[]) => ws.filter((w) => w.matchesFilter(filter));
    const keepGroups = (gs: WordGroupView[]) => gs.map((g) => ({ ...g, words: keep(g.words) })).filter((g) => g.words.length > 0);
    return {
      id: this.id, name: this.name, description: this.description, articles: this.articles, questionGroups: this.questionGroups,
      pronouns: keep(this.pronouns), nouns: keep(this.nouns), numerals: keep(this.numerals),
      prepostpositions: keep(this.prepostpositions), questionWords: keep(this.questionWords),
      wordGroups: keepGroups(this.wordGroups),
      declensions: this.declensions.map((d) => ({ ...d, groups: keepGroups(d.groups) })).filter((d) => d.groups.length > 0),
    };
  }

  matchesFilter(filter: FilterData): boolean {
    for (const w of this.allWords) if (w.matchesFilter(filter)) return true;
    return false;
  }

  isEmpty(): boolean {
    return this.allWords.size === 0;
  }
}
