import { parseCopyBlocks } from "../../scripts/pgdump";

const sample = `
COPY public.noun (id, comment, description) FROM stdin;
table\t{}\t{"russian": "стол"}
he/she\t\\N\t{}
\\.

COPY public."case" (id, name, "position") FROM stdin;
possessive\t{"russian": "Р"}\t1
\\.

COPY public.article (id, text) FROM stdin;
a1\tline one\\nline two\\ttabbed \\\\ backslash
\\.
`;

it("parses rows keyed by column with nulls and escapes", () => {
  const blocks = parseCopyBlocks(sample);
  const nouns = blocks.get("public.noun");
  expect(nouns).toHaveLength(2);
  expect(nouns?.[0]).toEqual({ id: "table", comment: "{}", description: '{"russian": "стол"}' });
  expect(nouns?.[1]?.comment).toBeNull();
  expect(blocks.get("public.article")?.[0]?.text).toBe("line one\nline two\ttabbed \\ backslash");
});

it("strips double quotes from quoted table and column identifiers", () => {
  const blocks = parseCopyBlocks(sample);
  expect(blocks.get("public.case")?.[0]).toEqual({ id: "possessive", name: '{"russian": "Р"}', position: "1" });
});

it("decodes the remaining COPY escapes, including \\r, octal and hex", () => {
  const sql = `COPY public.esc (a) FROM stdin;
cr\\rbs\\bff\\fvt\\voct\\101hex\\x41
\\.
`;
  expect(parseCopyBlocks(sql).get("public.esc")?.[0]?.a).toBe(
    "cr\rbs\bff\fvt\voctAhexA",
  );
});

it("throws on an escape it does not recognize instead of dropping the backslash", () => {
  const sql = `COPY public.esc (a) FROM stdin;
bad\\q
\\.
`;
  expect(() => parseCopyBlocks(sql)).toThrow(/unrecognized COPY escape "\\q"/);
});

it("throws on a row whose field count does not match the column list", () => {
  const short = `COPY public.t (a, b, c) FROM stdin;
one\ttwo
\\.
`;
  expect(() => parseCopyBlocks(short)).toThrow("public.t: row 1 has 2 fields, expected 3");
  const long = `COPY public.t (a, b) FROM stdin;
one\ttwo
one\ttwo\tthree
\\.
`;
  expect(() => parseCopyBlocks(long)).toThrow("public.t: row 2 has 3 fields, expected 2");
});
