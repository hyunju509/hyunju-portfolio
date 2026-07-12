/*
 * Shared migration-parity checks (Phase 2A). Used by the /cms-preview
 * pages and the audit tooling. Pure functions — no I/O, no secrets.
 */
import type { Project } from "../../data/projects";
import { sheetDims } from "../../data/projects";
import type { SanityProject } from "./types";
import { toProject } from "./adapter";

export interface Check {
  label: string;
  pass: boolean;
  detail: string;
}

export interface Placement {
  section: "selectedWorks" | "moreWorks";
  index: number;
}

const eq = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function localFilenames(local: Project): string[] {
  return local.sheets.map((s) => (typeof s === "string" ? s : s.file));
}

export function buildProjectChecks(
  local: Project,
  cms: SanityProject | null,
  placement: Placement | null,
): Check[] {
  if (!cms) {
    return [{ label: "Document exists in Sanity", pass: false, detail: `no published project with slug "${local.slug}"` }];
  }
  const checks: Check[] = [];
  const gallery = cms.gallery ?? [];
  const cmsFiles = gallery.map((g) => g.image.asset.originalFilename ?? "?");
  const localFiles = localFilenames(local);
  const localMetaMap = Object.fromEntries(local.meta.map((m) => [m.k, m.v]));

  checks.push(
    { label: "Title", pass: cms.title === local.title, detail: `"${cms.title}"` },
    { label: "Slug", pass: cms.slug === local.slug, detail: cms.slug },
    { label: "Card caption", pass: cms.cardMeta === local.cardMeta, detail: `"${cms.cardMeta}" vs "${local.cardMeta}"` },
    {
      label: "Meta rows (labels, values, order)",
      pass: eq(
        (cms.metaRows ?? []).map((r) => [r.label, r.value]),
        local.meta.map((m) => [m.k, m.v]),
      ),
      detail: (cms.metaRows ?? []).map((r) => r.label).join(" / ") || "(none)",
    },
    { label: "Short description", pass: cms.shortDescription === local.desc, detail: cms.shortDescription === local.desc ? "exact match" : "DIFFERS" },
    {
      label: "Overview paragraphs",
      pass: eq(cms.description ? cms.description.split(/\n\n+/) : undefined, local.overview),
      detail: local.overview ? `${local.overview.length} paragraph(s)` : "none in registry",
    },
    {
      label: "Key contributions",
      pass: eq(cms.keyContributions ?? undefined, local.keyContributions),
      detail: local.keyContributions ? `${local.keyContributions.length} item(s)` : "none in registry",
    },
    { label: "Recognition", pass: (cms.recognition ?? undefined) === local.recognition, detail: local.recognition ?? "none in registry" },
    {
      label: "Video",
      pass: eq(
        cms.video ? { t: cms.video.title, y: cms.video.youtubeId, p: cms.video.poster ?? "" } : undefined,
        local.video ? { t: local.video.title, y: local.video.youtubeId, p: local.video.poster } : undefined,
      ),
      detail: local.video ? local.video.youtubeId : "none in registry",
    },
    {
      label: "Keywords (when shown in meta)",
      pass: !localMetaMap["Keywords"] || eq(cms.keywords, localMetaMap["Keywords"].split(" · ")),
      detail: localMetaMap["Keywords"] ?? "no Keywords row in registry",
    },
    { label: "Image count", pass: gallery.length === local.sheets.length, detail: `${gallery.length} vs ${local.sheets.length}` },
    { label: "Image order", pass: cmsFiles.join("|") === localFiles.join("|"), detail: cmsFiles.length > 6 ? `${cmsFiles.slice(0, 3).join(", ")} … ${cmsFiles.slice(-1)}` : cmsFiles.join(", ") },
    {
      label: "Alt text on every image",
      pass: gallery.length > 0 && gallery.every((g) => Boolean(g.alt)),
      detail: `${gallery.filter((g) => Boolean(g.alt)).length}/${gallery.length}`,
    },
    {
      label: "Captions parity",
      pass: gallery.every((g) => !g.caption),
      detail: "no captions exist in the registry",
    },
    {
      label: "No duplicate assets",
      pass: new Set(gallery.map((g) => g.image.asset._id)).size === gallery.length,
      detail: `${new Set(gallery.map((g) => g.image.asset._id)).size} unique of ${gallery.length}`,
    },
    {
      label: "Dimensions preserved",
      pass:
        gallery.length === local.sheets.length &&
        gallery.every((g, i) => {
          const d = sheetDims(local.sheets[i]);
          const m = g.image.asset.metadata.dimensions;
          return m.width === d.width && m.height === d.height;
        }),
      detail:
        gallery.length === local.sheets.length
          ? `${gallery.length} checked`
          : "count mismatch",
    },
    { label: "Homepage thumbnail set", pass: Boolean(cms.homepageThumbnail?.asset), detail: cms.homepageThumbnail?.asset?.originalFilename ?? "MISSING" },
    { label: "Visible (showOnSite)", pass: cms.showOnSite !== false, detail: String(cms.showOnSite) },
    {
      label: "Homepage placement",
      pass: placement !== null && placement.section === (local.tier === "A" ? "selectedWorks" : "moreWorks"),
      detail: placement ? `${placement.section}[${placement.index}]` : "NOT PLACED",
    },
  );

  /* Adapter round-trip: the normalized adapter must reproduce the exact
     shape the components consume today. */
  const adapted = toProject(cms, local.tier);
  checks.push(
    {
      label: "Adapter: id / tier / cardMeta / desc",
      pass:
        adapted.id === local.id &&
        adapted.tier === local.tier &&
        adapted.cardMeta === local.cardMeta &&
        adapted.desc === local.desc,
      detail: `id "${adapted.id}"`,
    },
    {
      label: "Adapter: meta rows reproduce registry",
      pass: eq(adapted.meta, local.meta),
      detail: `${adapted.meta.length} row(s)`,
    },
    {
      label: "Adapter: overview / contributions / recognition / video",
      pass:
        eq(adapted.overview, local.overview) &&
        eq(adapted.keyContributions, local.keyContributions) &&
        adapted.recognition === local.recognition &&
        eq(adapted.video, local.video),
      detail: "round-trip",
    },
    {
      label: "Adapter: sheet count + dimensions",
      pass:
        adapted.sheets.length === local.sheets.length &&
        adapted.sheets.every((s, i) => {
          const a = sheetDims(s);
          const b = sheetDims(local.sheets[i]);
          return a.width === b.width && a.height === b.height;
        }),
      detail: `${adapted.sheets.length} CDN sheet(s)`,
    },
  );
  return checks;
}

export function findPlacement(
  settings: { selectedWorks?: { slug: string }[] | null; moreWorks?: { slug: string }[] | null } | null,
  slug: string,
): Placement | null {
  const inSelected = (settings?.selectedWorks ?? []).findIndex((r) => r?.slug === slug);
  if (inSelected >= 0) return { section: "selectedWorks", index: inSelected };
  const inMore = (settings?.moreWorks ?? []).findIndex((r) => r?.slug === slug);
  if (inMore >= 0) return { section: "moreWorks", index: inMore };
  return null;
}
