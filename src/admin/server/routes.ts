import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, basename, dirname, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
// Relative, not "@/...": vite.admin.config.ts imports plugin.ts -> routes.ts while Vite is bundling its
// own config file, a context where the "@/" alias from vite.config.ts's `resolve.alias` (app-graph only)
// does not apply, so an aliased import here breaks `bun run admin` at startup even though vitest (which
// does know the alias) would run the tests fine.
import {
  Slug, WORD_FOLDERS, FOLDER_TO_TYPE, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ArticleFrontmatterSchema,
  ArticleFileSchema, ARTICLE_FOLDER_TO_OWNER,
} from "../../data/schema.ts";
import { stableStringify } from "../../data/json.ts";
import { parseFrontmatter, serializeFrontmatter } from "../../data/frontmatter.ts";
import { readDataFromDisk, checkReferences, findReferenceProblems, type DataFiles } from "../../data/validate.ts";
import { z } from "zod";

export interface ApiRequest { method: string; path: string; body: string }
export interface ApiResponse { status: number; body: unknown }

const FOLDERS = new Set(Object.values(WORD_FOLDERS));
const bad = (error: string, status = 400): ApiResponse => ({ status, body: { error } });
const ok = (body: unknown = { ok: true }): ApiResponse => ({ status: 200, body });

function parseBody<T>(schema: z.ZodType<T>, body: string): T | ApiResponse {
  let json: unknown;
  try { json = JSON.parse(body); } catch { return bad("invalid JSON"); }
  const r = schema.safeParse(json);
  return r.success ? r.data : bad(z.prettifyError(r.error));
}
const isResponse = (v: unknown): v is ApiResponse => typeof v === "object" && v !== null && "status" in v && "body" in v && Object.keys(v).length === 2;

// Ruling 2, defense in depth: even though `Slug` already rejects "/", "\\", "." and "%" in every :id/:folder/
// :case/:slug segment before this is ever called, resolve the final path and refuse anything that would land
// outside `root`. Cheap, and it means a future loosening of Slug can't silently reopen a traversal.
function assertWithinRoot(root: string, file: string): ApiResponse | null {
  const resolvedRoot = resolve(root) + sep;
  const resolvedFile = resolve(file);
  return resolvedFile.startsWith(resolvedRoot) ? null : bad("path escapes root");
}

// Write a temp file next to the target, then rename it over the target: an interrupted write (killed dev server,
// full disk) leaves the previous content, never a truncated file. The ".tmp" name is never globbed or validated.
function writeFileAtomic(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    writeFileSync(tmp, content, { flag: "wx" });
    renameSync(tmp, path);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}

const writeJson = (path: string, value: unknown): void => writeFileAtomic(path, stableStringify(value));

// Refuse (409) a write whose result would have reference problems that the data on disk does not have already.
// Problems already present never block, so a repair write on invalid data still goes through. An unlisted article
// file never blocks either: the admin's article save and delete pass through that state. If the current data
// cannot be read at all (a schema-invalid file), the write is not blocked; GET /validate reports that.
function refuseNewReferenceProblems(root: string, stage: (d: DataFiles) => DataFiles): ApiResponse | null {
  let current: DataFiles;
  try { current = readDataFromDisk(root); } catch { return null; }
  const blocking = (d: DataFiles) => findReferenceProblems(d).filter((p) => p.kind !== "unlisted-article").map((p) => p.message);
  const existing = new Set(blocking(current));
  const introduced = blocking(stage(current)).filter((m) => !existing.has(m));
  return introduced.length ? bad(`write refused, it would introduce reference problems: ${introduced.join("; ")}`, 409) : null;
}

// The interface (Task 10 brief) fixes this signature as async so callers can `await` it uniformly even
// though every branch here is synchronous fs/child_process work; no branch currently needs a real await.
// eslint-disable-next-line @typescript-eslint/require-await
export async function handleApi(req: ApiRequest, root: string): Promise<ApiResponse> {
  const parts = req.path.replace(/^\/+|\/+$/g, "").split("/");
  // Reject "", "." and ".." segments before any route branch, so "/words/nouns/../evil" is a 400, not a 404.
  // Because the path is never decoded here (plugin.ts passes it through as received), a percent-encoded
  // traversal like "%2e%2e" or "..%2F" never matches "..": it instead fails the Slug check below, since Slug
  // forbids "%", "." and "/" in every segment.
  if (parts.some((p) => p === "" || p === "." || p === "..")) return bad("invalid path");
  const [head, a, b, c] = parts;
  const slugOk = (s: string | undefined): s is string => !!s && Slug.safeParse(s).success;
  if (head === "words" && parts.length !== 3) return bad("invalid word path");

  if (head === "words" && parts.length === 3) {
    if (!a || !FOLDERS.has(a)) return bad(`unknown word folder "${a ?? ""}"`);
    if (!slugOk(b)) return bad("invalid id");
    const file = join(root, a, `${b}.json`);
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    const type = FOLDER_TO_TYPE[a];
    if (!type) return bad(`unknown word folder "${a}"`);
    const withoutWord = (d: DataFiles) => d.words[type].filter((w) => w.id !== b);
    if (req.method === "DELETE") {
      if (!existsSync(file)) return bad("not found", 404);
      const refused = refuseNewReferenceProblems(root, (d) => ({ ...d, words: { ...d.words, [type]: withoutWord(d) } }));
      if (refused) return refused;
      rmSync(file); return ok();
    }
    if (req.method === "PUT") {
      const word = parseBody(wordFileSchemaFor(type), req.body);
      if (isResponse(word)) return word;
      if (word.id !== b) return bad("id does not match path");
      for (const other of FOLDERS) if (other !== a && existsSync(join(root, other, `${b}.json`))) return bad(`id "${b}" is already used in ${other}`);
      const refused = refuseNewReferenceProblems(root, (d) => ({ ...d, words: { ...d.words, [type]: [...withoutWord(d), word] } }));
      if (refused) return refused;
      writeJson(file, word); return ok();
    }
  }
  if (head === "cases" && parts.length === 2 && req.method === "PUT") {
    if (!slugOk(a)) return bad("invalid id");
    const file = join(root, "cases", `${a}.json`);
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    const c = parseBody(CaseFileSchema, req.body);
    if (isResponse(c)) return c;
    if (c.id !== a) return bad("id does not match path");
    const refused = refuseNewReferenceProblems(root, (d) => ({ ...d, cases: [...d.cases.filter((x) => x.id !== c.id), c] }));
    if (refused) return refused;
    writeJson(file, c); return ok();
  }
  if (head === "declensions" && parts.length === 1 && req.method === "PUT") {
    const d = parseBody(DeclensionsFileSchema, req.body);
    if (isResponse(d)) return d;
    const file = join(root, "declensions.json");
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    const refused = refuseNewReferenceProblems(root, (data) => ({ ...data, declensions: d }));
    if (refused) return refused;
    writeJson(file, d); return ok();
  }
  if (head === "articles") {
    if (parts.length !== 4 || !a || !Object.hasOwn(ARTICLE_FOLDER_TO_OWNER, a) || !slugOk(b) || !slugOk(c)) return bad("invalid article path");
    const owner = ARTICLE_FOLDER_TO_OWNER[a]!;
    const file = join(root, "articles", a, b, `${c}.md`);
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    if (req.method === "DELETE") { if (!existsSync(file)) return bad("not found", 404); rmSync(file); return ok(); }
    if (req.method === "PUT") {
      const art = parseBody(ArticleFrontmatterSchema.extend({ text: z.string() }).strict(), req.body);
      if (isResponse(art)) return art;
      // Fix (review round 1, finding 2): `serializeFrontmatter` writes `key: value` lines unescaped, so a
      // title (or any other frontmatter field) containing a newline can inject extra frontmatter lines or
      // close the `---` block early, corrupting the file even though the Zod schema alone accepted the
      // input. Rather than loosen `ArticleFrontmatterSchema` (Task 2's schema is off limits here), serialize
      // and immediately re-parse the result the same way `readDataFromDisk` would, then require an exact
      // round trip. `parseFrontmatter` also trims values, so this incidentally catches leading/trailing
      // whitespace being silently dropped.
      const serialized = serializeFrontmatter({ title: art.title, language: art.language, position: art.position }, art.text);
      const { data: reparsedData, body: reparsedBody } = parseFrontmatter(serialized);
      const roundTrip = ArticleFileSchema.safeParse({
        ...reparsedData,
        position: Number(reparsedData.position),
        owner,
        ownerId: b,
        slug: c,
        text: reparsedBody,
      });
      const roundTripOk = roundTrip.success
        && roundTrip.data.title === art.title
        && roundTrip.data.language === art.language
        && roundTrip.data.position === art.position
        && reparsedBody === art.text;
      if (!roundTripOk) return bad("article frontmatter does not round-trip safely (likely a newline or stray value in a field)");
      writeFileAtomic(file, serialized);
      return ok();
    }
  }
  if (head === "git-status" && parts.length === 1 && req.method === "GET") {
    // Ruling 1: scoped to `root`, not a hardcoded "data", so a mkdtemp copy is what gets reported in tests.
    // `root` goes in as an argv element (never shell-interpolated) and the repo root is the cwd, matching
    // production where `root` is the relative "data" directory. A `root` outside any repository (a mkdtemp
    // dir in tests) makes git exit non-zero; that is caught below and reported as an explicit error rather
    // than throwing and killing the dev server.
    try {
      const raw = execFileSync("git", ["status", "--porcelain", "--", root], {
        cwd: process.cwd(),
        // A `root` outside any repository makes git write to stderr before exiting non-zero (see catch
        // below); pipe it so a mkdtemp-rooted test run doesn't spray "fatal: ... is outside repository"
        // into the dev server's or the test runner's own output.
        stdio: ["ignore", "pipe", "pipe"],
      }).toString();
      // Fix (review round 1, finding 1): `--porcelain` status lines are `XY<space>path`, and the first
      // character of `XY` can itself be a space (e.g. " M path" for an unstaged modification). Trimming the
      // *whole* output — as the previous version did — strips that leading space off only the first line,
      // so `slice(3)` then eats the first character of the first path. Strip only the trailing newline(s)
      // that `git status` always appends, never leading whitespace.
      const trimmed = raw.replace(/[\r\n]+$/, "");
      const files = trimmed ? trimmed.split("\n").map((l) => l.slice(3)) : [];
      return ok({ clean: files.length === 0, files });
    } catch (e) {
      // Fix (review round 1, minor M2): a caller (the Task 12 admin UI) cannot tell "clean" apart from "we
      // don't actually know" if both report `{ clean: true, files: [] }`. A `root` outside any git repository
      // (or a missing `git` binary) is a real failure, not a clean working tree, so surface it as one.
      return bad(`git status failed: ${e instanceof Error ? e.message : String(e)}`, 500);
    }
  }
  if (head === "validate" && parts.length === 1 && req.method === "GET") {
    try { return ok({ problems: checkReferences(readDataFromDisk(root)) }); }
    catch (e) { return ok({ problems: [e instanceof Error ? e.message : String(e)] }); }
  }
  return bad("not found", 404);
}
