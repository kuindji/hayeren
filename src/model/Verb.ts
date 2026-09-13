import { PERSONS, type Person, type VerbFile, type VerbTense, type Form, type Localized } from "@/data/schema";
import type { FilterData } from "./filter";
import { strip, type Language } from "./strip";

export const PRONOUNS: Record<Person, string> = { "1sg": "ես", "2sg": "դու", "3sg": "նա", "1pl": "մենք", "2pl": "դուք", "3pl": "նրանք" };

export interface Teaser { person: Person; form?: Form; negative?: Form }

export class Verb {
  readonly id: string;
  readonly infinitive: Form;
  readonly conjugation: string;
  readonly comment: Localized | undefined;
  readonly tenses: VerbTense[];
  constructor(file: VerbFile) {
    this.id = file.id; this.infinitive = file.infinitive; this.conjugation = file.conjugation; this.comment = file.comment; this.tenses = file.tenses;
  }
  tenseForm(tenseId: string): VerbTense | undefined { return this.tenses.find((t) => t.tense === tenseId); }
  hasTense(tenseId: string): boolean { return this.tenseForm(tenseId) !== undefined; }
  /** Persons present in either the affirmative or the negative forms of a tense, in PERSONS order. */
  persons(tenseId: string): Person[] {
    const t = this.tenseForm(tenseId);
    if (!t) return [];
    return PERSONS.filter((p) => t.forms?.[p] !== undefined || t.negative?.[p] !== undefined);
  }
  /** The one-line preview for a collapsed row: the first person that has any form (1sg for most tenses, 2sg for the imperative). */
  teaser(tenseId: string): Teaser | undefined {
    const t = this.tenseForm(tenseId);
    const person = this.persons(tenseId)[0];
    if (!t || !person) return undefined;
    const out: Teaser = { person };
    const form = t.forms?.[person];
    const negative = t.negative?.[person];
    if (form) out.form = form;
    if (negative) out.negative = negative;
    return out;
  }
  getAllForms({ language }: { language: Language }): string[] {
    const forms: (string | undefined)[] = [this.infinitive.armenian, this.infinitive[language], this.infinitive.informal];
    for (const t of this.tenses) for (const set of [t.forms, t.negative]) {
      if (!set) continue;
      for (const p of PERSONS) { const f = set[p]; if (f) forms.push(f.armenian, f.informal, f[language]); }
    }
    return forms.filter((f): f is string => !!f).map((f) => strip(f, language));
  }
  matchesFilter(data: FilterData): boolean {
    const { query, language, word } = data;
    if (word) return this.id === word;
    if (!query) return true;
    const q = strip(query, language);
    return this.getAllForms({ language }).some((f) => f.includes(q));
  }
}
