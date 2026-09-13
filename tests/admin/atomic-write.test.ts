import { mkdtempSync, cpSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";
import { handleApi } from "@/admin/server/routes";

// Simulates a write that dies part-way (ENOSPC, killed process): the first `failAfter` characters reach the file,
// then the call throws. Only armed inside a test, so fixture copying and reads use the real implementation.
const fault = vi.hoisted(() => ({ armed: false }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const writeFileSync: typeof actual.writeFileSync = (file, data, options) => {
    if (fault.armed && typeof data === "string") {
      actual.writeFileSync(file, data.slice(0, 5), options);
      throw new Error("ENOSPC: simulated partial write");
    }
    actual.writeFileSync(file, data, options);
  };
  return { ...actual, default: { ...actual, writeFileSync }, writeFileSync };
});

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "hayeren-atomic-")); cpSync("data", root, { recursive: true }); });
afterEach(() => { fault.armed = false; rmSync(root, { recursive: true, force: true }); });

const put = (path: string, body: unknown) => handleApi({ method: "PUT", path, body: JSON.stringify(body) }, root);

it("a successful JSON or Markdown write leaves no temp files behind", async () => {
  const nouns = readdirSync(join(root, "nouns"));
  expect((await put("/words/nouns/table", JSON.parse(readFileSync(join(root, "nouns/table.json"), "utf8")))).status).toBe(200);
  expect(readdirSync(join(root, "nouns"))).toEqual(nouns);
  const articles = readdirSync(join(root, "articles/dative"));
  expect((await put("/articles/dative/forms", { title: "T", language: "russian", position: 0, text: "x\n" })).status).toBe(200);
  expect(readdirSync(join(root, "articles/dative"))).toEqual(articles);
});

it("a JSON write that fails part-way leaves the original bytes and no temp file", async () => {
  const before = readFileSync(join(root, "nouns/table.json"), "utf8");
  const nouns = readdirSync(join(root, "nouns"));
  const word = { ...(JSON.parse(before) as object), comment: { russian: "новое" } };
  fault.armed = true;
  await expect(put("/words/nouns/table", word)).rejects.toThrow(/ENOSPC/);
  fault.armed = false;
  expect(readFileSync(join(root, "nouns/table.json"), "utf8")).toBe(before);
  expect(readdirSync(join(root, "nouns"))).toEqual(nouns);
});

it("a Markdown write that fails part-way leaves the original bytes and no temp file", async () => {
  const before = readFileSync(join(root, "articles/dative/forms.md"), "utf8");
  const articles = readdirSync(join(root, "articles/dative"));
  fault.armed = true;
  await expect(put("/articles/dative/forms", { title: "Новое", language: "russian", position: 0, text: "changed\n" })).rejects.toThrow(/ENOSPC/);
  fault.armed = false;
  expect(readFileSync(join(root, "articles/dative/forms.md"), "utf8")).toBe(before);
  expect(readdirSync(join(root, "articles/dative"))).toEqual(articles);
});
