# Admin URL (implemented in Phase 3, 2026-07-12)

`www.hj-kim.com/admin` → 307 redirect to the deployed Sanity Studio:

**https://hyunju-kim-portfolio.sanity.studio/**

Implementation: `vercel.json` `redirects` (`permanent: false`, so the Studio
hostname can still change) plus an `X-Robots-Tag: noindex` header on `/admin`.
No tokens are involved; access control is Sanity's own login. `/admin` is not
linked from the public navigation.

## Local development URLs

- Astro site: `http://localhost:4321` (`npm run dev` in repo root)
- Sanity Studio: `http://localhost:3333` (`npm run dev` in `studio/`)

The public `/admin` route must never point to localhost.
