# Verb tenses chapter: design spec

Date: 2026-09-13
Status: approved in conversation, awaiting written review

## 1. Purpose

Add the "Времена глаголов" chapter to the Hayeren site: a tense board in the
shape of the existing case board, with every verb form stored explicitly in
the repository. Content comes from the owner's lesson notes
(`~/Downloads/Армянский.xlsx`, sheet "Tenses").

The 2026-09-12 spec (`2026-09-12-hayeren-design.md`) listed verb tenses as out
of scope because they need a new data model. This spec supplies that model.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Page shape | Tense board: horizontally scrolling columns, one per tense, mirroring `/cases` |
| Forms | Stored explicitly per verb per tense, like noun case forms. No conjugation engine, no generated forms |
| Grouping | By conjugation class (the verb's fixed class), plus a per-tense "Исключения" group, plus custom groups in the tense file |
| Content v1 | The 14 tenses in the notes, sample verbs per class, the irregulars, the compound verb ման գալ and the one conjugated causative ուրախացնել. About 50 verbs |
| Deferred | Admin editing of verbs and tenses. The voice table (active / reflexive / causative / passive) becomes a separate chapter later. The causative pair list goes with it |
| Names | Russian mood names from Russian Wikipedia ("Армянский язык"), English form names from English Wikipedia ("Armenian verbs"). Both stored |

## 3. Tense names and order

Board order is the order of the notes. `position` in the tense file is the
index below.

| # | id | Russian name | English name | Sample (ел-class) |
|---|---|---|---|---|
| 0 | `present` | Настоящее | Present | խմում եմ / չեմ խմում |
| 1 | `imperfect` | Прошедшее несовершенное (имперфект) | Imperfect | խմում էի / չէի խմում |
| 2 | `perfect` | Перфект | Present perfect | խմել եմ / չեմ խմել |
| 3 | `pluperfect` | Плюсквамперфект | Past perfect | խմել էի / չէի խմել |
| 4 | `future` | Будущее | Future | խմելու եմ / չեմ խմելու |
| 5 | `future-past` | Будущее в прошедшем | Future in the past | խմելու էի / չէի խմելու |
| 6 | `optative` | Желательное будущее | Optative | խմեմ / չխմեմ |
| 7 | `optative-past` | Желательное прошедшее | Past optative | խմեի / չխմեի |
| 8 | `conditional` | Условное будущее | Conditional | կխմեմ / չեմ խմի |
| 9 | `conditional-past` | Условное прошедшее | Past conditional | կխմեի / չէի խմի |
| 10 | `necessitative` | Побудительное будущее | Necessitative | պիտի խմեմ / չպիտի խմեմ |
| 11 | `necessitative-past` | Побудительное прошедшее | Past necessitative | պիտի խմեի / չպիտի խմեի |
| 12 | `imperative` | Повелительное | Imperative | խմի՛ր, խմե՛ք / մի՛ խմիր, մի՛ խմեք |
| 13 | `aorist` | Прошедшее совершенное (аорист) | Aorist | խմեցի / չխմեցի |

English Wikipedia labels row 5 "future perfect"; "future in the past" is
kept because that is what the form means and what the notes call it. The
description field carries the notes' gloss ("Я делаю, я сейчас делаю",
"Я собирался что-то сделать", and so on).

## 4. Data model

Three new file kinds under `data/`, mirroring `declensions.json`,
`cases/` and `nouns/`.

```
data/
  conjugations.json
  tenses/<id>.json
  verbs/<id>.json
  articles/cases/<case>/<slug>.md     # moved from articles/<case>/
  articles/tenses/<tense>/<slug>.md
```

### 4.1 Conjugations

`data/conjugations.json` is an array with the same entry shape as
`declensions.json`: `{ id, name: {russian}, description?, comment? }`. The
schema is shared (one `NamedEntrySchema`, two file schemas). Ids may contain
Armenian letters like declension ids. Seven entries, in display order:

| id | name.russian |
|---|---|
| `ել` | Глаголы на -ել |
| `ալ` | Глаголы на -ալ |
| `անալ` | Глаголы на -անալ |
| `ենալ` | Глаголы на -ենալ |
| `ն` | Глаголы с суффиксом -ն (տեսնել, հասնել) |
| `չ` | Глаголы с суффиксом -չ (փախչել, թռչել) |
| `ացնել` | Каузативы на -ացնել |

### 4.2 Tense file

```json
{
  "id": "present",
  "position": 0,
  "name": { "russian": "Настоящее", "english": "Present" },
  "description": { "russian": "Я делаю, я сейчас делаю" },
  "articles": ["formation", "usage"],
  "groups": [
    { "name": { "russian": "Составные глаголы" }, "words": ["man-gal"] }
  ]
}
```

- `articles` lists slugs under `data/articles/tenses/<id>/`, display order.
- `groups` are custom verb groups, same shape as case `groups`
  (`CaseGroupSchema`, reused). A verb listed in a custom group is shown
  there instead of under its conjugation class.
- There are no question groups and no declension list. Conjugation order
  comes from `conjugations.json`.

### 4.3 Verb file

```json
{
  "id": "drink",
  "infinitive": { "armenian": "խմել", "russian": "пить", "transcription": "khmel" },
  "conjugation": "ել",
  "comment": { "russian": "..." },
  "tenses": [
    {
      "tense": "present",
      "forms": {
        "1sg": { "armenian": "խմ*ում եմ*", "russian": "пью", "transcription": "khmum em" },
        "2sg": { "armenian": "խմ*ում ես*", "russian": "пьёшь" },
        "3sg": { "armenian": "խմ*ում է*" },
        "1pl": { "armenian": "խմ*ում ենք*" },
        "2pl": { "armenian": "խմ*ում եք*" },
        "3pl": { "armenian": "խմ*ում են*" }
      },
      "negative": {
        "1sg": { "armenian": "*չեմ* խմ*ում*" },
        "2sg": { "armenian": "*չես* խմ*ում*" }
      },
      "comment": { "russian": "..." },
      "examples": [
        { "armenian": "նա սոված չէ", "russian": "он не голоден" }
      ]
    },
    {
      "tense": "imperative",
      "irregular": true,
      "forms": { "2sg": { "armenian": "խմի՛ր", "informal": "խմի" }, "2pl": { "armenian": "խմե՛ք" } },
      "negative": { "2sg": { "armenian": "մի՛ խմիր" }, "2pl": { "armenian": "մի՛ խմեք" } }
    }
  ]
}
```

- `infinitive` is a `Form` (the noun form object: `russian`, `armenian`,
  `transcription`, `informal`, `comment`). Its Russian is the verb's meaning.
- `conjugation` references an id in `conjugations.json`. Required.
- `tenses` is an array; the model uses `tenses.find(t => t.tense === id)`,
  as `Word.caseForm` does. A verb appears in a tense column only if it has an
  entry for that tense.
- `forms` and `negative` are objects keyed by person: `1sg`, `2sg`, `3sg`,
  `1pl`, `2pl`, `3pl`. Every key is optional (the imperative has only `2sg`
  and `2pl`). Values are `Form` objects. Forms are stored without the
  pronoun; the UI supplies ես, դու, նա, մենք, դուք, նրանք.
- Asterisks mark the part that changes, as in noun forms. `Text` renders them
  bold. The `informal` field holds spoken variants (խմի for խմի՛ր).
- `irregular: true` moves the verb into the tense's "Исключения" group for
  that tense only (ունենալ is regular in the perfect but irregular in the
  present).
- `comment` and `examples` on a tense entry are optional. Examples are
  `Form` objects without `pposition`.
- `type` is not stored. Verb files live only in `data/verbs/`.

### 4.4 Articles

Articles move to `data/articles/cases/<case>/<slug>.md` and
`data/articles/tenses/<tense>/<slug>.md`. Front matter is unchanged. The
article id becomes `/case/<case>/<slug>` (unchanged) or `/tense/<tense>/<slug>`.
`classifyDataPath` returns `{ kind: "article", owner: "case" | "tense",
ownerId, slug }`. The three existing articles are moved by `git mv`; the
admin article routes become `/api/articles/:owner/:id/:slug` and write to the
new folders. The admin case page keeps working; it passes `cases` as owner.

### 4.5 Validation

`scripts/validate.ts` gains: every verb `conjugation` exists; every verb
tense entry's `tense` exists; every tense `groups[].words` id is a verb;
every tense `articles` slug exists as a file; every verb-file id matches its
filename; no duplicate person keys (Zod object, so free); no verb tense entry
without at least one form in `forms` or `negative`. Tense `position` values
are unique.

`buildDataFiles` gains `conjugations`, `tenses`, `words.verb`-style
`verbs`, and article owner handling. The expected-count test grows by the
new counts once the data is transcribed.

## 5. Model

New in `src/model/`:

- `Verb`: `id`, `infinitive`, `conjugation`, `comment`, `tenses`;
  `tenseForm(id)`; `getAllForms({language})` returns stripped infinitive,
  meaning and every affirmative and negative form; `matchesFilter(data)`
  honours `word` and `query` only (`pposition` never applies to verbs).
- `Tense`: built from a tense file and the `Database`. Exposes `id`,
  `position`, `name`, `description`, `articles`, and `getData(filter)`
  returning `{ conjugations: (Conjugation & { verbs: Verb[] })[], irregular:
  Verb[], groups: VerbGroupView[] }` with the filter applied to each list,
  plus `matchesFilter` and `isEmpty` as `Case` has. Grouping rule: a verb
  with an entry for this tense goes to a custom group if listed there, else
  to Исключения if `irregular`, else under its conjugation. Conjugations with
  no verbs are dropped.
- `Database` gains `verb`, `conjugation` and `tense` tables. `findWord` is
  unchanged; verbs are not words. `hooks.ts` `TableName` gains the three
  tables.

Verb ids and noun ids are separate namespaces (`data/nouns/love.json` and a
verb `love` may both exist). The tenses page gets its own filter store
(section 6), so a pinned word id never crosses chapters.

## 6. Site

- Route `/tenses`, nav entry enabled. `/` still redirects to `/cases`.
- `Tenses` page: same structure as `Cases` (search, scroll arrows off Mac,
  horizontal board), rendering `TenseFull` per tense. It wraps its tree in a
  `GlobalFilterContext.Provider` with a page-local store created once, so
  `Search` works unchanged and a word pinned on the case board does not
  filter the tense board.
- `TenseFull` column: header (name, description), articles (reuse
  `Article`), one `VerbList` per conjugation with the conjugation name and
  comment as heading, then "Исключения", then custom groups by name.
- `Verb` row: infinitive (Armenian, transcription, Russian), the `1sg`
  affirmative and negative forms of this tense as a teaser (or `2sg` for the
  imperative, the first present key otherwise), the verb comment, and the
  expand control. Clicking the infinitive pins the verb (`filter.word`),
  which expands it in every column, as on the case board. Expanded: a table
  with a pronoun column and affirmative / negative columns, transcription
  under each Armenian form, Russian under that when present; then the tense
  entry comment and examples.
- `Words` is generalized into a list component that takes `items` and a
  `renderItem` function (title, comment, limit, header level and expander
  unchanged); `Words` becomes a thin wrapper, and `VerbList` a second one.
  No second copy of the list logic.
- Styles: reuse `.full-case*`, `.word*` classes where the markup is the
  same; add a `.verb-table` block for the person table. Column width matches
  the case board; the three-column table fits at 360px with the
  transcription under the form.
- `Text` handles asterisks already. `strip` currently removes only
  asterisks and Russian/English accents, so a query "խմիր" would not match
  the stored "խմի՛ր". `strip` additionally removes the Armenian stress mark
  ՛ (U+055B) for every language, with a test.

## 7. Content

The owner's spreadsheet is transcribed once into `data/` by a throwaway
script in the scratchpad (not committed): regular cells are split by person
and polarity mechanically; exception cells ("գալ - եկ + ա, ար, ավ...") are
expanded by hand. Verb ids are English slugs (`drink`, `read`, `come`,
`man-gal` for the compound). Every verb in the notes gets a file, even those
with only one tense filled. The owner reviews the resulting files.

Tense articles: one `formation` article per tense from the notes' formation
hints (row 3 of the sheet), and a `usage` article where the notes give one
(the "Lets" forms under the necessitative, the "նա սոված չէ" remark under the
present). Short is fine; they can grow later.

Expected counts, asserted by the data test: 14 tenses, 7 conjugations, 3 case
articles; the verb and tense-article counts are written into the test when
transcription is done.

## 8. Tests

- Schema: verb, tense and conjugation files parse; a verb with an unknown
  person key, a tense entry with neither forms nor negative, and a verb
  without `conjugation` are rejected.
- Validator: dangling conjugation, tense, group verb id and article slug are
  each reported with the file name.
- `Tense.getData`: conjugation grouping order, `irregular` moves a verb for
  one tense only, custom group takes precedence, filter by query and by
  pinned word, empty conjugations dropped.
- `Verb.getAllForms` and `matchesFilter`: matches infinitive, meaning, a
  negative form; ignores `pposition`.
- Page: memory-router render of `/tenses` shows every tense name; pinning a
  verb expands its table in two columns; search narrows columns.
- Transcription spot check: about a dozen cells copied from the spreadsheet
  (present of կծել 3sg negative "չի կծում", aorist of գալ 3sg "եկավ",
  imperative of ուտել 2sg "կե՛ր", and so on) asserted against the data.
- Article move: loader and validator accept the new layout and reject the
  old `articles/<case>/` path; admin article PUT writes to the new path.

## 9. Admin

No verb, tense or conjugation editing in this version. Changes limited to
the article folder move (section 4.4) and the git-status hint, which needs
nothing new. The admin does not list verb files; `bun run validate` still
covers them.

## 10. Out of scope

- Admin editors for verbs, tenses and conjugations.
- The voice chapter (ել / վել / ացնել / ացվել) and the causative pair list.
- Generated forms or a conjugation engine.
- A rerunnable spreadsheet importer.
- English UI. The English tense names are stored for later.

## 11. Open items

None. Verb ids and the exact article texts are decided during transcription
and reviewed by the owner.
