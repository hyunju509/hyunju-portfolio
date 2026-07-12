# Future Content Schema Plan (documented only — NOT implemented in Phase 1)

Phase 1 implements only: `project`, the gallery image object, and the
`homepageSettings` singleton, piloted with Fluid Terrain.

## A. Writing (Observations texts)

Document type `writing`:

- title (string, required)
- slug (slug, required, unique)
- summary (text)
- cover image (image with hotspot, alt required)
- body (Portable Text — first Portable Text use in this project)
- publication date (date)
- showOnSite (boolean, default true)
- SEO title (string, optional)
- SEO description (text, optional)

Publication is controlled by Sanity's native Draft/Publish; no custom
`published` flag.

## B. Place Gallery (Observations photos)

One `place` document per location:

- location name (string, required)
- slug (slug, required, unique)
- images (ordered array of the shared gallery-image object: image + required
  alt + optional caption)
- showOnSite (boolean, default true)

Homepage featured Places: controlled later by a singleton ordered-reference
array (same pattern as Homepage Order), not by fields on each Place.

## C. Image Studies

Document type `imageStudy`:

- title (string, required)
- slug (slug, required, unique)
- category (string list: `material-experiments` | `spatial-images`)
- disclosure (text — the disclosure note shown with the study)
- images (ordered array of the shared gallery-image object)
- showOnSite (boolean, default true)

## D. Site Settings singleton

Single `siteSettings` document:

- homepage introduction (text)
- About introduction (text)
- email (string)
- SEO title / SEO description (string / text)
- social image (image)
- featured Places (ordered references → place)
- featured Image Studies (ordered references → imageStudy)

## What stays in code vs. moves to Sanity

Stays in code:

- Layout, typography, CSS, interaction scripts (project-expand, PDF viewer)
- The PDF Portfolio Viewer and its page order (the PDF itself is the source)
- Global navigation structure and routes
- Anything structural that an editor should not accidentally break

Moves to Sanity (over later phases):

- All project content currently in `src/data/projects.ts`
- Homepage section membership + order (Homepage Order singleton)
- Observations writing (`src/data/writing.ts`) and photo galleries
  (`src/data/observations.ts`)
- About/intro copy and contact email (Site Settings)
- All *new* images uploaded by the editor (existing local images may stay
  until a deliberate migration)

Migration order recommendation: Projects → Homepage Order → Writing →
Places/Image Studies → Site Settings. Each phase repeats the Phase 1 pattern:
import, compare on a local pilot route, then switch the public route.
