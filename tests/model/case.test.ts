import { Database } from "@/model/Database";
import { emptyDataFiles, type DataFiles } from "@/data/schema";

const files: DataFiles = {
  ...emptyDataFiles(),
  declensions: [{ id: "ա", name: { russian: "ա" } }, { id: "ու", name: { russian: "ու" } }],
  cases: [
    { id: "nominative", position: 0, name: { russian: "И" } },
    {
      id: "possessive", position: 1, name: { russian: "Р" }, articles: ["forms"],
      questionGroups: [{ type: "noun", name: { russian: "Для сущ." } }],
      questions: [{ type: "noun", question: { russian: "чего" } }, { type: "noun", pposition: "for", question: { russian: "для чего" } }],
      declensions: ["ա", { declension: "ու", groups: [{ name: { russian: "на ի" }, words: ["wine"] }] }],
      groups: [{ name: { russian: "ություն" }, words: ["history"] }],
    },
  ],
  words: {
    noun: [
      { id: "table", cases: [{ case: "nominative", single: { armenian: "սեղան", russian: "стол" } }, { case: "possessive", declension: "ա", single: { armenian: "սեղանի", russian: "стола" } }] },
      { id: "wine", cases: [{ case: "nominative", single: { armenian: "գինի", russian: "вино" } }, { case: "possessive", declension: "ու", single: { armenian: "գինու", russian: "вина" } }] },
      { id: "water", cases: [{ case: "nominative", single: { armenian: "ջուր", russian: "вода" } }, { case: "possessive", declension: "ու", single: { armenian: "ջրի", russian: "воды" } }] },
      { id: "history", cases: [{ case: "nominative", single: { armenian: "պատմություն", russian: "история" } }, { case: "possessive", single: { armenian: "պատմության", russian: "истории" } }] },
      { id: "dog", cases: [{ case: "nominative", single: { armenian: "շուն", russian: "собака" } }, { case: "possessive", single: { armenian: "շան", russian: "собаки" } }] },
    ],
    pronoun: [{ id: "i", cases: [{ case: "nominative", single: { armenian: "ես", russian: "я" } }, { case: "possessive", single: { armenian: "իմ", russian: "мой" } }] }],
    numeral: [], question: [], prepostposition: [{ id: "for", cases: [] }],
  },
  articles: [{ owner: "case", ownerId: "possessive", slug: "forms", title: "Форма", language: "russian", position: 0, text: "b" }],
};

const db = new Database(files);
const poss = db.case.get("possessive")!;

it("orders cases by position and resolves articles", () => {
  expect(db.case.query().map((c) => c.id)).toEqual(["nominative", "possessive"]);
  expect(poss.articles.map((a) => a.id)).toEqual(["/case/possessive/forms"]);
});

it("groups nouns: regular, declension default group, named declension group, custom group", () => {
  expect(poss.nouns.map((w) => w.id)).toEqual(["dog"]);
  const a = poss.declensions.find((d) => d.id === "ա")!;
  expect(a.groups.map((g) => g.words.map((w) => w.id))).toEqual([["table"]]);
  const u = poss.declensions.find((d) => d.id === "ու")!;
  expect(u.groups.map((g) => g.words.map((w) => w.id))).toEqual([["water"], ["wine"]]);
  expect(poss.wordGroups[0]!.words.map((w) => w.id)).toEqual(["history"]);
  expect(poss.pronouns.map((w) => w.id)).toEqual(["i"]);
});

it("questionGroups get their questions", () => {
  expect(poss.questionGroups[0]!.questions).toHaveLength(2);
});

it("a declension used by a noun but missing from the case's declensions list is still displayed", () => {
  // This is exactly what the word editor produces: it saves only the word file after DeclensionSelector.
  const dog = { id: "dog", cases: [{ case: "nominative", single: { armenian: "շուն", russian: "собака" } }, { case: "possessive", declension: "ան", single: { armenian: "շան", russian: "собаки" } }] };
  const files2: DataFiles = {
    ...files,
    declensions: [...files.declensions, { id: "ան", name: { russian: "ան" } }],
    words: { ...files.words, noun: files.words.noun.map((w) => (w.id === "dog" ? dog : w)) },
  };
  const c = new Database(files2).case.get("possessive")!;
  expect(c.nouns.map((w) => w.id)).toEqual([]);
  expect(c.declensions.map((d) => d.id)).toEqual(["ա", "ու", "ան"]);
  expect(c.declensions[2]!.groups.map((g) => g.words.map((w) => w.id))).toEqual([["dog"]]);
  expect(c.getData({ language: "russian" }).declensions.map((d) => d.id)).toEqual(["ա", "ու", "ան"]);
});

it("untyped questions land in a default group even when typed groups exist", () => {
  const files2: DataFiles = { ...files, cases: [{ ...files.cases[1]!, questions: [...(files.cases[1]!.questions ?? []), { question: { russian: "кто" } }] }] };
  const c = new Database(files2).case.get("possessive")!;
  expect(c.questionGroups.map((g) => [g.type, g.questions.length])).toEqual([["noun", 2], [undefined, 1]]);
});

it("a typed question without a matching questionGroups entry still shows up, in a nameless group of its type", () => {
  const files2: DataFiles = { ...files, cases: [{ ...files.cases[1]!, questionGroups: [], questions: [{ type: "pronoun", question: { russian: "чей" } }, { type: "noun", question: { russian: "чего" } }] }] };
  const c = new Database(files2).case.get("possessive")!;
  expect(c.questionGroups.map((g) => [g.type, g.name, g.questions.length])).toEqual([["pronoun", undefined, 1], ["noun", undefined, 1]]);
});

it("clicking an untyped question with no prepostposition (nominative's shape) filters nothing", () => {
  const nominative = { ...files.cases[0]!, questions: [{ question: { russian: "кто" } }, { question: { russian: "что" } }] };
  const c = new Database({ ...files, cases: [nominative, files.cases[1]!] }).case.get("nominative")!;
  const q = c.questionGroups[0]!.questions[0]!;
  const clicked = c.getData({ language: "russian", pposition: { pposition: q.pposition ?? null, type: q.type } });
  const ids = (v: typeof clicked) => [...v.nouns, ...v.pronouns].map((w) => w.id);
  expect(ids(clicked)).toEqual(["table", "wine", "water", "history", "dog", "i"]);
  expect(clicked).toEqual(c.getData({ language: "russian" }));
});

it("an untyped question with a prepostposition still filters by prepostposition only", () => {
  const withFor = (w: (typeof files.words.noun)[number]) =>
    w.id === "wine" ? { ...w, cases: w.cases.map((wc) => (wc.case === "possessive" ? { ...wc, examples: [{ pposition: "for", armenian: "x" }] } : wc)) } : w;
  const c = new Database({ ...files, words: { ...files.words, noun: files.words.noun.map(withFor) } }).case.get("possessive")!;
  const view = c.getData({ language: "russian", pposition: { pposition: "for", type: undefined } });
  expect(view.declensions.flatMap((d) => d.groups.flatMap((g) => g.words.map((w) => w.id)))).toEqual(["wine"]);
  expect([...view.nouns, ...view.pronouns, ...view.wordGroups.flatMap((g) => g.words)]).toEqual([]);
});

it("getData applies the filter everywhere", () => {
  const view = poss.getData({ language: "russian", query: "вин" });
  expect(view.nouns).toEqual([]);
  expect(view.declensions.map((d) => d.id)).toEqual(["ու"]);
  expect(view.declensions[0]!.groups.map((g) => g.words.map((w) => w.id))).toEqual([["wine"]]);
  expect(poss.matchesFilter({ language: "russian", query: "zzz" })).toBe(false);
});

it("findWord searches all word tables", () => {
  expect(db.findWord("i")?.type).toBe("pronoun");
  expect(db.findWord("nope")).toBeNull();
});
