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
