import type { WordFile, WordCase, WordType, Localized, Form, Example } from "@/data/schema";
import { matchPPosition, type FilterData, type PPositionFilter } from "./filter";
import { strip, type Language } from "./strip";

export class Word {
  readonly id: string;
  readonly cases: WordCase[];
  readonly name: Localized | undefined; // prepostpositions only
  readonly comment: Localized | undefined;
  readonly description: Localized | undefined;
  constructor(readonly type: WordType, file: WordFile) {
    this.id = file.id;
    this.cases = file.cases;
    this.name = file.name;
    this.comment = file.comment;
    this.description = file.description;
  }
  caseForm(caseId: string): WordCase | undefined { return this.cases.find((c) => c.case === caseId); }
  nominative(): Form { const c = this.caseForm("nominative"); return c?.single ?? {}; }
  hasCase(caseId: string): boolean { return this.caseForm(caseId) !== undefined; }
  getAllForms({ language }: { language: Language }): string[] {
    const forms: (string | undefined)[] = [];
    for (const c of this.cases) {
      if (c.single) forms.push(c.single.armenian, c.single[language]);
      if (c.plural) forms.push(c.plural.armenian, c.plural[language]);
    }
    return forms.filter((f): f is string => !!f).map((f) => strip(f, language));
  }
  getExamples(caseId: string, pp: PPositionFilter | null = null): Example[] {
    const examples = this.caseForm(caseId)?.examples ?? [];
    return pp ? examples.filter((e) => matchPPosition(pp, e)) : examples;
  }
  matchesFilter(data: FilterData): boolean {
    const { query, pposition, language, word } = data;
    if (pposition) {
      // A question with a prepostposition but no type (the admin allows that shape) filters by prepostposition
      // only; the old code compared types unconditionally and showed an empty case for such a click.
      if (pposition.type !== undefined && this.type !== pposition.type) return false;
      const has = this.cases.some((c) => (c.examples ?? []).some((e) => (e.pposition ?? null) === pposition.pposition));
      if (!has) return false;
    }
    if (word) return this.id === word;
    if (!query) return true;
    const q = strip(query, language);
    return this.getAllForms({ language }).some((f) => f.includes(q));
  }
}
