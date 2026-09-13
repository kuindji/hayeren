import { z } from "zod";

export const WORD_TYPES = ["noun", "pronoun", "numeral", "question", "prepostposition"] as const;
export type WordType = (typeof WORD_TYPES)[number];
export const WORD_FOLDERS: Record<WordType, string> = {
  noun: "nouns",
  pronoun: "pronouns",
  numeral: "numerals",
  question: "questions",
  prepostposition: "prepostpositions",
};
export const FOLDER_TO_TYPE: Record<string, WordType> = Object.fromEntries(
  // Explicit tuple return: tsc 6 already infers { [k: string]: WordType } here (checked), this just makes it obvious.
  WORD_TYPES.map((type): [string, WordType] => [WORD_FOLDERS[type], type]),
);

export const Slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be lowercase kebab-case");
export const DeclensionId = z.string().min(1).refine((s) => !s.includes("/"), "no slashes");

export const LocalizedSchema = z
  .object({
    russian: z.string().optional(),
    english: z.string().optional(),
    armenian: z.string().optional(),
    transcription: z.string().optional(),
    informal: z.string().optional(),
  })
  .strict();
export type Localized = z.infer<typeof LocalizedSchema>;

export const FormSchema = LocalizedSchema.extend({ comment: LocalizedSchema.optional() }).strict();
export type Form = z.infer<typeof FormSchema>;

export const ExampleSchema = FormSchema.extend({ pposition: Slug.optional() }).strict();
export type Example = z.infer<typeof ExampleSchema>;

export const WordCaseSchema = z
  .object({
    case: Slug,
    declension: DeclensionId.optional(),
    single: FormSchema.optional(),
    plural: FormSchema.optional(),
    comment: LocalizedSchema.optional(),
    examples: z.array(ExampleSchema).optional(),
  })
  .strict();
export type WordCase = z.infer<typeof WordCaseSchema>;

export const WordFileSchema = z
  .object({
    id: Slug,
    name: LocalizedSchema.optional(),
    comment: LocalizedSchema.optional(),
    description: LocalizedSchema.optional(),
    cases: z.array(WordCaseSchema),
  })
  .strict();
export type WordFile = z.infer<typeof WordFileSchema>;

export function wordFileSchemaFor(type: WordType) {
  return WordFileSchema.superRefine((w, ctx) => {
    if (w.name !== undefined && type !== "prepostposition")
      ctx.addIssue({ code: "custom", path: ["name"], message: `name is only allowed on prepostpositions` });
    w.cases.forEach((c, i) => {
      if (c.declension !== undefined && type !== "noun")
        ctx.addIssue({ code: "custom", path: ["cases", i, "declension"], message: `declension is only allowed on nouns` });
      if (c.plural !== undefined && type === "prepostposition")
        ctx.addIssue({ code: "custom", path: ["cases", i, "plural"], message: `prepostpositions have no plural` });
    });
  });
}

export const QuestionTypeSchema = z.enum(["noun", "pronoun"]);
export const CaseQuestionSchema = z
  .object({
    type: QuestionTypeSchema.optional(),
    pposition: Slug.optional(),
    question: LocalizedSchema,
    comment: LocalizedSchema.optional(),
  })
  .strict();
export type CaseQuestion = z.infer<typeof CaseQuestionSchema>;

export const CaseGroupSchema = z
  .object({
    name: LocalizedSchema.optional(),
    description: LocalizedSchema.optional(),
    comment: LocalizedSchema.optional(),
    words: z.array(Slug),
  })
  .strict();
export type CaseGroup = z.infer<typeof CaseGroupSchema>;

// --- tenses (below CaseGroupSchema) ---
export const TenseFileSchema = z
  .object({
    id: Slug,
    position: z.number().int().min(0),
    name: LocalizedSchema,
    description: LocalizedSchema.optional(),
    articles: z.array(Slug).optional(),
    groups: z.array(CaseGroupSchema).optional(),
  })
  .strict();
export type TenseFile = z.infer<typeof TenseFileSchema>;

export const CaseDeclensionSchema = z.union([
  DeclensionId,
  z.object({ declension: DeclensionId, groups: z.array(CaseGroupSchema) }).strict(),
]);
export type CaseDeclension = z.infer<typeof CaseDeclensionSchema>;

export const CaseFileSchema = z
  .object({
    id: Slug,
    position: z.number().int().min(0),
    name: LocalizedSchema,
    description: LocalizedSchema.optional(),
    articles: z.array(Slug).optional(),
    questionGroups: z.array(z.object({ type: QuestionTypeSchema, name: LocalizedSchema }).strict()).optional(),
    questions: z.array(CaseQuestionSchema).optional(),
    declensions: z.array(CaseDeclensionSchema).optional(),
    groups: z.array(CaseGroupSchema).optional(),
  })
  .strict();
export type CaseFile = z.infer<typeof CaseFileSchema>;

// --- shared named entry (declensions and conjugations share one shape) ---
export const NamedEntrySchema = z
  .object({ id: DeclensionId, name: LocalizedSchema, description: LocalizedSchema.optional(), comment: LocalizedSchema.optional() })
  .strict();
// Table.addRow keeps the first row per id and silently drops the rest, so duplicates must be rejected at parse time.
export const namedListSchema = (label: string) =>
  z.array(NamedEntrySchema).superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.forEach((d, i) => {
      if (seen.has(d.id)) ctx.addIssue({ code: "custom", path: [i, "id"], message: `duplicate ${label} id "${d.id}"` });
      seen.add(d.id);
    });
  });
export const DeclensionSchema = NamedEntrySchema;
export type Declension = z.infer<typeof DeclensionSchema>;
export const DeclensionsFileSchema = namedListSchema("declension");
export const ConjugationsFileSchema = namedListSchema("conjugation");
export type Conjugation = Declension;

// --- verbs ---
export const PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"] as const;
export type Person = (typeof PERSONS)[number];
export const PersonFormsSchema = z
  .object({
    "1sg": FormSchema.optional(), "2sg": FormSchema.optional(), "3sg": FormSchema.optional(),
    "1pl": FormSchema.optional(), "2pl": FormSchema.optional(), "3pl": FormSchema.optional(),
  })
  .strict();
export type PersonForms = z.infer<typeof PersonFormsSchema>;
const hasAnyPerson = (f: PersonForms | undefined) => !!f && PERSONS.some((p) => f[p] !== undefined);
export const VerbTenseSchema = z
  .object({
    tense: Slug,
    irregular: z.literal(true).optional(),
    forms: PersonFormsSchema.optional(),
    negative: PersonFormsSchema.optional(),
    comment: LocalizedSchema.optional(),
    examples: z.array(FormSchema).optional(),
  })
  .strict()
  .refine((t) => hasAnyPerson(t.forms) || hasAnyPerson(t.negative), { message: "a tense entry needs at least one form or negative form" });
export type VerbTense = z.infer<typeof VerbTenseSchema>;
export const VerbFileSchema = z
  .object({ id: Slug, infinitive: FormSchema, conjugation: DeclensionId, comment: LocalizedSchema.optional(), tenses: z.array(VerbTenseSchema) })
  .strict()
  // Verb.tenseForm uses tenses.find(), so a second entry for the same tense would be silently invisible.
  .superRefine((v, ctx) => {
    const seen = new Set<string>();
    v.tenses.forEach((t, i) => {
      if (seen.has(t.tense)) ctx.addIssue({ code: "custom", path: ["tenses", i, "tense"], message: `duplicate tense "${t.tense}"` });
      seen.add(t.tense);
    });
  });
export type VerbFile = z.infer<typeof VerbFileSchema>;

export interface DataFiles {
  declensions: Declension[];
  conjugations: Conjugation[];
  cases: CaseFile[];
  tenses: TenseFile[];
  words: Record<WordType, WordFile[]>;
  verbs: VerbFile[];
  articles: ArticleFile[];
}
export const emptyDataFiles = (): DataFiles => ({
  declensions: [], conjugations: [], cases: [], tenses: [],
  words: { noun: [], pronoun: [], numeral: [], question: [], prepostposition: [] }, verbs: [], articles: [],
});

export const ArticleFrontmatterSchema = z
  .object({ title: z.string().min(1), language: z.enum(["russian", "english"]), position: z.number().int().min(0) })
  .strict();
export type ArticleFrontmatter = z.infer<typeof ArticleFrontmatterSchema>;
export const ARTICLE_OWNERS = ["case", "tense"] as const;
export type ArticleOwner = (typeof ARTICLE_OWNERS)[number];
export const ARTICLE_OWNER_FOLDERS: Record<ArticleOwner, string> = { case: "cases", tense: "tenses" };
export const ARTICLE_FOLDER_TO_OWNER: Record<string, ArticleOwner> = Object.fromEntries(
  ARTICLE_OWNERS.map((o): [string, ArticleOwner] => [ARTICLE_OWNER_FOLDERS[o], o]),
);
export const ArticleFileSchema = ArticleFrontmatterSchema.extend({ owner: z.enum(ARTICLE_OWNERS), ownerId: Slug, slug: Slug, text: z.string() }).strict();
export type ArticleFile = z.infer<typeof ArticleFileSchema>;
