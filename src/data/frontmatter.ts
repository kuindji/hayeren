export function parseFrontmatter(md: string): { data: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return { data: {}, body: md };
  const data: Record<string, string> = {};
  for (const line of (m[1] ?? "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { data, body: md.slice(m[0].length) };
}

export function serializeFrontmatter(data: Record<string, string | number>, body: string): string {
  const head = Object.entries(data)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
  return `---\n${head}\n---\n${body}`;
}
