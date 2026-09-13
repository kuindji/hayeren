import type { WordType, WordFile, CaseFile, Declension, ArticleFrontmatter } from "@/data/schema";
import { WORD_FOLDERS } from "@/data/schema";

async function call(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`/api${path}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? null : JSON.stringify(body) });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}
export const api = {
  putWord: (type: WordType, w: WordFile) => call("PUT", `/words/${WORD_FOLDERS[type]}/${w.id}`, w),
  deleteWord: (type: WordType, id: string) => call("DELETE", `/words/${WORD_FOLDERS[type]}/${id}`),
  putCase: (c: CaseFile) => call("PUT", `/cases/${c.id}`, c),
  putDeclensions: (d: Declension[]) => call("PUT", "/declensions", d),
  putArticle: (caseId: string, slug: string, a: ArticleFrontmatter & { text: string }) => call("PUT", `/articles/${caseId}/${slug}`, a),
  deleteArticle: (caseId: string, slug: string) => call("DELETE", `/articles/${caseId}/${slug}`),
  gitStatus: () => call("GET", "/git-status") as Promise<{ clean: boolean; files: string[] }>,
  validate: () => call("GET", "/validate") as Promise<{ problems: string[] }>,
};
