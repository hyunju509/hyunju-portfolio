/*
 * Read-only Sanity client for static builds (Phase 1 pilot).
 * Queries only the `published` perspective — drafts can never reach
 * the generated HTML. No token is configured on purpose: published
 * content on a public dataset needs none, and adding one here would
 * risk leaking it into the build.
 */
import { createClient } from "@sanity/client";

/* Vite/Astro exposes import.meta.env; the studio's sanity-exec scripts
   (audit tooling) run under plain Node where only process.env exists. */
const env: Record<string, string | undefined> =
  typeof import.meta !== "undefined" && (import.meta as any).env
    ? (import.meta as any).env
    : process.env;

const projectId = (env.SANITY_PROJECT_ID ?? env.SANITY_STUDIO_PROJECT_ID) as string | undefined;
const dataset = (env.SANITY_DATASET ?? env.SANITY_STUDIO_DATASET ?? "production") as string;

/* Lets pilot routes render a "not configured" notice instead of
   failing the whole static build when .env is absent. */
export const sanityConfigured = Boolean(projectId);

export const sanityClient = createClient({
  projectId: projectId ?? "unconfigured",
  dataset,
  apiVersion: "2026-07-01",
  useCdn: false,
  perspective: "published",
});
