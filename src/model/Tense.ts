import type { TenseFile, Localized, Conjugation, VerbFile } from "@/data/schema";
import type { Database } from "./Database";
import type { FilterData } from "./filter";
import type { Verb } from "./Verb";
import { articleId, type Article } from "./Article";

export interface VerbGroupView { name?: Localized | undefined; description?: Localized | undefined; comment?: Localized | undefined; verbs: Verb[] }
export interface ConjugationView extends Conjugation { verbs: Verb[] }
export interface TenseView {
  id: string; name: Localized; description: Localized | undefined; articles: Article[];
  conjugations: ConjugationView[]; irregular: Verb[]; groups: VerbGroupView[];
}
const nonNull = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;

export class Tense {
  readonly id: string; readonly position: number; readonly name: Localized; readonly description: Localized | undefined;
  readonly articles: Article[];
  readonly conjugations: ConjugationView[]; readonly irregular: Verb[]; readonly groups: VerbGroupView[];
  private readonly allVerbs = new Set<Verb>();

  constructor(file: TenseFile, db: Database) {
    const id = file.id;
    this.id = id; this.position = file.position; this.name = file.name; this.description = file.description;
    this.articles = (file.articles ?? []).map((slug) => db.article.get(articleId("tense", id, slug))).filter(nonNull);
    // Table.query passes VerbFile rows, so the helpers read file fields only.
    const entry = (v: Pick<VerbFile, "tenses">) => v.tenses.find((t) => t.tense === id);
    const grouped = new Set((file.groups ?? []).flatMap((g) => g.words));
    // A verb listed in a custom group shows there and nowhere else; otherwise "irregular" for this tense moves it to
    // Исключения; otherwise it sits under its conjugation. A verb without an entry for this tense is never shown.
    this.groups = (file.groups ?? [])
      .map((g) => ({ ...g, verbs: db.verb.query(g.words).filter((v) => v.hasTense(id)) }))
      .filter((g) => g.verbs.length > 0);
    this.irregular = db.verb.query((v) => !grouped.has(v.id) && entry(v)?.irregular === true);
    this.conjugations = db.conjugation.query()
      .map((c): ConjugationView => ({ ...c, verbs: db.verb.query((v) => v.conjugation === c.id && !grouped.has(v.id) && !!entry(v) && !entry(v)?.irregular) }))
      .filter((c) => c.verbs.length > 0);
    for (const g of this.groups) g.verbs.forEach((v) => this.allVerbs.add(v));
    this.irregular.forEach((v) => this.allVerbs.add(v));
    for (const c of this.conjugations) c.verbs.forEach((v) => this.allVerbs.add(v));
  }
  getData(filter: FilterData): TenseView {
    const keep = (vs: Verb[]) => vs.filter((v) => v.matchesFilter(filter));
    return {
      id: this.id, name: this.name, description: this.description, articles: this.articles,
      conjugations: this.conjugations.map((c) => ({ ...c, verbs: keep(c.verbs) })).filter((c) => c.verbs.length > 0),
      irregular: keep(this.irregular),
      groups: this.groups.map((g) => ({ ...g, verbs: keep(g.verbs) })).filter((g) => g.verbs.length > 0),
    };
  }
  /** Unlike Case, a tense column stays on the board when nothing is being searched or pinned, even with no verbs yet. */
  matchesFilter(filter: FilterData): boolean {
    if (!filter.query && !filter.word) return true;
    for (const v of this.allVerbs) if (v.matchesFilter(filter)) return true;
    return false;
  }
  isEmpty(): boolean { return this.allVerbs.size === 0; }
}
