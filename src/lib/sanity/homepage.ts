/*
 * Production homepage data loader (Phase 2B).
 * Fetches the Homepage Order singleton with fully expanded projects from
 * the published perspective at Astro build time, validates the data, and
 * returns it in the exact Project shape the components consume.
 *
 * Validation FAILS THE BUILD on bad required data — there is deliberately
 * no silent fallback to the legacy registry (a fallback would hide CMS or
 * environment failures and make the Studio misleading).
 */
import type { Project } from "../../data/projects";
import { sanityClient, sanityConfigured } from "./client";
import { HOMEPAGE_PROJECTS } from "./queries";
import type { SanityProject } from "./types";
import { fromHomepage } from "./adapter";

/* Current intended homepage membership. Update these two numbers (only)
   when the homepage is deliberately changed in the Studio. */
const EXPECTED_SELECTED = 7;
const EXPECTED_MORE = 8;

interface HomepageResult {
  tierA: Project[];
  tierB: Project[];
}

function validateSection(
  name: string,
  list: (SanityProject | null)[] | null | undefined,
  expected: number,
  issues: string[],
): SanityProject[] {
  const items = list ?? [];
  items.forEach((p, i) => {
    if (!p) issues.push(`${name}[${i}]: unresolved or unpublished project reference`);
  });
  const resolved = items.filter((p): p is SanityProject => Boolean(p));
  for (const p of resolved) {
    const where = `${name} "${p.slug ?? p._id}"`;
    if (p.showOnSite === false) issues.push(`${where}: hidden via showOnSite — remove it from Homepage Order or re-enable it`);
    if (!p.title) issues.push(`${where}: missing title`);
    if (!p.slug) issues.push(`${where}: missing slug`);
    if (!p.cardMeta) issues.push(`${where}: missing card caption (cardMeta)`);
    if (!p.metaRows?.length) issues.push(`${where}: missing metadata rows`);
    if (!p.shortDescription) issues.push(`${where}: missing short description`);
    if (!p.homepageThumbnail?.asset?.url) issues.push(`${where}: missing homepage thumbnail`);
    if (!p.gallery?.length) issues.push(`${where}: empty gallery`);
    (p.gallery ?? []).forEach((g, i) => {
      if (!g.image?.asset?.url) issues.push(`${where}: gallery[${i}] has a broken image reference`);
      if (!g.alt) issues.push(`${where}: gallery[${i}] is missing required alt text`);
    });
  }
  if (items.length !== expected) {
    issues.push(
      `${name}: expected ${expected} projects, got ${items.length} — if this change is intentional, update EXPECTED_* in src/lib/sanity/homepage.ts`,
    );
  }
  return resolved;
}

export async function getHomepageProjects(): Promise<HomepageResult> {
  if (!sanityConfigured) {
    throw new Error(
      "[homepage] Sanity is not configured. Set SANITY_PROJECT_ID (and SANITY_DATASET) in .env locally or in the Vercel environment.",
    );
  }

  let settings: {
    selectedWorks?: (SanityProject | null)[] | null;
    moreWorks?: (SanityProject | null)[] | null;
  } | null = null;
  try {
    settings = await sanityClient.fetch(HOMEPAGE_PROJECTS);
  } catch (e) {
    throw new Error(
      `[homepage] Sanity query failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!settings) {
    throw new Error('[homepage] The "Homepage Order" (homepageSettings) document is missing or unpublished.');
  }

  const issues: string[] = [];
  const selected = validateSection("selectedWorks", settings.selectedWorks, EXPECTED_SELECTED, issues);
  const more = validateSection("moreWorks", settings.moreWorks, EXPECTED_MORE, issues);

  const ids = [...selected, ...more].map((p) => p._id);
  if (new Set(ids).size !== ids.length) issues.push("duplicate project documents across homepage sections");
  const slugs = [...selected, ...more].map((p) => p.slug);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupSlugs.length) issues.push(`duplicate placement/slugs: ${[...new Set(dupSlugs)].join(", ")}`);

  if (issues.length) {
    throw new Error(`[homepage] Sanity homepage data failed validation:\n  - ${issues.join("\n  - ")}`);
  }

  return fromHomepage({ selectedWorks: selected, moreWorks: more });
}
