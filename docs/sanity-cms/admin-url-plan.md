# Admin URL Plan (implemented later, NOT in Phase 1)

The hosted Studio hostname does not exist yet, so no `/admin` redirect is
created in this phase.

## Future behavior (Phase 2+)

`www.hj-kim.com/admin` → HTTP redirect to the deployed Sanity Studio hostname
(e.g. `https://<chosen-name>.sanity.studio`).

Requirements for that redirect when it is built:

- Point at the **exact** deployed Studio hostname (set after `sanity deploy`).
- Contain no tokens or query secrets.
- Be `noindex` (redirect page/header level).
- Not impersonate authentication — access control is Sanity's own login.
- Implemented as a Vercel redirect rule (e.g. `vercel.json` `redirects`), not
  an Astro page with meta refresh.

## Local development URLs

- Astro site: `http://localhost:4321` (`npm run dev` in repo root)
- Sanity Studio: `http://localhost:3333` (`npm run dev` in `studio/`)

The public `/admin` route must never point to localhost.
