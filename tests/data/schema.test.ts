import { WordFileSchema, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ArticleFrontmatterSchema, Slug } from "@/data/schema";

describe("Slug", () => {
  it("accepts kebab slugs and rejects slashes/uppercase", () => {
    expect(Slug.safeParse("where-to").success).toBe(true);
    expect(Slug.safeParse("he/she").success).toBe(false);
    expect(Slug.safeParse("Table").success).toBe(false);
    expect(Slug.safeParse("").success).toBe(false);
  });
});

describe("WordFileSchema", () => {
  const table = {
    id: "table",
    cases: [
      {
        case: "possessive",
        declension: "ա",
        single: { armenian: "սեղան*ի*", russian: "стола́", transcription: "seghani" },
        plural: { armenian: "սեղաններ*ի*", russian: "столов" },
        examples: [{ pposition: "for", armenian: "սեղան*ի* համար", russian: "для стола́" }],
      },
    ],
  };
  it("accepts a valid noun", () => {
    expect(WordFileSchema.parse(table)).toEqual(table);
  });
  it("rejects unknown keys", () => {
    expect(WordFileSchema.safeParse({ ...table, type: "noun" }).success).toBe(false);
  });
  it("rejects a case entry without case id", () => {
    expect(WordFileSchema.safeParse({ id: "x", cases: [{ single: {} }] }).success).toBe(false);
  });
  it("wordFileSchemaFor enforces per-type field rules", () => {
    const withDecl = { id: "x", cases: [{ case: "possessive", declension: "ա" }] };
    const withPlural = { id: "x", cases: [{ case: "possessive", plural: { armenian: "y" } }] };
    expect(wordFileSchemaFor("noun").safeParse(withDecl).success).toBe(true);
    expect(wordFileSchemaFor("pronoun").safeParse(withDecl).success).toBe(false);
    expect(wordFileSchemaFor("pronoun").safeParse(withPlural).success).toBe(true);
    expect(wordFileSchemaFor("prepostposition").safeParse(withPlural).success).toBe(false);
    const withName = { id: "for", name: { russian: "для", armenian: "համար" }, cases: [] };
    expect(wordFileSchemaFor("prepostposition").safeParse(withName).success).toBe(true);
    expect(wordFileSchemaFor("noun").safeParse(withName).success).toBe(false);
  });
});

describe("CaseFileSchema", () => {
  it("accepts mixed declension list", () => {
    const c = {
      id: "possessive",
      position: 1,
      name: { russian: "Родительный падеж" },
      declensions: ["ոջ", { declension: "ու", groups: [{ name: { russian: "x" }, words: ["wine"] }] }],
      questions: [{ type: "noun", pposition: "for", question: { russian: "для чего" } }],
    };
    expect(CaseFileSchema.parse(c)).toEqual(c);
  });
  it("rejects a bad question type", () => {
    expect(
      CaseFileSchema.safeParse({ id: "a", position: 0, name: {}, questions: [{ type: "verb", question: {} }] }).success,
    ).toBe(false);
  });
});

describe("DeclensionsFileSchema / ArticleFrontmatterSchema", () => {
  it("parses", () => {
    expect(DeclensionsFileSchema.parse([{ id: "ա", name: { russian: "ա-склонение" } }])).toHaveLength(1);
    // Table keeps only the first row per id, so a duplicate would be saved and then silently invisible.
    expect(DeclensionsFileSchema.safeParse([{ id: "ա", name: { russian: "old" } }, { id: "ա", name: { russian: "new" } }]).success).toBe(false);
    expect(ArticleFrontmatterSchema.parse({ title: "t", language: "russian", position: 0 }).position).toBe(0);
    expect(ArticleFrontmatterSchema.safeParse({ title: "t", language: "klingon", position: 0 }).success).toBe(false);
  });
});

import { VerbFileSchema, TenseFileSchema, ConjugationsFileSchema, PERSONS } from "@/data/schema";

describe("verb, tense and conjugation schemas", () => {
  const verb = {
    id: "drink", infinitive: { armenian: "խմել", russian: "пить" }, conjugation: "ել",
    tenses: [{ tense: "present", forms: { "1sg": { armenian: "խմ*ում եմ*" } }, negative: { "1sg": { armenian: "*չեմ* խմ*ում*" } } }],
  };
  it("accepts a verb with per-person forms and an irregular flag", () => {
    expect(VerbFileSchema.safeParse(verb).success).toBe(true);
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [{ tense: "aorist", irregular: true, forms: { "2sg": { armenian: "եկ*ար*" } } }] }).success).toBe(true);
    expect(PERSONS).toEqual(["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]);
  });
  it("rejects an unknown person key, a tense entry with no forms, irregular:false, and a verb without conjugation", () => {
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [{ tense: "present", forms: { "4sg": { armenian: "x" } } }] }).success).toBe(false);
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [{ tense: "present" }] }).success).toBe(false);
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [{ tense: "present", forms: {}, negative: {} }] }).success).toBe(false);
    const { conjugation: _c, ...noConj } = verb;
    void _c;
    expect(VerbFileSchema.safeParse(noConj).success).toBe(false);
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [{ tense: "present", irregular: false, forms: verb.tenses[0]!.forms }] }).success).toBe(false);
  });
  it("rejects a duplicate tense entry within one verb file", () => {
    const entry = verb.tenses[0]!;
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [entry, { ...entry }] }).success).toBe(false);
    expect(VerbFileSchema.safeParse({ ...verb, tenses: [entry, { ...entry, tense: "aorist" }] }).success).toBe(true);
  });
  it("accepts a tense file with articles and groups, rejects a negative position", () => {
    expect(TenseFileSchema.safeParse({ id: "present", position: 0, name: { russian: "Настоящее", english: "Present" }, articles: ["formation"], groups: [{ name: { russian: "Составные" }, words: ["man-gal"] }] }).success).toBe(true);
    expect(TenseFileSchema.safeParse({ id: "present", position: -1, name: {} }).success).toBe(false);
  });
  it("rejects duplicate conjugation ids", () => {
    expect(ConjugationsFileSchema.safeParse([{ id: "ել", name: {} }, { id: "ել", name: {} }]).success).toBe(false);
    expect(ConjugationsFileSchema.safeParse([{ id: "ել", name: { russian: "Глаголы на -ել" } }]).success).toBe(true);
  });
});
