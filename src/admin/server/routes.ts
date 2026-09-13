import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
// Relative, not "@/...": vite.admin.config.ts imports plugin.ts -> routes.ts while Vite is bundling its
// own config file, a context where the "@/" alias from vite.config.ts's `resolve.alias` (app-graph only)
// does not apply, so an aliased import here breaks `bun run admin` at startup even though vitest (which
// does know the alias) would run the tests fine.
import {
  Slug, WORD_FOLDERS, FOLDER_TO_TYPE, wordFileSchemaFor, CaseFileSchema, DeclensionsFileSchema, ArticleFrontmatterSchema,
} from "../../data/schema.ts";
import { stableStringify } from "../../data/json.ts";
import { serializeFrontmatter } from "../../data/frontmatter.ts";
import { readDataFromDisk, checkReferences } from "../../data/validate.ts";
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

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stableStringify(value));
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
  const [head, a, b] = parts;
  const slugOk = (s: string | undefined): s is string => !!s && Slug.safeParse(s).success;
  if (head === "words" && parts.length !== 3) return bad("invalid word path");

  if (head === "words" && parts.length === 3) {
    if (!a || !FOLDERS.has(a)) return bad(`unknown word folder "${a ?? ""}"`);
    if (!slugOk(b)) return bad("invalid id");
    const file = join(root, a, `${b}.json`);
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    if (req.method === "DELETE") { if (!existsSync(file)) return bad("not found", 404); rmSync(file); return ok(); }
    if (req.method === "PUT") {
      const type = FOLDER_TO_TYPE[a];
      if (!type) return bad(`unknown word folder "${a}"`);
      const word = parseBody(wordFileSchemaFor(type), req.body);
      if (isResponse(word)) return word;
      if (word.id !== b) return bad("id does not match path");
      for (const other of FOLDERS) if (other !== a && existsSync(join(root, other, `${b}.json`))) return bad(`id "${b}" is already used in ${other}`);
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
    writeJson(file, c); return ok();
  }
  if (head === "declensions" && parts.length === 1 && req.method === "PUT") {
    const d = parseBody(DeclensionsFileSchema, req.body);
    if (isResponse(d)) return d;
    const file = join(root, "declensions.json");
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    writeJson(file, d); return ok();
  }
  if (head === "articles" && parts.length === 3) {
    if (!slugOk(a) || !slugOk(b)) return bad("invalid case or slug");
    const file = join(root, "articles", a, `${b}.md`);
    const escape = assertWithinRoot(root, file);
    if (escape) return escape;
    if (req.method === "DELETE") { if (!existsSync(file)) return bad("not found", 404); rmSync(file); return ok(); }
    if (req.method === "PUT") {
      const art = parseBody(ArticleFrontmatterSchema.extend({ text: z.string() }).strict(), req.body);
      if (isResponse(art)) return art;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, serializeFrontmatter({ title: art.title, language: art.language, position: art.position }, art.text));
      return ok();
    }
  }
  if (head === "git-status" && parts.length === 1 && req.method === "GET") {
    // Ruling 1: scoped to `root`, not a hardcoded "data", so a mkdtemp copy is what gets reported in tests.
    // `root` goes in as an argv element (never shell-interpolated) and the repo root is the cwd, matching
    // production where `root` is the relative "data" directory. A `root` outside any repository (a mkdtemp
    // dir in tests) makes git exit non-zero; that is caught and reported as a deterministic empty result
    // rather than throwing and killing the dev server.
    try {
      const out = execFileSync("git", ["status", "--porcelain", "--", root], {
        cwd: process.cwd(),
        // A `root` outside any repository makes git write to stderr before exiting non-zero (see catch
        // below); pipe it so a mkdtemp-rooted test run doesn't spray "fatal: ... is outside repository"
        // into the dev server's or the test runner's own output.
        stdio: ["ignore", "pipe", "pipe"],
      }).toString().trim();
      const files = out ? out.split("\n").map((l) => l.slice(3)) : [];
      return ok({ clean: files.length === 0, files });
    } catch {
      return ok({ clean: true, files: [] });
    }
  }
  if (head === "validate" && parts.length === 1 && req.method === "GET") {
    try { return ok({ problems: checkReferences(readDataFromDisk(root)) }); }
    catch (e) { return ok({ problems: [e instanceof Error ? e.message : String(e)] }); }
  }
  return bad("not found", 404);
}
