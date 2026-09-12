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
