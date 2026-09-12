import { checkReferences, readDataFromDisk, type DataFiles } from "@/data/validate";

const base = (): DataFiles => ({
  declensions: [{ id: "ա", name: { russian: "ա" } }],
  cases: [{ id: "nominative", position: 0, name: {} }, { id: "possessive", position: 1, name: {}, articles: ["forms"], groups: [{ words: ["table"] }], declensions: ["ա"], questions: [{ pposition: "for", question: {} }] }],
  words: {
    noun: [{ id: "table", cases: [{ case: "possessive", declension: "ա", examples: [{ pposition: "for", armenian: "x" }] }] }],
    pronoun: [], numeral: [], question: [],
    prepostposition: [{ id: "for", cases: [] }],
  },
  articles: [{ case: "possessive", slug: "forms", title: "t", language: "russian", position: 0, text: "" }],
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
  expect(problems.join("\n")).toMatch(/articles\/possessive\/forms\.md: not listed/);
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
  d.articles.push({ case: "possessive", slug: "draft", title: "t", language: "russian", position: 1, text: "" });
  expect(checkReferences(d)).toEqual(['articles/possessive/draft.md: not listed in cases/possessive.json articles']);
});

it("the real data/ folder is valid", () => {
  // No fixed counts here: this folder is edited through the admin, and adding or deleting a word
  // must not break `bun run check`. Historical counts live in tests/scripts/import.test.ts against the fixture.
  const d = readDataFromDisk("data");
  expect(checkReferences(d)).toEqual([]);
  expect(d.words.noun.length).toBeGreaterThan(0);
  expect(d.cases.length).toBeGreaterThan(0);
});
