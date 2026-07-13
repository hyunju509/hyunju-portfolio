/*
 * Frontend adapter (Phase 2A preparation — NOT live yet).
 * Transforms Sanity project documents into the exact `Project` shape that
 * GridItem / project-expand / ProjectRooms already consume, so switching
 * the homepage data source later requires no component redesign.
 *
 * Sheets carry absolute Sanity CDN URLs; `sheetPath()` in src/data/projects.ts
 * passes absolute URLs through unchanged.
 */
import type { Project, Sheet, CardImage } from "../../data/projects";
import type { SanityProject, SanityImageWithAsset } from "./types";
import { urlFor } from "./image";

/* The registry's short ids are wired into DOM data-ids and the expansion
   script. They are presentation wiring, not content, so they live here.
   Projects added later in the CMS fall back to their slug (unique). */
const SHORT_IDS: Record<string, string> = {
  "fluid-terrain": "fluid",
  "calibrated-environment": "calibrated",
  "surreal-museum-tower": "surreal",
  "spectrum-living": "spectrum",
  "shadow-archive": "shadow",
  "ordinary-village": "ordinary",
  "ivanpah-solar-sanctuary": "ivanpah",
  "floating-microhabitat": "floating",
  "space-urchin": "urchin",
  "terroir-hot-springs": "terroir",
  "playful-layers": "playful",
  "hora-museum": "hora",
  "threshold-housing": "threshold",
  "w-school": "wschool",
  "sejong-smart-school": "sejong",
};

/* Responsive delivery. Widths never exceed the natural asset width and are
   capped at 2000 — no original-size downloads. sizes reflect the real grid:
   Selected 3→2→1 columns, More Work 5→3→2, expansion ≈ 2/3 vs 2/5 width
   (breakpoints 1024 / 640 in global.css). */
const SHEET_WIDTHS = [720, 960, 1280, 1600, 2000];
const CARD_WIDTHS = [480, 720, 960];
const MAX_WIDTH = 2000;
const CARD_SIZES = {
  A: "(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 27vw",
  B: "(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 17vw",
} as const;
const SHEET_SIZES = {
  A: "(max-width: 640px) 94vw, (max-width: 1024px) 86vw, 54vw",
  B: "(max-width: 640px) 94vw, (max-width: 1024px) 86vw, 33vw",
} as const;

const sized = (image: SanityImageWithAsset, w: number): string =>
  urlFor(image).width(w).quality(75).url();

function srcsetOf(image: SanityImageWithAsset, widths: number[], maxWidth: number): string {
  const cap = Math.min(image.asset.metadata.dimensions.width, maxWidth);
  const ws = [...new Set([...widths.filter((w) => w < cap), cap])].sort((a, b) => a - b);
  return ws.map((w) => `${sized(image, w)} ${w}w`).join(", ");
}

function buildCard(cms: SanityProject, tier: "A" | "B"): CardImage | undefined {
  const primary = cms.homepageThumbnail?.asset ? cms.homepageThumbnail : cms.gallery?.[0]?.image;
  if (!primary?.asset) return undefined;
  const secondary = cms.gallery?.[1]?.image;
  return {
    src: sized(primary, Math.min(720, primary.asset.metadata.dimensions.width)),
    srcset: srcsetOf(primary, CARD_WIDTHS, 960),
    sizes: CARD_SIZES[tier],
    ...(secondary?.asset
      ? {
          secondary: sized(secondary, Math.min(720, secondary.asset.metadata.dimensions.width)),
          secondarySrcset: srcsetOf(secondary, CARD_WIDTHS, 960),
        }
      : {}),
  };
}

export function toProject(cms: SanityProject, tier: "A" | "B"): Project {
  const card = buildCard(cms, tier);
  const sheets: Sheet[] = (cms.gallery ?? []).map((g) => ({
    file: sized(g.image, Math.min(1280, g.image.asset.metadata.dimensions.width)),
    width: g.image.asset.metadata.dimensions.width,
    height: g.image.asset.metadata.dimensions.height,
    srcset: srcsetOf(g.image, SHEET_WIDTHS, MAX_WIDTH),
    sizes: SHEET_SIZES[tier],
  }));
  return {
    id: SHORT_IDS[cms.slug] ?? cms.slug,
    slug: cms.slug,
    title: cms.title,
    tier,
    cardMeta: cms.cardMeta ?? [cms.year, cms.projectType].filter(Boolean).join(" · "),
    desc: cms.shortDescription,
    meta: (cms.metaRows ?? []).map((r) => ({ k: r.label, v: r.value })),
    ...(cms.description ? { overview: cms.description.split(/\n\n+/) } : {}),
    ...(cms.keyContributions ? { keyContributions: cms.keyContributions } : {}),
    ...(cms.recognition ? { recognition: cms.recognition } : {}),
    ...(cms.video
      ? {
          video: {
            title: cms.video.title,
            youtubeId: cms.video.youtubeId,
            poster: cms.video.poster ?? "",
          },
        }
      : {}),
    folder: "", // unused — sheets carry absolute CDN URLs
    sheets,
    ...(card ? { card } : {}),
  };
}

/* Maps the HOMEPAGE_PROJECTS query result (expanded singleton) into the
   two tiered arrays the homepage consumes today. Hidden projects
   (showOnSite === false) are excluded, mirroring eventual production. */
export function fromHomepage(settings: {
  selectedWorks?: SanityProject[] | null;
  moreWorks?: SanityProject[] | null;
}): { tierA: Project[]; tierB: Project[] } {
  const visible = (list?: SanityProject[] | null) => (list ?? []).filter((p) => p.showOnSite !== false);
  return {
    tierA: visible(settings.selectedWorks).map((p) => toProject(p, "A")),
    tierB: visible(settings.moreWorks).map((p) => toProject(p, "B")),
  };
}
