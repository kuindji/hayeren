export type Row = Record<string, string | null>;

/**
 * Decodes one COPY text-format field. Postgres emits `\\`, `\b`, `\f`, `\n`, `\r`, `\t`, `\v`,
 * `\ooo` (octal) and `\xhh` (hex), and escapes every literal backslash, so any other sequence
 * means the input is not COPY text — we throw rather than guess. This is a migration tool: loud
 * failure beats silently dropping a backslash and corrupting the content.
 */
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
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "\t";
        break;
      case "v":
        out += "\v";
        break;
      case "\\":
        out += "\\";
        break;
      case "x": {
        const hex = /^[0-9a-fA-F]{1,2}/.exec(field.slice(i + 1))?.[0];
        if (hex === undefined) throw new Error(`COPY escape "\\x" is not followed by a hex digit`);
        out += byte(parseInt(hex, 16), `\\x${hex}`);
        i += hex.length;
        break;
      }
      default: {
        if (next === undefined) throw new Error(`COPY field ends with a lone backslash: ${field}`);
        if (next >= "0" && next <= "7") {
          const oct = /^[0-7]{1,3}/.exec(field.slice(i))?.[0] ?? next;
          out += byte(parseInt(oct, 8), `\\${oct}`);
          i += oct.length - 1;
          break;
        }
        throw new Error(`unrecognized COPY escape "\\${next}" in field: ${field}`);
      }
    }
  }
  return out;
}

/**
 * `\ooo` and `\xhh` denote a raw byte. The dump has already been decoded from UTF-8 into a JS
 * string by the caller, so a byte >= 0x80 is a fragment of a multi-byte character we can no
 * longer reassemble — refuse it instead of emitting the wrong character.
 */
function byte(value: number, escape: string): string {
  if (value >= 0x80)
    throw new Error(`COPY escape "${escape}" is a non-ASCII byte and cannot be decoded safely`);
  return String.fromCharCode(value);
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
      if (fields.length !== columns.length)
        throw new Error(
          `${table}: row ${rows.length + 1} has ${fields.length} fields, expected ${columns.length}`,
        );
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
