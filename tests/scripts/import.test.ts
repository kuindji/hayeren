import { importDump, writeData } from "../../scripts/import-pg-dump";
import { WORD_TYPES, wordFileSchemaFor } from "@/data/schema";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Not `new URL("...", import.meta.url)`: Vite rewrites that pattern into an asset URL
// (http://localhost:3000/...) under vitest, so fileURLToPath rejects it. This is the same
// path, computed in a way Vite leaves alone, and stays portable on the CI runner.
const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/pg-dump-2023.sql");

describe("importDump", () => {
  const out = importDump(readFileSync(FIXTURE, "utf8"));
  it("produces the expected counts", () => {
    expect(out.declensions).toHaveLength(7);
    expect(Object.keys(out.cases)).toHaveLength(6);
    expect(Object.keys(out.words.noun)).toHaveLength(50);
    expect(Object.keys(out.words.pronoun)).toHaveLength(8);
    expect(Object.keys(out.words.numeral)).toHaveLength(31);
    expect(Object.keys(out.words.question)).toHaveLength(11);
    expect(Object.keys(out.words.prepostposition)).toHaveLength(15);
    expect(out.articles).toHaveLength(3);
    const nounCases = Object.values(out.words.noun).reduce((n, w) => n + w.cases.length, 0);
    expect(nounCases).toBe(103);
    const nounExamples = Object.values(out.words.noun).reduce(
      (n, w) => n + w.cases.reduce((m, c) => m + (c.examples?.length ?? 0), 0),
      0,
    );
    expect(nounExamples).toBe(27);
  });
  it("keeps the required cases array on words that have no case rows", () => {
    // 13 numerals and 10 prepostpositions in the 2023 dump have no *_case rows at all.
    expect(out.words.numeral["14"]?.cases).toEqual([]);
    expect(out.words.prepostposition.about?.cases).toEqual([]);
    // prepostposition.name is the only label these words have; it must survive the import.
    expect(out.words.prepostposition.about?.name).toEqual({ russian: "про", armenian: "մասին" });
    expect(
      Object.values(out.words.prepostposition).every((w) => w.name?.russian && w.name.armenian),
    ).toBe(true);
    expect(out.words.noun.table?.name).toBeUndefined();
    for (const type of WORD_TYPES) {
      for (const w of Object.values(out.words[type])) {
        const r = wordFileSchemaFor(type).safeParse(w);
        expect(r.success, `${type}/${w.id}: ${r.error?.message ?? ""}`).toBe(true);
      }
    }
  });
  it("renames he/she and strips empty and misspelled keys", () => {
    expect(out.words.pronoun["he-she"]).toBeDefined();
    expect(out.words.pronoun["he/she"]).toBeUndefined();
    const q = out.cases.possessive?.questions?.[0];
    expect(q && "egnlish" in q.question).toBe(false);
    expect(JSON.stringify(out)).not.toContain('""');
  });
  it("keeps declensions in first-seen noun_case order, grouped ones as objects", () => {
    const decl = out.cases.possessive?.declensions ?? [];
    const ids = decl.map((d) => (typeof d === "string" ? d : d.declension));
    // first-seen order in the dump's noun_case COPY block for possessive
    expect(ids.slice(0, 3)).toEqual(["ու", "ոջ", "ա"]);
    expect(decl).toContain("ա");
    expect(decl.find((d) => typeof d === "object" && d.declension === "ու")).toBeDefined();
    expect(out.cases.possessive?.articles).toEqual(["forms", "usage"]);
  });
  it("refuses to write an article the schema rejects", () => {
    const dir = mkdtempSync(join(tmpdir(), "hayeren-import-"));
    try {
      writeData(out, dir);
      expect(readFileSync(join(dir, "articles", "dative", "forms.md"), "utf8")).toContain(
        "position: 0",
      );
      const bad = structuredClone(out);
      const dative = bad.articles.find((a) => a.case === "dative");
      if (!dative) throw new Error("fixture changed: no dative article to corrupt");
      dative.position = -1;
      expect(() => {
        writeData(bad, dir);
      }).toThrow(/articles\/dative\/forms\.md/);
      expect(existsSync(join(dir, "articles", "dative", "forms.md"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
