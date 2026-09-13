import { Verb, PRONOUNS } from "@/model/Verb";
import { strip } from "@/model/strip";
import type { VerbFile } from "@/data/schema";

const drink: VerbFile = {
  id: "drink", infinitive: { armenian: "խմել", russian: "пить", transcription: "khmel" }, conjugation: "ել",
  tenses: [
    { tense: "present", forms: { "1sg": { armenian: "խմ*ում եմ*", russian: "пью" }, "2sg": { armenian: "խմ*ում ես*" } }, negative: { "1sg": { armenian: "*չեմ* խմ*ում*" } } },
    { tense: "imperative", forms: { "2sg": { armenian: "խմ*ի՛ր*", informal: "խմի" }, "2pl": { armenian: "խմ*ե՛ք*" } }, negative: { "2sg": { armenian: "*մի՛* խմ*իր*" }, "2pl": { armenian: "*մի՛* խմ*եք*" } } },
    { tense: "aorist", negative: { "3pl": { armenian: "*չ*խմ*եցին*" } } },
  ],
};

it("strip removes the Armenian stress mark and asterisks", () => {
  expect(strip("խմ*ի՛ր*", "russian")).toBe("խմիր");
  expect(strip("մի՛ խմիր", "english")).toBe("մի խմիր");
});
it("exposes pronouns in person order", () => {
  expect(Object.keys(PRONOUNS)).toEqual(["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]);
  expect(PRONOUNS["3pl"]).toBe("նրանք");
});
it("finds tense entries and the teaser form: first person present, or the first person that exists", () => {
  const v = new Verb(drink);
  expect(v.hasTense("present")).toBe(true);
  expect(v.hasTense("future")).toBe(false);
  expect(v.teaser("present")).toEqual({ person: "1sg", form: { armenian: "խմ*ում եմ*", russian: "пью" }, negative: { armenian: "*չեմ* խմ*ում*" } });
  expect(v.teaser("imperative")?.person).toBe("2sg");
  expect(v.teaser("aorist")).toEqual({ person: "3pl", negative: { armenian: "*չ*խմ*եցին*" } });
  expect(v.teaser("future")).toBeUndefined();
  expect(v.persons("imperative")).toEqual(["2sg", "2pl"]);
  expect(v.persons("aorist")).toEqual(["3pl"]);
});
it("getAllForms covers the infinitive, meanings and every affirmative and negative form, stripped", () => {
  const forms = new Verb(drink).getAllForms({ language: "russian" });
  expect(forms).toContain("խմել");
  expect(forms).toContain("пить");
  expect(forms).toContain("пью");
  expect(forms).toContain("խմում եմ");
  expect(forms).toContain("չեմ խմում");
  expect(forms).toContain("խմիր");
  expect(forms).toContain("խմի");
});
it("matchesFilter honours query and pinned word, ignores pposition", () => {
  const v = new Verb(drink);
  expect(v.matchesFilter({ language: "russian" })).toBe(true);
  expect(v.matchesFilter({ language: "russian", query: "խմիր" })).toBe(true);
  expect(v.matchesFilter({ language: "russian", query: "пью" })).toBe(true);
  expect(v.matchesFilter({ language: "russian", query: "утюг" })).toBe(false);
  expect(v.matchesFilter({ language: "russian", word: "drink" })).toBe(true);
  expect(v.matchesFilter({ language: "russian", word: "eat" })).toBe(false);
  expect(v.matchesFilter({ language: "russian", pposition: { pposition: "for", type: "noun" } })).toBe(true);
});
