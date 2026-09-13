import { mkdtempSync, cpSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleApi } from "@/admin/server/routes";

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "hayeren-")); cpSync("data", root, { recursive: true }); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

const put = (path: string, body: unknown) => handleApi({ method: "PUT", path, body: JSON.stringify(body) }, root);

it("writes a valid word with sorted keys and rereads it", async () => {
  const word = { id: "cat", cases: [{ case: "nominative", single: { russian: "кот", armenian: "կատու" } }] };
  const res = await put("/words/nouns/cat", word);
  expect(res.status).toBe(200);
  const text = readFileSync(join(root, "nouns/cat.json"), "utf8");
  expect(text.indexOf('"cases"')).toBeLessThan(text.indexOf('"id"'));
  expect(text.endsWith("\n")).toBe(true);
  expect(JSON.parse(text)).toEqual(word);
});

it("rejects invalid payloads and mismatched ids with 400 and writes nothing", async () => {
  expect((await put("/words/nouns/cat", { id: "cat", cases: [{ single: {} }] })).status).toBe(400);
  expect((await put("/words/nouns/cat", { id: "dog", cases: [] })).status).toBe(400);
  expect(existsSync(join(root, "nouns/cat.json"))).toBe(false);
});

it("rejects type-specific field violations", async () => {
  expect((await put("/words/pronouns/i", { id: "i", cases: [{ case: "nominative", declension: "ա" }] })).status).toBe(400);
  expect((await put("/words/prepostpositions/for", { id: "for", cases: [{ case: "nominative", plural: { armenian: "x" } }] })).status).toBe(400);
});

it("rejects a word id that another word type already uses", async () => {
  expect((await put("/words/nouns/dup", { id: "dup", cases: [] })).status).toBe(200);
  expect((await put("/words/pronouns/dup", { id: "dup", cases: [] })).status).toBe(400);
  expect((await put("/words/nouns/dup", { id: "dup", cases: [] })).status).toBe(200); // updating the owner is fine
});

it("rejects path escapes and unknown folders before touching disk", async () => {
  expect((await put("/words/nouns/../evil", { id: "evil", cases: [] })).status).toBe(400);
  expect((await put("/words/verbs/run", { id: "run", cases: [] })).status).toBe(400);
  expect((await put("/cases/Bad", { id: "Bad", position: 0, name: {} })).status).toBe(400);
});

it("deletes a word and 404s on a missing one", async () => {
  expect((await handleApi({ method: "DELETE", path: "/words/nouns/table", body: "" }, root)).status).toBe(200);
  expect(existsSync(join(root, "nouns/table.json"))).toBe(false);
  expect((await handleApi({ method: "DELETE", path: "/words/nouns/table", body: "" }, root)).status).toBe(404);
});

it("writes cases, declensions and articles", async () => {
  expect((await put("/cases/dative", { id: "dative", position: 2, name: { russian: "Д" } })).status).toBe(200);
  expect((await put("/declensions", [{ id: "ա", name: { russian: "ա" } }])).status).toBe(200);
  expect((await put("/declensions", [{ id: "ա", name: { russian: "ա" } }, { id: "ա", name: { russian: "ա2" } }])).status).toBe(400);
  const a = await put("/articles/dative/forms", { title: "Форма", language: "russian", position: 0, text: "hi\n" });
  expect(a.status).toBe(200);
  expect(readFileSync(join(root, "articles/dative/forms.md"), "utf8")).toBe("---\ntitle: Форма\nlanguage: russian\nposition: 0\n---\nhi\n");
});

it("validate reports dangling references after a bad write", async () => {
  await put("/words/nouns/cat", { id: "cat", cases: [{ case: "vocative" }] });
  const res = await handleApi({ method: "GET", path: "/validate", body: "" }, root);
  expect((res.body as { problems: string[] }).problems.join()).toMatch(/vocative/);
});

// Ruling 2: path safety is the job. Beyond the brief's own escape test above, prove that neither
// URL-encoding nor a backslash nor an absolute-looking segment can reach outside `root`. `plugin.ts`
// never decodes the incoming path, so an encoded traversal attempt arrives at handleApi exactly as
// typed below; Slug's `^[a-z0-9][a-z0-9-]*$` forbids "%", ".", "/" and "\\" in any segment, so every
// case here must 400 before any disk access.
describe("path safety: traversal attempts never reach outside root", () => {
  it("rejects a literal .. segment (already covered above) as a control case", async () => {
    expect((await put("/words/nouns/..", { id: "x", cases: [] })).status).toBe(400);
  });

  it("rejects percent-encoded .. (%2e%2e) as an id", async () => {
    expect((await put("/words/nouns/%2e%2e", { id: "x", cases: [] })).status).toBe(400);
    expect(existsSync(join(root, "nouns/%2e%2e.json"))).toBe(false);
  });

  it("rejects an id containing an encoded slash (%2F)", async () => {
    expect((await put("/words/nouns/%2F", { id: "x", cases: [] })).status).toBe(400);
  });

  it("rejects ..%2F used as a traversal id", async () => {
    expect((await put("/words/nouns/..%2Fevil", { id: "evil", cases: [] })).status).toBe(400);
    expect(existsSync(join(root, "evil.json"))).toBe(false);
  });

  it("rejects a backslash traversal attempt", async () => {
    expect((await put("/words/nouns/..\\evil", { id: "evil", cases: [] })).status).toBe(400);
  });

  it("rejects a path with an embedded absolute-looking (empty) segment", async () => {
    expect((await put("/words/nouns//etc/passwd", { id: "passwd", cases: [] })).status).toBe(400);
  });

  it("rejects the same traversal shapes on delete and on cases/articles routes", async () => {
    expect((await handleApi({ method: "DELETE", path: "/words/nouns/%2e%2e", body: "" }, root)).status).toBe(400);
    expect((await put("/cases/%2e%2e", { id: "x", position: 0, name: {} })).status).toBe(400);
    expect((await put("/articles/%2e%2e/slug", { title: "t", language: "russian", position: 0, text: "" })).status).toBe(400);
    expect((await put("/articles/case/%2e%2e", { title: "t", language: "russian", position: 0, text: "" })).status).toBe(400);
  });
});

// Ruling 1: git-status is scoped to `root`. A mkdtemp directory is outside this repo, so `git status`
// against it is expected to fail internally; there is no meaningful "clean"/"files" assertion to make
// against a non-repo path, so the only thing worth proving here is that the route never throws and
// still returns a well-formed response.
it("git-status does not throw for a root outside any repository", async () => {
  const res = await handleApi({ method: "GET", path: "/git-status", body: "" }, root);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("files");
  expect(Array.isArray((res.body as { files: unknown }).files)).toBe(true);
});

it("returns 404 for an unknown route", async () => {
  expect((await handleApi({ method: "GET", path: "/nope", body: "" }, root)).status).toBe(404);
});

it("returns 400 for malformed JSON bodies without throwing", async () => {
  const res = await handleApi({ method: "PUT", path: "/words/nouns/cat", body: "{not json" }, root);
  expect(res.status).toBe(400);
});
