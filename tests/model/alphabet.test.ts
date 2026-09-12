import alphabet from "@/model/alphabet";

const isArmenian = (s: string) => [...s].every((c) => { const p = c.codePointAt(0) ?? 0; return p >= 0x531 && p <= 0x58f; });

it("uses only Armenian code points for letters (empty upper allowed for և)", () => {
  const bad = alphabet
    .flatMap((l, i) => (["lower", "upper"] as const).map((k) => ({ i: i + 1, k, v: l.armenian[k] })))
    .filter(({ k, v }) => !(v === "" && k === "upper") && (v === "" || !isArmenian(v)));
  expect(bad).toEqual([]);
});
