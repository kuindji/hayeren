import { buildDataFiles } from "@/data/loader";

it("builds DataFiles from a glob map and derives word type from folder", () => {
  const d = buildDataFiles({
    "/data/declensions.json": [{ id: "ա", name: { russian: "ա" } }],
    "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Р" } },
    "/data/nouns/table.json": { id: "table", cases: [] },
    "/data/pronouns/i.json": { id: "i", cases: [] },
    "/data/articles/possessive/forms.md": "---\ntitle: Форма\nlanguage: russian\nposition: 0\n---\nbody\n",
  });
  expect(d.words.noun.map((w) => w.id)).toEqual(["table"]);
  expect(d.words.pronoun.map((w) => w.id)).toEqual(["i"]);
  expect(d.articles[0]).toMatchObject({ case: "possessive", slug: "forms", title: "Форма", text: "body\n" });
});

it("names the offending file on schema error", () => {
  expect(() => buildDataFiles({ "/data/nouns/bad.json": { id: "bad" } })).toThrow(/nouns\/bad\.json/);
});

it("throws when filename and id disagree", () => {
  expect(() => buildDataFiles({ "/data/nouns/a.json": { id: "b", cases: [] } })).toThrow(/nouns\/a\.json/);
});

it("rejects articles with a non-slug folder or filename", () => {
  const md = "---\ntitle: t\nlanguage: russian\nposition: 0\n---\nx\n";
  expect(() => buildDataFiles({ "/data/articles/possessive/Bad.md": md })).toThrow(/articles\/possessive\/Bad\.md/);
  expect(() => buildDataFiles({ "/data/articles/Poss/forms.md": md })).toThrow(/articles\/Poss\/forms\.md/);
});

it("throws on a file under an unrecognized top-level folder, rather than silently skipping it", () => {
  expect(() => buildDataFiles({ "/data/verbs/x.json": { id: "x" } })).toThrow(/verbs\/x\.json/);
});

it("throws on a .md file outside articles/, rather than silently dropping it", () => {
  expect(() => buildDataFiles({ "/data/nouns/readme.md": "not an article" })).toThrow(/nouns\/readme\.md/);
});

it("accepts a case and an article folder named \"data\" (the glob key prefix is stripped once, not greedily)", () => {
  const md = "---\ntitle: T\nlanguage: russian\nposition: 0\n---\nbody\n";
  const d = buildDataFiles({
    "/data/cases/data.json": { id: "data", position: 9, name: { russian: "X" }, articles: ["intro"] },
    "/data/articles/data/intro.md": md,
  });
  expect(d.cases.map((c) => c.id)).toEqual(["data"]);
  expect(d.articles[0]).toMatchObject({ case: "data", slug: "intro" });
});
