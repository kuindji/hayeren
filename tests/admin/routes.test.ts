import { mkdtempSync, cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
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
  // "i" and "for" already exist in the fixture data copied into `root`, so the assertion that matters is
  // that the rejected PUT left them byte-for-byte unchanged, not that the file is absent.
  const iBefore = readFileSync(join(root, "pronouns/i.json"), "utf8");
  const forBefore = readFileSync(join(root, "prepostpositions/for.json"), "utf8");
  expect((await put("/words/pronouns/i", { id: "i", cases: [{ case: "nominative", declension: "ա" }] })).status).toBe(400);
  expect((await put("/words/prepostpositions/for", { id: "for", cases: [{ case: "nominative", plural: { armenian: "x" } }] })).status).toBe(400);
  expect(readFileSync(join(root, "pronouns/i.json"), "utf8")).toBe(iBefore);
  expect(readFileSync(join(root, "prepostpositions/for.json"), "utf8")).toBe(forBefore);
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
  expect(existsSync(join(root, "nouns/evil.json"))).toBe(false);
  expect(existsSync(join(root, "evil.json"))).toBe(false);
  expect(existsSync(join(root, "verbs/run.json"))).toBe(false);
  expect(existsSync(join(root, "run.json"))).toBe(false);
  expect(existsSync(join(root, "cases/Bad.json"))).toBe(false);
});

it("deletes a word and 404s on a missing one", async () => {
  // "angle" is listed in no case group, so deleting it introduces no reference problem.
  expect((await handleApi({ method: "DELETE", path: "/words/nouns/angle", body: "" }, root)).status).toBe(200);
  expect(existsSync(join(root, "nouns/angle.json"))).toBe(false);
  expect((await handleApi({ method: "DELETE", path: "/words/nouns/angle", body: "" }, root)).status).toBe(404);
});

it("writes cases, declensions and articles", async () => {
  expect((await put("/cases/dative", { id: "dative", position: 2, name: { russian: "Д" } })).status).toBe(200);
  // Keep every declension that words and cases already use, so the write introduces no reference problem.
  const declensions = JSON.parse(readFileSync(join(root, "declensions.json"), "utf8")) as unknown[];
  expect((await put("/declensions", [...declensions, { id: "իա", name: { russian: "իա" } }])).status).toBe(200);
  const declensionsAfterGoodWrite = readFileSync(join(root, "declensions.json"), "utf8");
  expect(declensionsAfterGoodWrite).toMatch(/"իա"/);
  expect((await put("/declensions", [{ id: "ա", name: { russian: "ա" } }, { id: "ա", name: { russian: "ա2" } }])).status).toBe(400);
  expect(readFileSync(join(root, "declensions.json"), "utf8")).toBe(declensionsAfterGoodWrite);
  const a = await put("/articles/cases/dative/forms", { title: "Форма", language: "russian", position: 0, text: "hi\n" });
  expect(a.status).toBe(200);
  expect(readFileSync(join(root, "articles/cases/dative/forms.md"), "utf8")).toBe("---\ntitle: Форма\nlanguage: russian\nposition: 0\n---\nhi\n");
});

it("deletes an article and 404s on a missing one", async () => {
  await put("/articles/cases/dative/forms", { title: "Форма", language: "russian", position: 0, text: "hi\n" });
  const putCase = await put("/cases/dative", { id: "dative", position: 2, name: { russian: "Д" } });
  expect(putCase.status).toBe(200);
  expect(existsSync(join(root, "articles/cases/dative/forms.md"))).toBe(true);
  expect((await handleApi({ method: "DELETE", path: "/articles/cases/dative/forms", body: "" }, root)).status).toBe(200);
  expect(existsSync(join(root, "articles/cases/dative/forms.md"))).toBe(false);
  expect((await handleApi({ method: "DELETE", path: "/articles/cases/dative/forms", body: "" }, root)).status).toBe(404);
});

it("rejects the old two-segment article path and an unknown owner folder", async () => {
  const body = { title: "Форма", language: "russian", position: 0, text: "hi\n" };
  expect((await put("/articles/possessive/forms", body)).status).toBe(400);
  expect((await put("/articles/nouns/table/forms", body)).status).toBe(400);
  expect(existsSync(join(root, "articles/possessive/forms.md"))).toBe(false);
  expect(existsSync(join(root, "articles/nouns/table/forms.md"))).toBe(false);
});

it("writes a tense article under articles/tenses", async () => {
  mkdirSync(join(root, "tenses"), { recursive: true });
  writeFileSync(join(root, "tenses", "present.json"), JSON.stringify({ id: "present", position: 0, name: { russian: "Настоящее" }, articles: ["formation"] }));
  const r = await put("/articles/tenses/present/formation", { title: "Образование", language: "russian", position: 0, text: "hi\n" });
  expect(r.status).toBe(200);
  expect(readFileSync(join(root, "articles/tenses/present/formation.md"), "utf8")).toBe("---\ntitle: Образование\nlanguage: russian\nposition: 0\n---\nhi\n");
});

it("rejects a case PUT whose body id does not match the URL id", async () => {
  const before = readFileSync(join(root, "cases/nominative.json"), "utf8");
  const res = await put("/cases/nominative", { id: "genitive", position: 0, name: { russian: "x" } });
  expect(res.status).toBe(400);
  expect(readFileSync(join(root, "cases/nominative.json"), "utf8")).toBe(before);
});

// Fix (review round 1, finding 2): `serializeFrontmatter` does not escape frontmatter field values, so a
// title containing a newline could inject extra frontmatter lines or a stray `---` delimiter. The route now
// serializes, re-parses, and rejects anything that does not round-trip exactly.
describe("article frontmatter injection is rejected before writing", () => {
  it("rejects a title that injects a stray --- delimiter", async () => {
    const res = await put("/articles/cases/nominative/injected", { title: "Hi\n---\nsurprise", language: "russian", position: 0, text: "body\n" });
    expect(res.status).toBe(400);
    expect(existsSync(join(root, "articles/cases/nominative/injected.md"))).toBe(false);
  });

  it("rejects a title that injects a duplicate frontmatter key", async () => {
    const res = await put("/articles/cases/nominative/injected2", { title: "Hi\nlanguage: english", language: "russian", position: 0, text: "b\n" });
    expect(res.status).toBe(400);
    expect(existsSync(join(root, "articles/cases/nominative/injected2.md"))).toBe(false);
  });

  it("rejects a title with leading/trailing spaces that parseFrontmatter would silently trim away", async () => {
    const res = await put("/articles/cases/nominative/injected3", { title: "  Hi  ", language: "russian", position: 0, text: "b\n" });
    expect(res.status).toBe(400);
    expect(existsSync(join(root, "articles/cases/nominative/injected3.md"))).toBe(false);
  });

  it("still writes and round-trips a normal article", async () => {
    const res = await put("/articles/cases/nominative/normal", { title: "Normal Title", language: "english", position: 3, text: "hello\nworld\n" });
    expect(res.status).toBe(200);
    expect(readFileSync(join(root, "articles/cases/nominative/normal.md"), "utf8")).toBe("---\ntitle: Normal Title\nlanguage: english\nposition: 3\n---\nhello\nworld\n");
  });
});

it("validate reports dangling references in files written outside the API", async () => {
  writeFileSync(join(root, "nouns/cat.json"), JSON.stringify({ id: "cat", cases: [{ case: "vocative" }] }));
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
    expect(existsSync(join(root, "nouns/%2F.json"))).toBe(false);
  });

  it("rejects ..%2F used as a traversal id", async () => {
    expect((await put("/words/nouns/..%2Fevil", { id: "evil", cases: [] })).status).toBe(400);
    expect(existsSync(join(root, "evil.json"))).toBe(false);
  });

  it("rejects a backslash traversal attempt", async () => {
    expect((await put("/words/nouns/..\\evil", { id: "evil", cases: [] })).status).toBe(400);
    expect(existsSync(join(root, "evil.json"))).toBe(false);
    expect(existsSync(join(root, "nouns/..\\evil.json"))).toBe(false);
  });

  it("rejects a path with an embedded absolute-looking (empty) segment", async () => {
    expect((await put("/words/nouns//etc/passwd", { id: "passwd", cases: [] })).status).toBe(400);
    expect(existsSync(join(root, "etc"))).toBe(false);
    expect(existsSync(join(root, "nouns/passwd.json"))).toBe(false);
  });

  it("rejects the same traversal shapes on delete and on cases/articles routes", async () => {
    expect((await handleApi({ method: "DELETE", path: "/words/nouns/%2e%2e", body: "" }, root)).status).toBe(400);
    expect((await put("/cases/%2e%2e", { id: "x", position: 0, name: {} })).status).toBe(400);
    expect((await put("/articles/%2e%2e/slug", { title: "t", language: "russian", position: 0, text: "" })).status).toBe(400);
    expect((await put("/articles/cases/case/%2e%2e", { title: "t", language: "russian", position: 0, text: "" })).status).toBe(400);
    expect((await put("/articles/%2e%2e/x/y", { title: "t", language: "russian", position: 0, text: "" })).status).toBe(400);
    expect(existsSync(join(root, "cases/%2e%2e.json"))).toBe(false);
    expect(existsSync(join(root, "articles/%2e%2e"))).toBe(false);
    expect(existsSync(join(root, "articles/cases/case"))).toBe(false);
  });
});

// Ruling 1: git-status is scoped to `root`. A mkdtemp directory is outside this repo, so `git status`
// against it is expected to fail internally. Fix (review round 1, minor M2): report that failure as an
// explicit error rather than the previous `{ clean: true, files: [] }`, which would have told the Task 12
// admin UI a working tree it knows nothing about is "clean".
it("git-status does not throw for a root outside any repository, and reports it as an error", async () => {
  const res = await handleApi({ method: "GET", path: "/git-status", body: "" }, root);
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty("error");
});

// Fix (review round 1, finding 1): a real repo with two unstaged modifications reproduces the
// `--porcelain` leading-space bug the reviewer found — trimming the whole output ate the first
// character of the first reported path.
it("git-status reports every modified file's path in full, unmangled by a leading status space", async () => {
  const repo = mkdtempSync(join(tmpdir(), "hayeren-repo-"));
  const dataDir = join(repo, "data");
  mkdirSync(join(dataDir, "nouns"), { recursive: true });
  writeFileSync(join(dataDir, "nouns/cat.json"), "{}\n");
  writeFileSync(join(dataDir, "nouns/dog.json"), "{}\n");
  const git = (...gitArgs: string[]) =>
    execFileSync("git", gitArgs, { cwd: repo, stdio: ["ignore", "pipe", "pipe"] }).toString();
  git("init", "-q");
  git("add", ".");
  git("-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "-qm", "init");
  writeFileSync(join(dataDir, "nouns/cat.json"), '{"x":1}\n');
  writeFileSync(join(dataDir, "nouns/dog.json"), '{"x":1}\n');
  const cwd = process.cwd();
  process.chdir(repo);
  try {
    const res = await handleApi({ method: "GET", path: "/git-status", body: "" }, "data");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ clean: false, files: ["data/nouns/cat.json", "data/nouns/dog.json"] });
  } finally {
    process.chdir(cwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

it("returns 404 for an unknown route", async () => {
  expect((await handleApi({ method: "GET", path: "/nope", body: "" }, root)).status).toBe(404);
});

it("returns 400 for malformed JSON bodies without throwing", async () => {
  const res = await handleApi({ method: "PUT", path: "/words/nouns/cat", body: "{not json" }, root);
  expect(res.status).toBe(400);
});

// Final review F2: a write that would leave dangling references is refused with 409 and nothing is written.
// Problems already on disk never block a write, and an article file its case does not list (the intermediate
// state of the admin's two-step article save and delete) is not treated as a new problem.
describe("writes that would introduce reference problems are refused", () => {
  const del = (path: string) => handleApi({ method: "DELETE", path, body: "" }, root);
  const problems = async () => ((await handleApi({ method: "GET", path: "/validate", body: "" }, root)).body as { problems: string[] }).problems;
  const snapshot = (rels: string[]) => rels.map((rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8") : null));

  it("refuses to delete a noun a case group lists (C1)", async () => {
    expect(await problems()).toEqual([]);
    const before = snapshot(["nouns/history.json"]);
    const res = await del("/words/nouns/history");
    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toMatch(/cases\/possessive\.json: unknown noun "history" in group/);
    expect(snapshot(["nouns/history.json"])).toEqual(before);
    expect(await problems()).toEqual([]);
  });

  it("refuses a declensions list that drops a declension in use (C2)", async () => {
    const before = snapshot(["declensions.json"]);
    const all = JSON.parse(before[0]!) as { id: string }[];
    const res = await put("/declensions", all.filter((d) => d.id !== "ա"));
    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toMatch(/unknown declension "ա"/);
    expect(snapshot(["declensions.json"])).toEqual(before);
    expect(await problems()).toEqual([]);
  });

  it("refuses a word PUT and a case PUT that reference something missing", async () => {
    const res = await put("/words/nouns/cat", { id: "cat", cases: [{ case: "vocative" }] });
    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toMatch(/nouns\/cat\.json: unknown case "vocative"/);
    expect(existsSync(join(root, "nouns/cat.json"))).toBe(false);
    const caseBefore = snapshot(["cases/dative.json"]);
    const c = JSON.parse(caseBefore[0]!) as object;
    const res2 = await put("/cases/dative", { ...c, groups: [{ words: ["ghost"] }] });
    expect(res2.status).toBe(409);
    expect((res2.body as { error: string }).error).toMatch(/cases\/dative\.json: unknown noun "ghost" in group/);
    expect(snapshot(["cases/dative.json"])).toEqual(caseBefore);
  });

  it("a problem already on disk does not block an unrelated write, nor a write that repairs it", async () => {
    writeFileSync(join(root, "nouns/cat.json"), JSON.stringify({ id: "cat", cases: [{ case: "vocative" }] }));
    expect(await problems()).toHaveLength(1);
    expect((await put("/words/nouns/dog2", { id: "dog2", cases: [{ case: "nominative" }] })).status).toBe(200);
    expect((await put("/words/nouns/cat", { id: "cat", cases: [{ case: "vocative", single: { russian: "кот" } }] })).status).toBe(200);
    expect((await put("/words/nouns/cat", { id: "cat", cases: [{ case: "nominative" }] })).status).toBe(200);
    expect(await problems()).toEqual([]);
  });

  it("does not block writes when the data on disk cannot be read at all", async () => {
    writeFileSync(join(root, "nouns/broken.json"), "{not json");
    expect((await put("/words/nouns/cat", { id: "cat", cases: [{ case: "vocative" }] })).status).toBe(200);
  });

  it("the admin's two-step article save and delete still go through", async () => {
    const caseFile = JSON.parse(readFileSync(join(root, "cases/dative.json"), "utf8")) as { articles?: string[] };
    // Save: article file first (leaves an unlisted file), then the case listing it.
    expect((await put("/articles/cases/dative/usage", { title: "Употребление", language: "russian", position: 1, text: "x\n" })).status).toBe(200);
    expect((await put("/cases/dative", { ...caseFile, articles: [...(caseFile.articles ?? []), "usage"] })).status).toBe(200);
    expect(await problems()).toEqual([]);
    // Delete: unlist first (leaves an unlisted file), then delete the file.
    expect((await put("/cases/dative", caseFile)).status).toBe(200);
    expect(await problems()).toEqual(["articles/cases/dative/usage.md: not listed in cases/dative.json articles"]);
    expect((await del("/articles/cases/dative/usage")).status).toBe(200);
    expect(await problems()).toEqual([]);
  });
});
