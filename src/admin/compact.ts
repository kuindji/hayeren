import type { CaseFile, CaseGroup, CaseQuestion, Declension, Localized } from "@/data/schema";
import { compact } from "@/data/json";

/** Drops empty-string values; an object left with no keys becomes `undefined`. */
export function compactLocalized<T extends Localized>(l: T | undefined): T | undefined {
  if (!l) return undefined;
  const out = Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined && v !== "")) as T;
  return Object.keys(out).length > 0 ? out : undefined;
}

export function setOptional<T extends object, K extends keyof T>(o: T, key: K, value: T[K] | undefined): T {
  const out = { ...o };
  if (value === undefined) delete out[key];
  else out[key] = value;
  return out;
}

function compactGroup(g: CaseGroup): CaseGroup {
  return {
    ...compact({ name: compactLocalized(g.name), description: compactLocalized(g.description), comment: compactLocalized(g.comment) }),
    words: g.words,
  };
}

function compactQuestion(q: CaseQuestion): CaseQuestion {
  return {
    ...compact({ type: q.type, pposition: q.pposition === "" ? undefined : q.pposition, comment: compactLocalized(q.comment) }),
    question: compactLocalized(q.question) ?? {},
  };
}

/**
 * Removes empty strings, empty objects and empty optional arrays before a save. `compact` drops empty arrays, so the
 * fields CaseFileSchema requires (`name`, `question`, a group's `words`, a declension entry's `groups`) are put back.
 */
export function compactCaseFile(c: CaseFile): CaseFile {
  return {
    ...compact({
      ...c,
      description: compactLocalized(c.description),
      questions: c.questions?.map(compactQuestion),
      questionGroups: c.questionGroups?.map((g) => ({ type: g.type, name: compactLocalized(g.name) ?? {} })),
      groups: c.groups?.map(compactGroup),
      declensions: c.declensions?.map((d) => (typeof d === "string" ? d : { declension: d.declension, groups: d.groups.map(compactGroup) })),
    }),
    id: c.id,
    position: c.position,
    name: compactLocalized(c.name) ?? {},
  };
}

export function compactDeclension(d: Declension): Declension {
  return {
    ...compact({ ...d, description: compactLocalized(d.description), comment: compactLocalized(d.comment) }),
    id: d.id,
    name: compactLocalized(d.name) ?? {},
  };
}
