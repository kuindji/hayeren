# Hayeren

A grammar reference for Armenian: nouns, cases, declensions and articles, with
Russian translations and transcriptions. Static site, no backend — all content
is bundled at build time.

## Prerequisites

[Bun](https://bun.sh) 1.4+.

## Install

```bash
bun install
```

## Scripts

| Script | Does |
|---|---|
| `bun run dev` | Site dev server |
| `bun run admin` | Admin dev server with file writes |
| `bun run build` | Production build to `dist/`, then copies `index.html` to `404.html` |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | ESLint, type-checked rules |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run validate` | Data schema and reference checks |
| `bun run test` | Vitest |
| `bun run check` | `lint`, `typecheck`, `validate` and `test` together |

## Content

Content lives under `data/` — one JSON file per word/case/etc., validated by
`bun run validate` and loaded into the site at build time. `data/` is the
source of truth; edit it directly or through the admin UI (`bun run admin`).

## Deploy

The site deploys to GitHub Pages at the custom domain
`armenian.kuindji.com` (see `public/CNAME`). Full CI and DNS setup details
land with the deploy workflow.
