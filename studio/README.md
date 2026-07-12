# Hyunju Portfolio CMS — Sanity Studio

Separate Sanity Studio app for the portfolio website (Phase 1 pilot).
Not deployed yet; local use only.

## Setup

```sh
cd studio
cp .env.example .env   # fill in the project ID
npm install
npm run dev            # Studio at http://localhost:3333
```

The Astro site runs separately at http://localhost:4321 (`npm run dev` in the
repo root).

## Content model (Phase 1)

- **Project** — one document per portfolio project. Draft ≠ public: only
  Publish makes content eligible for the site, and `showOnSite` can hide a
  published project without unpublishing.
- **Gallery image** (object) — image + required alt + optional caption /
  object-position / internal note. Order = drag order.
- **Homepage Order** (singleton) — two ordered reference arrays
  (`selectedWorks`, `moreWorks`) are the single source of truth for homepage
  section membership and order.

## Imports and audit (Phase 2A)

```sh
# all 15 website projects (idempotent; supersedes the Phase 1 pilot script)
npx sanity exec scripts/import-projects.ts --with-user-token

# machine-readable parity audit → docs/sanity-cms/migration-audit.json
npx sanity exec scripts/audit-projects.ts --with-user-token

# original Phase 1 single-project pilot (kept for reference)
npx sanity exec scripts/import-fluid-terrain.ts --with-user-token
```

All scripts are idempotent (stable IDs `project-<slug>`, filename-based
asset reuse) and require `sanity login` first; no tokens are hard-coded or
printed. The import also writes docs/sanity-cms/migration-manifest.json.

## Commands

- `npm run dev` — local Studio
- `npm run build` — production build check
- `npm run deploy` — NOT used in Phase 1 (no hosted Studio yet)
