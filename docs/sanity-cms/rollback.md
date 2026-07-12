# Phase 1 / 2A Rollback

The public site never depended on Sanity during Phase 1, so rollback is pure
deletion. Only perform this if the pilot fails irreparably.

1. Delete the Studio app: remove the `studio/` directory.
2. Delete the read-only client modules: remove `src/lib/sanity/` (includes
   the Phase 2A adapter and compare utilities).
3. Delete the pilot routes: remove `src/pages/cms-preview/`.
3a. Revert the absolute-URL passthrough in `sheetPath()`
   (`src/data/projects.ts`) — three lines.
3b. Revert the CLAUDE.md Sanity exception line (기술 규칙 section).
4. Remove root Sanity dependencies:
   `npm uninstall @sanity/client @sanity/image-url`
5. Delete `.env.example` Sanity entries (or the whole file if it contains
   nothing else) and any local `.env` created for the pilot.
6. Delete `docs/sanity-cms/`.
7. Verify: `git status` should show no Sanity-related files; `npm run build`
   must succeed and the site render unchanged.

The local safety branch `backup/before-sanity-cms` marks the exact pre-pilot
state; `git diff backup/before-sanity-cms` shows everything the pilot added.

Remote cleanup (optional, manual): the Sanity project "Hyunju Portfolio CMS"
can be deleted at sanity.io/manage — it costs nothing while unused.
