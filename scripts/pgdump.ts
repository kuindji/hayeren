export type Row = Record<string, string | null>;

function unescapeCopy(field: string): string | null {
  if (field === "\\N") return null;
  let out = "";
  for (let i = 0; i < field.length; i++) {
    const ch = field[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = field[++i];
    switch (next) {
      case "n":
        out += "\n";
        break;
      case "t":
        out += "\t";
        break;
      case "r":
        out += "\r";
        break;
      case "\\":
        out += "\\";
        break;
      case undefined:
        break;
      default:
        out += next;
    }
  }
  return out;
}

export function parseCopyBlocks(sql: string): Map<string, Row[]> {
  const result = new Map<string, Row[]>();
  const lines = sql.split("\n");
  const header = /^COPY (\S+) \((.*)\) FROM stdin;$/;
  for (let i = 0; i < lines.length; i++) {
    const m = header.exec(lines[i] ?? "");
    if (!m) continue;
    const table = (m[1] ?? "").replaceAll('"', "");
    const columns = (m[2] ?? "").split(",").map((c) => c.trim().replaceAll('"', ""));
    const rows: Row[] = [];
    for (i++; i < lines.length && lines[i] !== "\\."; i++) {
      const fields = (lines[i] ?? "").split("\t");
      const row: Row = {};
      columns.forEach((col, k) => {
        row[col] = unescapeCopy(fields[k] ?? "\\N");
      });
      rows.push(row);
    }
    result.set(table, rows);
  }
  return result;
}
