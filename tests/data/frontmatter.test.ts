import { parseFrontmatter, serializeFrontmatter } from "@/data/frontmatter";
import { stableStringify } from "@/data/json";

it("round-trips front matter", () => {
  const md = serializeFrontmatter({ title: "Форма слов", language: "russian", position: 0 }, "body **x**\n");
  expect(md).toBe("---\ntitle: Форма слов\nlanguage: russian\nposition: 0\n---\nbody **x**\n");
  expect(parseFrontmatter(md)).toEqual({ data: { title: "Форма слов", language: "russian", position: "0" }, body: "body **x**\n" });
});

it("stableStringify sorts keys recursively and ends with newline", () => {
  expect(stableStringify({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: 2 } })).toBe(
    '{\n  "a": {\n    "c": 2,\n    "d": [\n      3,\n      {\n        "y": 2,\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n',
  );
});
