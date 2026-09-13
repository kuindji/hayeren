import { checkReferences, findReferenceProblems, readDataFromDisk, type DataFiles } from "@/data/validate";
import { emptyDataFiles } from "@/data/schema";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildDataFiles } from "@/data/loader";

const base = (): DataFiles => ({
  ...emptyDataFiles(),
  declensions: [{ id: "ա", name: { russian: "ա" } }],
  cases: [{ id: "nominative", position: 0, name: {} }, { id: "possessive", position: 1, name: {}, articles: ["forms"], groups: [{ words: ["table"] }], declensions: ["ա"], questions: [{ pposition: "for", question: {} }] }],
  words: {
    noun: [{ id: "table", cases: [{ case: "possessive", declension: "ա", examples: [{ pposition: "for", armenian: "x" }] }] }],
    pronoun: [], numeral: [], question: [],
    prepostposition: [{ id: "for", cases: [] }],
  },
  articles: [{ owner: "case", ownerId: "possessive", slug: "forms", title: "t", language: "russian", position: 0, text: "" }],
});

it("passes a consistent dataset", () => {
  expect(checkReferences(base())).toEqual([]);
});

it("reports every kind of dangling reference", () => {
  const d = base();
  d.words.noun[0]!.cases[0]!.case = "vocative";
  d.words.noun[0]!.cases[0]!.declension = "ց";
  d.words.noun[0]!.cases[0]!.examples![0]!.pposition = "under";
  d.cases[1]!.groups![0]!.words = ["table", "ghost"];
  d.cases[1]!.articles = ["missing"];
  d.cases[1]!.questions![0]!.pposition = "under";
  d.cases[1]!.declensions = ["ց"];
  const problems = checkReferences(d);
  // 7 dangling references, the "forms" article orphaned by replacing the case's articles list,
  // and "table" left in the possessive custom group after its only case entry was renamed to "vocative".
  expect(problems).toHaveLength(9);
  expect(problems.join("\n")).toMatch(/noun "table" in group has no form for this case/);
  expect(problems.join("\n")).toMatch(/nouns\/table.*case "vocative"/);
  expect(problems.join("\n")).toMatch(/cases\/possessive.*article "missing"/);
  expect(problems.join("\n")).toMatch(/articles\/cases\/possessive\/forms\.md: not listed/);
});

it("reports a custom-group noun that has no form for that case, and an id shared by two word types", () => {
  const d = base();
  d.words.noun.push({ id: "dog", cases: [{ case: "nominative" }] });
  d.cases[1]!.groups = [{ words: ["dog"] }];
  d.words.pronoun.push({ id: "table", cases: [] });
  expect(checkReferences(d).sort()).toEqual([
    'cases/possessive.json: noun "dog" in group has no form for this case',
    'pronouns/table.json: id "table" is already used by nouns/table.json',
  ]);
});

it("reports a noun in a declension group that lacks that declension in that case (invisible on the site)", () => {
  const d = base();
  d.cases[1]!.declensions = [{ declension: "ա", groups: [{ words: ["table"] }] }];
  expect(checkReferences(d)).toEqual([]); // table has possessive/ա
  d.words.noun[0]!.cases[0]!.declension = undefined; // drop the declension: still a valid noun file
  delete (d.words.noun[0]!.cases[0] as { declension?: string }).declension;
  expect(checkReferences(d)).toEqual(['cases/possessive.json: noun "table" in declension "ա" group has no "ա" form for this case']);
});

it("reports an article file that its case does not list (invisible on the site)", () => {
  const d = base();
  d.articles.push({ owner: "case", ownerId: "possessive", slug: "draft", title: "t", language: "russian", position: 1, text: "" });
  expect(checkReferences(d)).toEqual(['articles/cases/possessive/draft.md: not listed in cases/possessive.json articles']);
});

it("reports tense article problems", () => {
  const d = base();
  d.tenses = [{ id: "present", position: 0, name: {}, articles: ["formation", "missing"] }];
  d.articles.push(
    { owner: "tense", ownerId: "present", slug: "formation", title: "t", language: "russian", position: 0, text: "" },
    { owner: "tense", ownerId: "present", slug: "orphan", title: "t", language: "russian", position: 1, text: "" },
    { owner: "tense", ownerId: "nope", slug: "x", title: "t", language: "russian", position: 0, text: "" },
  );
  const problems = findReferenceProblems(d);
  const text = problems.map((p) => p.message).join("\n");
  expect(text).toMatch(/tenses\/present\.json: unknown article "missing"/);
  expect(text).toMatch(/articles\/tenses\/present\/orphan\.md: not listed in tenses\/present\.json articles/);
  expect(text).toMatch(/articles\/tenses\/nope\/x\.md: unknown tense "nope"/);
  expect(problems).toHaveLength(3);
  expect(problems.find((p) => p.message.includes("orphan"))?.kind).toBe("unlisted-article");
});

it("reports an unknown noun inside a declension group (a different code path from a custom group)", () => {
  const d = base();
  d.cases[1]!.declensions = [{ declension: "ա", groups: [{ words: ["ghost"] }] }];
  expect(checkReferences(d)).toEqual(['cases/possessive.json: unknown noun "ghost" in group']);
});

it("reports dangling verb and tense references", () => {
  const d = base();
  d.conjugations = [{ id: "ել", name: {} }];
  d.tenses = [
    { id: "present", position: 0, name: {}, groups: [{ words: ["drink", "ghost", "eat"] }] },
    { id: "aorist", position: 0, name: {} },
  ];
  d.verbs = [
    { id: "drink", infinitive: {}, conjugation: "ել", tenses: [{ tense: "present", forms: { "1sg": { armenian: "x" } } }, { tense: "vocative", forms: { "1sg": { armenian: "x" } } }] },
    { id: "eat", infinitive: {}, conjugation: "ալ", tenses: [{ tense: "aorist", forms: { "1sg": { armenian: "x" } } }] },
  ];
  const problems = checkReferences(d);
  const text = problems.join("\n");
  expect(text).toMatch(/verbs\/drink\.json: unknown tense "vocative"/);
  expect(text).toMatch(/verbs\/eat\.json: unknown conjugation "ալ"/);
  expect(text).toMatch(/tenses\/present\.json: unknown verb "ghost" in group/);
  expect(text).toMatch(/tenses\/present\.json: verb "eat" in group has no entry for this tense/);
  expect(text).toMatch(/tenses\/aorist\.json: position 0 is also used by tenses\/present\.json/);
  expect(problems).toHaveLength(5);
});

it("reports an article referencing an unknown case", () => {
  const d = base();
  d.cases[1]!.articles = undefined; // isolate the unknown-case check from the "not listed" one
  d.articles[0]!.ownerId = "genitive";
  expect(checkReferences(d)).toEqual(['articles/cases/genitive/forms.md: unknown case "genitive"']);
});

it("readDataFromDisk throws with the offending file's path on a schema violation", () => {
  const dir = mkdtempSync(join(tmpdir(), "hayeren-validate-"));
  try {
    writeFileSync(join(dir, "declensions.json"), JSON.stringify([{ id: 123, name: {} }]));
    writeFileSync(join(dir, "conjugations.json"), "[]");
    expect(() => readDataFromDisk(dir)).toThrow(/declensions\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("readDataFromDisk throws with the offending file's path when a case id does not match its filename", () => {
  const dir = mkdtempSync(join(tmpdir(), "hayeren-validate-"));
  try {
    writeFileSync(join(dir, "declensions.json"), "[]");
    writeFileSync(join(dir, "conjugations.json"), "[]");
    mkdirSync(join(dir, "cases"));
    writeFileSync(join(dir, "cases", "foo.json"), JSON.stringify({ id: "bar", position: 0, name: {} }));
    expect(() => readDataFromDisk(dir)).toThrow(/cases\/foo\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("the real data/ folder is valid", () => {
  // No fixed counts here: this folder is edited through the admin, and adding or deleting a word
  // must not break `bun run check`. Historical counts live in tests/scripts/import.test.ts against the fixture.
  const d = readDataFromDisk("data");
  expect(checkReferences(d)).toEqual([]);
  expect(d.conjugations).toHaveLength(7);
  expect(d.tenses).toHaveLength(14);
  expect(d.verbs.length).toBeGreaterThan(0);
  expect(d.words.noun.length).toBeGreaterThan(0);
  expect(d.cases.length).toBeGreaterThan(0);
});

// The site loader throws on any .json/.md file it does not recognise, so the validator must refuse the same files
// rather than pass a data/ folder that then breaks the site and the admin.
describe("readDataFromDisk rejects files the site loader rejects", () => {
  const withFile = (rel: string, content: string, fn: (dir: string) => void) => {
    const dir = mkdtempSync(join(tmpdir(), "hayeren-validate-"));
    try {
      cpSync("data", dir, { recursive: true });
      mkdirSync(join(dir, dirname(rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it.each([
    ["adverbs/go.json", JSON.stringify({ id: "go", cases: [] })],
    ["nouns/readme.md", "not an article"],
    ["articles/possessive/extra.json", "{}"],
    ["articles/possessive/forms.md", "---\ntitle: T\nlanguage: russian\nposition: 0\n---\nx\n"],
    ["articles/possessive/nested/deep.md", "---\ntitle: T\nlanguage: russian\nposition: 0\n---\nx\n"],
    ["cases/nested/x.json", "{}"],
    ["notes.md", "stray"],
  ])("%s", (rel, content) => {
    withFile(rel, content, (dir) => {
      expect(() => buildDataFiles({ [`/data/${rel}`]: rel.endsWith(".md") ? content : (JSON.parse(content) as unknown) })).toThrow(/unexpected file/);
      expect(() => readDataFromDisk(dir)).toThrow(new RegExp(`${rel.replace(/[.]/g, "\\.")}: unexpected file in data/`));
    });
  });

  it("ignores files the loader never globs (neither .json nor .md)", () => {
    withFile("nouns/.DS_Store", "x", (dir) => expect(checkReferences(readDataFromDisk(dir))).toEqual([]));
  });
});
