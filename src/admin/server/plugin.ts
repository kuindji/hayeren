import type { Plugin } from "vite";
import { handleApi } from "./routes.ts";

// Ruling 3: content files are small, so 1 MB is generous headroom while still bounding memory use
// against an unbounded request body.
const MAX_BODY_BYTES = 1024 * 1024;

export function adminApiPlugin(root = "data"): Plugin {
  return {
    name: "hayeren-admin-api",
    configureServer(server) {
      server.middlewares.use("/api", (req, res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let responded = false;
        const respond = (status: number, body: unknown): void => {
          if (responded) return;
          responded = true;
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        req.on("data", (chunk: Buffer) => {
          if (responded) return;
          size += chunk.length;
          if (size > MAX_BODY_BYTES) {
            respond(413, { error: "request body too large" });
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on("error", () => respond(400, { error: "request error" }));
        req.on("end", () => {
          if (responded) return;
          const body = Buffer.concat(chunks).toString("utf8");
          // handleApi never throws (Zod failures and JSON parse failures are caught internally and turned
          // into 400 responses), but a Vite dev server must never die from a malformed admin request, so the
          // rejection path is still handled defensively here.
          void handleApi({ method: req.method ?? "GET", path: req.url ?? "/", body }, root)
            .then((r) => respond(r.status, r.body))
            .catch((e: unknown) => respond(500, { error: e instanceof Error ? e.message : String(e) }));
        });
      });
    },
  };
}
