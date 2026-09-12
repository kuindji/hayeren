# Hayeren: design spec

Date: 2026-09-12
Status: approved in conversation, awaiting written review

## 1. Purpose

Rebuild "Справочник по армянскому языку" (manifest name "Hayeren map"), a
Russian-language reference for Armenian noun, pronoun, numeral, question-word
and prepostposition declension by grammatical case, as a static site with
content stored as JSON and Markdown in the repository.

The 2023 implementation (`../armenian`, `../armenian-admin`) is functionally
complete and is the behavioural spec for this rebuild. Its Supabase project and
EC2 host no longer exist. The Dec 2025 Next.js rewrite (`../armenian-next`) is
abandoned. Both stay on disk untouched as reference until the new site is live.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Storage | JSON and Markdown files in the git repo, no database |
| Hosting | GitHub Pages from a public repo, custom domain, free |
| Admin | Runs locally only, writes files, no auth; publish by `git push` |
| Stack | Bun, Vite, React, TypeScript, React Router, Zod, Vitest, SCSS |
| Framework | No Next.js. Plain Vite SPA. Search engines index the home page only |
| Scope v1 | Parity with the old site: case board, alphabet, search, plus the admin |
| Deferred | Pronoun, numeral, question-word and verb-tense chapters. Nav keeps them as disabled entries as a reminder |
| Languages | Russian UI only. Data keeps the `{russian, english, ...}` shape for later |
| Data layout | One file per word and per case, in the shape the old app consumes in memory |

## 3. Repository and stack

New public repo in `/Users/kuindji/Projects/Armenian/hayeren`. Single package,
no workspaces.

Versions (latest as of 2026-09-12, pinned at scaffold time):
React 19.3, Vite 8, React Router 8, Zod 4, Vitest 5, TypeScript 6.0 (not 7:
typescript-eslint 8.70 supports `<6.1`), Sass 1.104, Bun 1.4, ESLint 10,
typescript-eslint 8.70, eslint-plugin-react-hooks 7, Prettier 3.

```
hayeren/
  data/                     # content, source of truth (section 4)
  src/
    data/                   # schema.ts (Zod), loader.ts (glob import + validate)
    model/                  # Table, Word, Case, Article, Filter ported from old src/types + lib
    site/                   # public site: pages, case board, alphabet, search
    admin/                  # admin UI
    shared/                 # components used by both
    styles/                 # SCSS ported from old src/scss
  scripts/
    import-pg-dump.ts       # one-time: backup -> data/
    validate.ts             # schema + referential checks, used by CI and tests
  tests/                    # vitest
  public/                   # favicon, CNAME, robots.txt
  index.html                # site entry
  admin.html                # admin entry
  vite.config.ts            # site build -> dist/
  vite.admin.config.ts      # admin dev server + file-write plugin, never built
  eslint.config.js
  tsconfig.json             # strict, covers src, scripts, tests, both vite configs
  .github/workflows/deploy.yml
  docs/superpowers/specs/
```

Scripts:

| Script | Does |
|---|---|
| `bun run dev` | site dev server |
| `bun run admin` | admin dev server with file writes |
| `bun run build` | site production build to `dist/`, copies `index.html` to `404.html` |
| `bun run lint` | ESLint, type-checked rules |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run validate` | data schema and reference checks |
| `bun test` | Vitest |
| `bun run check` | lint, typecheck, validate, test |

Linting and type checking cover every TypeScript file in the repo. Nothing is
excluded from `tsconfig.json`.

## 4. Data model

The format is the one the old app's `Case.js` and `Word.js` consume, which the
old `loadLocal()` read from `public/database/` with no transformation.

```
data/
  declensions.json
  cases/<id>.json
  nouns/<id>.json
  pronouns/<id>.json
  numerals/<id>.json
  questions/<id>.json
  prepostpositions/<id>.json
  articles/<case>/<slug>.md
```

Ids are the filenames and match the slugs from the 2023 database
(`table`, `wine`, `where-to`). The one id containing a slash, `he/she`, becomes
`he-she`.

### 4.1 Localized text

Every human-readable field is an object with optional keys `russian`,
`english`, `armenian`, `transcription`, `informal`. Only present keys are
stored. Armenian strings mark the case ending with asterisks: `սեղան*ի*`.

### 4.2 Word file

Same shape for all five word types. `declension` exists only for nouns.
`plural` never exists for prepostpositions. `type` is not stored; the loader
sets it from the folder name.

```json
{
  "id": "table",
  "cases": [
    {
      "case": "possessive",
      "declension": "ա",
      "single": { "armenian": "սեղան*ի*", "russian": "стола́", "transcription": "seghani" },
      "plural": { "armenian": "սեղաններ*ի*", "russian": "столов", "transcription": "seghanneri" },
      "examples": [
        { "pposition": "for", "armenian": "սեղան*ի* համար", "russian": "для стола́", "transcription": "seghani hamar" }
      ]
    }
  ]
}
```

`cases` is an array (the model uses `cases.find(c => c.case === id)`).
`pposition` on an example is optional. `comment` and `description` on the
word, and `comment` on a case entry, are optional and omitted when empty.

### 4.3 Case file

```json
{
  "id": "possessive",
  "position": 1,
  "name": { "russian": "Родительный падеж" },
  "description": { "russian": "..." },
  "articles": ["forms", "articles"],
  "questionGroups": [
    { "type": "noun", "name": { "russian": "Для существительных" } },
    { "type": "pronoun", "name": { "russian": "Для местоимений" } }
  ],
  "questions": [
    { "type": "noun", "pposition": "for", "question": { "russian": "для чегó" } }
  ],
  "declensions": [
    "ոջ",
    { "declension": "ու", "groups": [ { "name": { "russian": "Слова заканчивающиеся на ի" }, "words": ["wine"] } ] }
  ],
  "groups": [
    { "name": { "russian": "Все существительные с суффиксом ություն" }, "words": ["history"] }
  ]
}
```

- `position` orders the columns on the board. Replaces the old hardcoded list.
- `articles` lists article slugs under `data/articles/<case>/`, in display order.
- `declensions` is the old mixed list: a bare id means "all nouns of this
  declension in this case, one default group"; an object adds named groups
  inside the declension, and the loader puts ungrouped nouns of that
  declension into a leading unnamed group (existing `Case.js` behaviour).
- `groups` are custom noun groups not tied to a declension.
- `questionGroups` names are data, not hardcoded as in `loadRemote()`.

### 4.4 Declensions

`data/declensions.json` is an array of
`{ id, name: {russian, armenian}, description?, comment? }`.

### 4.5 Articles

`data/articles/<case>/<slug>.md` with YAML front matter:

```
---
title: Форма слов
language: russian
position: 0
---
markdown body
```

The loader gives each article the id `/case/<case>/<slug>` as the old app did.

### 4.6 Validation

`src/data/schema.ts` holds one Zod schema per file kind. It is the single
definition used by the loader, the admin forms, the admin write API and the
validate script. `scripts/validate.ts` additionally checks that every
referenced `case`, `declension`, `pposition`, article slug and group noun id
exists as a file or entry.

### 4.7 Loader

`src/data/loader.ts` uses `import.meta.glob('/data/**/*.{json,md}', { eager: true })`
so the whole dataset (about 200 KB minified) is part of the bundle. It
validates every file, sets `type` from the folder, parses article front
matter, and hands the objects to the ported `Table`/`Word`/`Case` model with
no reshaping. There is no fetch and no loading state.

## 5. Public site

Parity with the old site, ported to TypeScript and React 19. No new UX.

- Routes: `/` redirects to `/cases`; `/cases` is the board; `/alphabet` is the
  static alphabet page from a ported `alphabet.ts`. The nav keeps
  Местоимения, Числительные, Вопросительные слова and Времена глаголов as
  disabled entries with no routes.
- Case board: horizontal scroll of columns ordered by `position`. Each column
  shows name, description, expandable Markdown articles, question groups, then
  word lists in the old order: pronouns, regular nouns, declension groups,
  custom groups, numerals, question words, prepostpositions. Lists collapse to
  5 rows (10 for pronouns) with an expander. A word row shows the Armenian form
  with the ending bolded, transcription, Russian and comment, and expands to a
  card with nominative plus current-case forms and examples.
- Filtering: one global search matching Armenian or Russian forms with accents
  and asterisks stripped; clicking a word's nominative pins all columns to that
  word; clicking a question filters columns by prepostposition. `Filter`,
  `Filterable` and the observable contexts port over, keeping
  `@kuindji/observable` and `@kuindji/observable-react`.
- Markdown via `marked`. Content is repo-owned, so no HTML sanitizer.
- SCSS ported as-is, compiled by Vite. Mobile layout already exists.
- Head gets a title, description meta and a favicon. No analytics.
- SPA routing on Pages: build copies `index.html` to `404.html`. Vite `base`
  is `/` because the site is served from a custom domain.

## 6. Admin

Second entry point `admin.html`, started with `bun run admin`. Local only,
never built, never deployed, no auth.

### 6.1 File-write API

A Vite plugin in `vite.admin.config.ts` adds dev-server routes:

```
PUT    /api/words/:type/:id        writes data/<type>/<id>.json
DELETE /api/words/:type/:id
PUT    /api/cases/:id              writes data/cases/<id>.json
PUT    /api/declensions            writes data/declensions.json
PUT    /api/articles/:case/:slug   writes data/articles/<case>/<slug>.md
DELETE /api/articles/:case/:slug
GET    /api/git-status             "clean" or a list of changed data files
```

Every write is validated with the Zod schemas before touching disk and
returns 400 with the Zod error on failure. `:type` and `:id` are checked
against a strict slug pattern so paths cannot escape `data/`. Files are
written with sorted keys and two-space indent, so a no-op save produces no
diff. After a write Vite's HMR reloads the changed module and the admin UI
refreshes from disk; there is no client-side cache to keep in sync.

### 6.2 UI

Ported from the old admin, styled with the same plain SCSS as the site (no
Ant Design):

- Word pages per type: searchable list, add by id, delete; per word a header,
  case tabs, single and plural forms with all language fields, declension
  selector (nouns), comment, examples with a prepostposition selector.
- Cases page with four tabs: info, questions, word groups, articles with live
  Markdown preview.
- Declensions page: add and edit, which the old admin lacked.
- A header hint reads `/api/git-status` and shows when data files are
  uncommitted.

Publishing is `git commit` and `git push`. No further git integration in v1.

## 7. Migration

`scripts/import-pg-dump.ts` reads
`../db_cluster-15-11-2023@00-17-23.backup` directly, parses the `COPY` blocks
for the 21 public tables, and writes `data/` in the section 4 format. It
omits empty jsonb values, renames `he/she` to `he-she`, derives article slugs
from titles, and is rerunnable. Its output is committed. The script stays in
the repo as provenance.

Expected counts after import, asserted by a test: 6 cases, 7 declensions, 50
nouns, 8 pronouns, 31 numerals, 11 question words, 15 prepostpositions,
3 articles, 103 noun-case entries, 27 noun examples.

## 8. Testing

- Model: accent stripping and form matching in `Word`; `Case` grouping
  (declension groups, custom groups, question groups, ungrouped remainder);
  filter behaviour for query, word pin and prepostposition.
- Data: schema validation and referential integrity over the real `data/`.
- Import: round-trip row counts from the backup.
- Admin API: write then reread one word and one case; reject an invalid
  payload; reject a path-escaping id. Runs against a temp copy of `data/`.
- No browser tests in v1.

## 9. CI and deploy

`.github/workflows/deploy.yml`:

- On pull request: install Bun, `bun install --frozen-lockfile`, `bun run check`.
- On push to `main`: the same, then `bun run build`,
  `actions/upload-pages-artifact`, `actions/deploy-pages`.

GitHub Pages source is set to GitHub Actions. Public repo, so Actions and
Pages are free.

Custom domain: `public/CNAME` contains the domain (placeholder until chosen),
plus GitHub's documented DNS records (four A records for an apex, or a CNAME
for a subdomain). GitHub provisions TLS.

## 10. Out of scope for v1

- Verb tenses (needs a new data model and content that does not exist).
- Standalone pronoun, numeral and question-word pages.
- English UI or English content.
- Hosted admin, auth, multi-editor workflows.
- Per-route prerendering for SEO.
- Analytics.

## 11. Open items

- Domain name for `public/CNAME`.
- Repo name on GitHub (folder is `hayeren`; the name is changeable).
