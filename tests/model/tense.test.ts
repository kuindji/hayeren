import { Database } from "@/model/Database";
import { buildDataFiles } from "@/data/loader";

const files = () => buildDataFiles({
  "/data/declensions.json": [],
  "/data/conjugations.json": [{ id: "ել", name: { russian: "Глаголы на -ել" } }, { id: "ալ", name: { russian: "Глаголы на -ալ" } }, { id: "անալ", name: { russian: "Глаголы на -անալ" } }],
  "/data/tenses/present.json": { id: "present", position: 0, name: { russian: "Настоящее" }, articles: ["formation"], groups: [{ name: { russian: "Составные глаголы" }, words: ["man-gal"] }] },
  "/data/tenses/aorist.json": { id: "aorist", position: 13, name: { russian: "Аорист" } },
  "/data/articles/tenses/present/formation.md": "---\ntitle: Образование\nlanguage: russian\nposition: 0\n---\nоснова + ում\n",
  "/data/verbs/drink.json": { id: "drink", infinitive: { armenian: "խմել", russian: "пить" }, conjugation: "ել", tenses: [{ tense: "present", forms: { "1sg": { armenian: "խմում եմ" } } }, { tense: "aorist", forms: { "1sg": { armenian: "խմեցի" } } }] },
  "/data/verbs/read.json": { id: "read", infinitive: { armenian: "կարդալ", russian: "читать" }, conjugation: "ալ", tenses: [{ tense: "present", forms: { "1sg": { armenian: "կարդում եմ" } } }] },
  "/data/verbs/have.json": { id: "have", infinitive: { armenian: "ունենալ", russian: "иметь" }, conjugation: "անալ", tenses: [{ tense: "present", irregular: true, forms: { "1sg": { armenian: "ունեմ" } } }, { tense: "aorist", forms: { "1sg": { armenian: "ունեցա" } } }] },
  "/data/verbs/man-gal.json": { id: "man-gal", infinitive: { armenian: "ման գալ", russian: "гулять" }, conjugation: "ալ", tenses: [{ tense: "present", forms: { "1sg": { armenian: "ման եմ գալիս" } } }] },
});

it("orders tenses by position and resolves articles", () => {
  const db = new Database(files());
  expect(db.tense.query().map((t) => t.id)).toEqual(["present", "aorist"]);
  expect(db.tense.get("present")!.articles.map((a) => a.id)).toEqual(["/tense/present/formation"]);
});
it("groups verbs by conjugation, moves irregular ones for that tense only, and custom groups win", () => {
  const db = new Database(files());
  const present = db.tense.get("present")!.getData({ language: "russian" });
  expect(present.conjugations.map((c) => [c.id, c.verbs.map((v) => v.id)])).toEqual([["ել", ["drink"]], ["ալ", ["read"]]]);
  expect(present.irregular.map((v) => v.id)).toEqual(["have"]);
  expect(present.groups.map((g) => [g.name?.russian, g.verbs.map((v) => v.id)])).toEqual([["Составные глаголы", ["man-gal"]]]);
  const aorist = db.tense.get("aorist")!.getData({ language: "russian" });
  expect(aorist.conjugations.map((c) => [c.id, c.verbs.map((v) => v.id)])).toEqual([["ել", ["drink"]], ["անալ", ["have"]]]);
  expect(aorist.irregular).toEqual([]);
  expect(aorist.groups).toEqual([]);
});
it("filters every list by query and by pinned verb, and reports whether the tense has any match", () => {
  const db = new Database(files());
  const present = db.tense.get("present")!;
  const byQuery = present.getData({ language: "russian", query: "читать" });
  expect(byQuery.conjugations.map((c) => c.id)).toEqual(["ալ"]);
  expect(byQuery.irregular).toEqual([]);
  expect(byQuery.groups).toEqual([]);
  const pinned = present.getData({ language: "russian", word: "have" });
  expect(pinned.conjugations).toEqual([]);
  expect(pinned.irregular.map((v) => v.id)).toEqual(["have"]);
  expect(present.matchesFilter({ language: "russian", query: "утюг" })).toBe(false);
  expect(db.tense.get("aorist")!.matchesFilter({ language: "russian", word: "man-gal" })).toBe(false);
  expect(present.isEmpty()).toBe(false);
});
it("a tense with no verbs stays on the board until something is searched or pinned", () => {
  const db = new Database(buildDataFiles({ "/data/declensions.json": [], "/data/conjugations.json": [], "/data/tenses/future.json": { id: "future", position: 4, name: { russian: "Будущее" } } }));
  const future = db.tense.get("future")!;
  expect(future.isEmpty()).toBe(true);
  expect(future.matchesFilter({ language: "russian" })).toBe(true);
  expect(future.matchesFilter({ language: "russian", query: "x" })).toBe(false);
  expect(future.matchesFilter({ language: "russian", word: "drink" })).toBe(false);
});
