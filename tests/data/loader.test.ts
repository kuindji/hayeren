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
