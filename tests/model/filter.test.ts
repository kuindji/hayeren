import { createFilter, combineFilters, matchPPosition } from "@/model/filter";

it("createFilter is a reactive store that notifies on key change", () => {
  const f = createFilter({ language: "russian" });
  const seen: unknown[] = [];
  f.onChange("query", (v) => seen.push(v));
  f.set("query", "a");
  f.set("query", "a");
  f.set({ query: "b", word: "table" });
  expect(seen).toEqual(["a", "b"]);
  expect(f.getData()).toEqual({ language: "russian", query: "b", word: "table" });
});

it("combineFilters merges later stores over earlier ones, skipping undefined but keeping explicit null", () => {
  const a = createFilter({ language: "russian", query: "x", word: "w1" });
  const b = createFilter({ language: "russian", word: "w2", pposition: null });
  // Clear query the way the UI would: the store keeps the key with an undefined value, which must not override "x".
  b.set("query", "y");
  b.set("query", undefined);
  expect(Object.keys(b.getData())).toContain("query");
  expect(combineFilters(a, b)).toEqual({ language: "russian", query: "x", word: "w2", pposition: null });
});

it("matchPPosition", () => {
  expect(matchPPosition(null, { pposition: "for" })).toBe(true);
  expect(matchPPosition({ pposition: "for", type: "noun" }, { pposition: "for" })).toBe(true);
  expect(matchPPosition({ pposition: "for", type: "noun" }, {})).toBe(false);
  expect(matchPPosition({ pposition: null, type: "noun" }, {})).toBe(true);
});
