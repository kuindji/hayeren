import { readDataFromDisk } from "@/data/validate";
import { strip } from "@/model/strip";

// Cells copied from the owner's notes (sheet "Tenses"); a transcription slip in the sample verbs fails CI.
const d = readDataFromDisk("data");
const form = (verb: string, tense: string, person: string, negative = false) => {
  const v = d.verbs.find((x) => x.id === verb);
  const t = v?.tenses.find((x) => x.tense === tense);
  const set = negative ? t?.negative : t?.forms;
  return strip((set as Record<string, { armenian?: string }> | undefined)?.[person]?.armenian, "russian");
};

it.each([
  ["bite", "present", "3sg", false, "կծում է"],
  ["bite", "present", "3sg", true, "չի կծում"],
  ["bite", "imperfect", "2pl", true, "չէիք կծում"],
  ["send", "pluperfect", "1pl", false, "ուղարկել էինք"],
  ["swim", "present", "3pl", false, "լողում են"],
  ["stay", "perfect", "2sg", false, "մնացել ես"],
  ["read", "conditional", "3sg", true, "չի կարդա"],
  ["read", "optative-past", "1pl", false, "կարդայինք"],
  ["read", "aorist", "3sg", false, "կարդաց"],
  ["eat", "necessitative", "1sg", true, "չպիտի ուտեմ"],
  ["eat", "imperative", "2sg", false, "կեր"],
  ["come", "aorist", "3sg", false, "եկավ"],
  ["give", "imperative", "2sg", false, "տուր"],
  ["forget", "aorist", "3pl", false, "մոռացան"],
  ["approach", "aorist", "1sg", false, "մոտեցա"],
  ["have", "present", "1sg", false, "ունեմ"],
  ["know", "imperfect", "3sg", false, "գիտեր"],
  ["reach", "aorist", "2sg", false, "հասար"],
  ["get-lost", "imperative", "2pl", false, "կորեք"],
  ["get-up", "perfect", "1sg", false, "վեր եմ կացել"],
  ["man-gal", "conditional", "1sg", false, "ման կգամ"],
  ["man-gal", "aorist", "1sg", true, "ման չեկա"],
  ["make-happy", "aorist", "3sg", false, "ուրախացրեց"],
])("%s %s %s negative=%s is %s", (verb, tense, person, negative, expected) => {
  expect(form(verb, tense, person, negative)).toBe(expected);
});

it("every tense entry with affirmative forms has a negative for each of those persons", () => {
  // Transcription rule 3: negatives are derived by pattern where the notes omit them, so none may be missing.
  for (const v of d.verbs) for (const t of v.tenses) {
    const persons = Object.keys(t.forms ?? {});
    for (const p of persons) expect(t.negative ?? {}, `${v.id}/${t.tense}/${p} has no negative`).toHaveProperty(p);
  }
});

it("conditional and conditional-past negatives mark the changing verb ending", () => {
  for (const v of d.verbs) {
    for (const t of v.tenses) {
      if (t.tense !== "conditional" && t.tense !== "conditional-past") continue;
      for (const [person, f] of Object.entries(t.negative ?? {})) {
        const armenian = (f as { armenian?: string }).armenian ?? "";
        const rest = armenian.replace(/^[^*]*\*[^*]*\*/, "");
        expect(rest, `${v.id}/${t.tense}/${person} negative "${armenian}" has no marked verb ending`).toMatch(/\*[^*]+\*/);
      }
    }
  }
});

it.each([
  ["make-happy", "conditional"],
  ["man-gal", "conditional"],
  ["man-gal", "necessitative"],
])("%s/%s negative carries the derived-negative comment", (verb, tense) => {
  const v = d.verbs.find((x) => x.id === verb);
  const t = v?.tenses.find((x) => x.tense === tense);
  expect(t?.comment?.russian ?? "").toContain("отрицание не из конспекта");
});

it("the transcribed data has the expected counts", () => {
  expect(d.conjugations).toHaveLength(7);
  expect(d.tenses).toHaveLength(14);
  expect(d.verbs).toHaveLength(63);
  expect(d.articles.filter((a) => a.owner === "case")).toHaveLength(3);
  expect(d.articles.filter((a) => a.owner === "tense")).toHaveLength(16); // 14 formation + present/usage + necessitative/usage
});

it("every verb in the notes has a file", () => {
  const ids = new Set(d.verbs.map((v) => v.id));
  for (const id of ["bite", "send", "drink", "eat", "do", "put", "carry", "be", "say", "bring", "get-up", "make-happy", "swim", "stay", "read", "go", "come", "give", "cry", "man-gal",
    "forget", "understand", "get-acquainted", "wake-up", "bathe", "get-angry", "go-away", "rejoice", "rest", "be-late", "be-surprised", "recover", "can", "receive", "promise", "rise", "marry", "get-bored", "get-sick", "steal", "have-fun", "wash", "become", "return",
    "approach", "fear", "have", "know", "see", "reach", "find", "enter", "put-on", "pass", "buy", "go-down", "fall", "leave", "run-away", "fly", "freeze", "get-lost", "touch"]) {
    expect(ids, `missing verb ${id}`).toContain(id);
  }
});
