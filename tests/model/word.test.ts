import { Word } from "@/model/Word";
import { strip } from "@/model/strip";

const table = new Word("noun", {
  id: "table",
  cases: [
    { case: "nominative", single: { armenian: "սեղան", russian: "стол" }, plural: { armenian: "սեղաններ", russian: "столы́" } },
    { case: "possessive", single: { armenian: "սեղան*ի*", russian: "стола́" }, examples: [{ pposition: "for", armenian: "x", russian: "y" }, { armenian: "z" }] },
  ],
});

it("strip lowercases, removes asterisks and accents", () => {
  expect(strip("Стола́*", "russian")).toBe("стола");
  expect(strip("սեղան*ի*", "russian")).toBe("սեղանի");
  expect(strip("խմ*ի՛ր*", "russian")).toBe("խմիր");
});

it("keeps a prepostposition's name on the model object", () => {
  const about = new Word("prepostposition", { id: "about", name: { russian: "про", armenian: "մասին" }, cases: [] });
  expect(about.name).toEqual({ russian: "про", armenian: "մասին" });
  expect(table.name).toBeUndefined();
});

it("getAllForms returns stripped armenian and language forms", () => {
  expect(table.getAllForms({ language: "russian" })).toEqual(["սեղան", "стол", "սեղաններ", "столы", "սեղանի", "стола"]);
});

it("matchesFilter by query, by word pin, by pposition", () => {
  expect(table.matchesFilter({ language: "russian", query: "стола" })).toBe(true);
  expect(table.matchesFilter({ language: "russian", query: "вино" })).toBe(false);
  expect(table.matchesFilter({ language: "russian", word: "table" })).toBe(true);
  expect(table.matchesFilter({ language: "russian", word: "wine" })).toBe(false);
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: "for", type: "noun" } })).toBe(true);
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: "under", type: "noun" } })).toBe(false);
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: "for", type: "pronoun" } })).toBe(false);
  // untyped question with a prepostposition: matches any word type that has the prepostposition
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: "for", type: undefined } })).toBe(true);
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: "under", type: undefined } })).toBe(false);
  // a pposition-less question matches words with a pposition-less example (old site: Postgres null === null)
  expect(table.matchesFilter({ language: "russian", pposition: { pposition: null, type: "noun" } })).toBe(true);
});

it("getExamples filters by pposition", () => {
  expect(table.getExamples("possessive")).toHaveLength(2);
  expect(table.getExamples("possessive", { pposition: "for", type: "noun" })).toHaveLength(1);
});
