import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Node attaches `stdout`/`stderr` (captured process output) to the Error thrown by a failed
// execSync call. There's no exported type for this shape, so narrow it ourselves instead of
// reaching for `any`.
interface ExecError extends Error {
  stdout?: Buffer | string;
  stderr?: Buffer | string;
}

function isExecError(error: unknown): error is ExecError {
  return error instanceof Error;
}

it(
  "bun run build produces index.html, 404.html, CNAME and the data inside the bundle",
  () => {
    // The production build log is noise in normal `bun run check` output, which has stayed
    // pristine since Task 1 — capture it instead of inheriting stdio, and surface it only if
    // the build actually fails, so a real failure still shows the log.
    try {
      execSync("bun run build", { stdio: "pipe" });
    } catch (error) {
      const log = isExecError(error) ? `${String(error.stdout ?? "")}${String(error.stderr ?? "")}` : String(error);
      throw new Error(`bun run build failed:\n${log}`, { cause: error });
    }

    expect(existsSync("dist/index.html")).toBe(true);
    expect(readFileSync("dist/404.html", "utf8")).toBe(readFileSync("dist/index.html", "utf8"));
    expect(existsSync("dist/CNAME")).toBe(true);
    expect(readFileSync("dist/CNAME", "utf8")).toContain("armenian.kuindji.com");

    const js = execSync("cat dist/assets/*.js").toString();
    expect(js).toContain("սեղան");
  },
  120_000,
);
