/*
 * Final CMS migration loaders (build time, published perspective only).
 * Each loader reproduces the exact legacy data shape its page already
 * consumes, so templates need only swap their data source. Loaders THROW
 * on missing required content — production builds must fail loudly, never
 * fall back silently.
 */
import type {
  ObservationLocation,
  ImageStudyItem,
  ImageStudyCategoryInfo,
  FeaturedPlaceImage,
} from "../../data/observations";
import { sanityClient, sanityConfigured } from "./client";
import { urlFor } from "./image";
import {
  ALL_PLACES,
  ALL_IMAGE_STUDY_COLLECTIONS,
  SITE_SETTINGS,
  ABOUT_SETTINGS,
  BOOK_SETTINGS,
  PUBLISHED_WRITING,
} from "./queries";
import type { SanityImageWithAsset } from "./types";

function requireConfigured(what: string): void {
  if (!sanityConfigured) {
    throw new Error(
      `[${what}] Sanity is not configured. Set SANITY_PROJECT_ID (and SANITY_DATASET) in .env locally or in the Vercel environment.`,
    );
  }
}

/* Build-time memoization: singletons are fetched once per build. */
const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const square = (img: SanityImageWithAsset, size: number) =>
  urlFor(img).width(size).height(size).fit("crop").quality(75).url();
const fullSize = (img: SanityImageWithAsset) =>
  urlFor(img)
    .width(Math.min(1600, img.asset.metadata.dimensions.width))
    .quality(80)
    .url();

interface ObsGalleryItem {
  _key: string;
  alt: string;
  caption?: string;
  sequenceLabel?: string;
  homepageFeatured?: boolean;
  image: SanityImageWithAsset;
}

/* ---------------- Site Settings ---------------- */

export interface SiteSettingsData {
  homepageIntroduction: string;
  professionalTitle?: string;
  credentialLine?: string;
  email: string;
  navLabels?: Partial<Record<"work" | "book" | "about" | "observations" | "email", string>>;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  canonicalBaseUrl: string;
  defaultSocialImage?: SanityImageWithAsset;
  defaultSocialImageAlt?: string;
  observationsIntro?: string;
  placesLabel?: string;
  placesIntro?: string;
  writingLabel?: string;
  writingIntro?: string;
  imageStudiesLabel?: string;
  imageStudiesIntro?: string;
  homeObservationsIntro?: string;
  featuredPlaces?: { _key: string; place: { title: string; slug: string } | null; image: SanityImageWithAsset }[];
  featuredImageStudies?: { _key: string; collection: { title: string; slug: string; category: string } | null; image: SanityImageWithAsset }[];
}

export function getSiteSettings(): Promise<SiteSettingsData> {
  requireConfigured("siteSettings");
  return once("siteSettings", async () => {
    const s = await sanityClient.fetch<SiteSettingsData | null>(SITE_SETTINGS);
    if (!s) throw new Error('[siteSettings] The "Site Settings" document is missing or unpublished.');
    for (const field of ["homepageIntroduction", "email", "seoDefaultTitle", "seoDefaultDescription", "canonicalBaseUrl"] as const) {
      if (!s[field]) throw new Error(`[siteSettings] Required field "${field}" is empty.`);
    }
    return s;
  });
}

/* Default SEO/social values for BaseLayout. */
export async function getSeoDefaults() {
  const s = await getSiteSettings();
  const og = s.defaultSocialImage?.asset
    ? urlFor(s.defaultSocialImage).width(1200).height(630).fit("crop").quality(80).url()
    : null;
  return {
    site: s.canonicalBaseUrl.replace(/\/$/, ""),
    defaultTitle: s.seoDefaultTitle,
    defaultDescription: s.seoDefaultDescription,
    ogImage: og,
    ogImageAlt: s.defaultSocialImageAlt ?? "",
  };
}

/* ---------------- Homepage Observations previews ---------------- */

export async function getFeaturedPreviews(): Promise<{
  places: FeaturedPlaceImage[];
  studies: { id: string; title: string; thumb: string }[];
  intro: string;
  placesLabel: string;
  imageStudiesLabel: string;
}> {
  const s = await getSiteSettings();
  const fp = s.featuredPlaces ?? [];
  const fs = s.featuredImageStudies ?? [];
  const issues: string[] = [];
  if (fp.length !== 8) issues.push(`featuredPlaces has ${fp.length} items (must be exactly 8)`);
  if (fs.length !== 8) issues.push(`featuredImageStudies has ${fs.length} items (must be exactly 8)`);
  fp.forEach((f, i) => {
    if (!f.place) issues.push(`featuredPlaces[${i}]: unresolved place reference`);
    if (!f.image?.asset) issues.push(`featuredPlaces[${i}]: missing image`);
  });
  fs.forEach((f, i) => {
    if (!f.collection) issues.push(`featuredImageStudies[${i}]: unresolved collection reference`);
    if (!f.image?.asset) issues.push(`featuredImageStudies[${i}]: missing image`);
  });
  const fpAssets = fp.map((f) => f.image?.asset?._id).filter(Boolean);
  if (new Set(fpAssets).size !== fpAssets.length) issues.push("featuredPlaces contains duplicate images");
  const fsAssets = fs.map((f) => f.image?.asset?._id).filter(Boolean);
  if (new Set(fsAssets).size !== fsAssets.length) issues.push("featuredImageStudies contains duplicate images");
  if (new Set(fs.map((f) => f.collection?.category)).size < 2) issues.push("featuredImageStudies must include both categories");
  if (issues.length) {
    throw new Error(`[homepage previews] Site Settings validation failed:\n  - ${issues.join("\n  - ")}`);
  }
  return {
    places: fp.map((f, i) => ({
      id: `${f.place!.slug}-${i + 1}`,
      slug: f.place!.slug,
      title: f.place!.title,
      thumb: square(f.image, 600),
    })),
    studies: fs.map((f, i) => ({
      id: `${f.collection!.slug}-${i + 1}`,
      title: f.collection!.title,
      thumb: square(f.image, 600),
    })),
    intro: s.homeObservationsIntro ?? "",
    placesLabel: s.placesLabel ?? "Places",
    imageStudiesLabel: s.imageStudiesLabel ?? "Image Studies",
  };
}

/* ---------------- Observations page ---------------- */

interface SanityPlace {
  _id: string;
  title: string;
  slug: string;
  gallery?: ObsGalleryItem[] | null;
}
interface SanityStudyCollection extends SanityPlace {
  category: "material-experiments" | "spatial-images";
  description?: string;
  disclosure?: string;
}

export async function getObservationsData(): Promise<{
  locations: ObservationLocation[];
  studies: ImageStudyItem[];
  categories: ImageStudyCategoryInfo[];
}> {
  requireConfigured("observations");
  return once("observations", async () => {
    const [places, collections] = await Promise.all([
      sanityClient.fetch<SanityPlace[]>(ALL_PLACES),
      sanityClient.fetch<SanityStudyCollection[]>(ALL_IMAGE_STUDY_COLLECTIONS),
    ]);
    if (!places.length) throw new Error("[observations] No published places found.");
    if (!collections.length) throw new Error("[observations] No published image-study collections found.");

    const locations: ObservationLocation[] = places.map((p) => {
      const gallery = p.gallery ?? [];
      return {
        slug: p.slug,
        title: p.title,
        imageCount: gallery.length,
        images: gallery.map((g, i) => {
          if (!g.image?.asset) throw new Error(`[observations] ${p.slug} gallery[${i}] has a broken image reference`);
          if (!g.alt) throw new Error(`[observations] ${p.slug} gallery[${i}] is missing alt text`);
          const d = g.image.asset.metadata.dimensions;
          return {
            seq: i + 1,
            thumb: square(g.image, 600),
            full: fullSize(g.image),
            width: d.width,
            height: d.height,
          };
        }),
      };
    });

    const categories: ImageStudyCategoryInfo[] = collections.map((c) => ({
      slug: c.category,
      title: c.title,
      description: c.description ?? "",
    }));

    const studies: ImageStudyItem[] = collections.flatMap((c) => {
      const gallery = c.gallery ?? [];
      return gallery.map((g, i) => {
        if (!g.image?.asset) throw new Error(`[observations] ${c.slug} gallery[${i}] has a broken image reference`);
        const d = g.image.asset.metadata.dimensions;
        return {
          id: `${c.category}-${pad2(i + 1)}`,
          category: c.category,
          seq: i + 1,
          thumb: square(g.image, 600),
          full: fullSize(g.image),
          width: d.width,
          height: d.height,
          label: g.sequenceLabel ?? `${c.title} · ${pad2(i + 1)} / ${pad2(gallery.length)}`,
        };
      });
    });

    return { locations, studies, categories };
  });
}

/* ---------------- Writing ---------------- */

export interface WritingArticle {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  type: string;
  institution: string;
  year: string;
  summary: string;
  introduction: string[];
  sections: { number: string; heading: string; subheading?: string; body: string[] }[];
  references?: string[];
  externalLink?: { label: string; url: string; credit: string };
  isProvisional: boolean;
}

interface PTBlock {
  _type: string;
  style?: string;
  children?: { text?: string }[];
}

const blockText = (b: PTBlock) => (b.children ?? []).map((c) => c.text ?? "").join("");

/* Reconstructs the article layout shape from Portable Text: blocks before
   the first H2 are the introduction; each H2 starts a section; an H3
   directly after an H2 is its subheading. */
function toArticle(doc: any, index: number): WritingArticle {
  const blocks: PTBlock[] = (doc.body ?? []).filter((b: PTBlock) => b._type === "block");
  const introduction: string[] = [];
  const sections: WritingArticle["sections"] = [];
  let current: WritingArticle["sections"][number] | null = null;
  for (const b of blocks) {
    const text = blockText(b);
    if (b.style === "h2") {
      current = { number: pad2(sections.length + 1), heading: text, body: [] };
      sections.push(current);
    } else if (b.style === "h3" && current && current.body.length === 0 && !current.subheading) {
      current.subheading = text;
    } else if (!current) {
      if (text.trim()) introduction.push(text);
    } else if (text.trim()) {
      current.body.push(text);
    }
  }
  return {
    slug: doc.slug,
    number: pad2(index + 1),
    title: doc.title,
    subtitle: doc.subtitle ?? "",
    type: doc.articleType ?? "",
    institution: doc.institution ?? "",
    year: doc.year ?? "",
    summary: doc.summary ?? "",
    introduction,
    sections,
    references: doc.references ?? undefined,
    externalLink: doc.externalUrl
      ? { label: doc.externalUrlLabel ?? "View ↗", url: doc.externalUrl, credit: doc.externalUrlCredit ?? "" }
      : undefined,
    isProvisional: false,
  };
}

/* Published + visible articles in Writing Order (weak refs to drafts
   resolve to null under the published perspective and are dropped). */
export function getPublishedWriting(): Promise<WritingArticle[]> {
  requireConfigured("writing");
  return once("writing", async () => {
    const result = await sanityClient.fetch<{ articles?: (any | null)[] } | null>(PUBLISHED_WRITING);
    const docs = (result?.articles ?? []).filter((a) => a && a.showOnSite !== false);
    return docs.map((doc, i) => toArticle(doc, i));
  });
}

/* ---------------- About ---------------- */

export interface AboutData {
  introduction: string[];
  location?: string;
  email: string;
  credential?: { name?: string; date?: string };
  education: { key: string; main: string[]; detail?: string[] }[];
  selectedProjects: { key: string; main: string[]; detail?: string[] }[];
  awards: { key?: string; title: string; detail?: string; url?: string; external?: boolean }[];
  skillGroups: { title: string; items: string[] }[];
}

export function getAboutContent(): Promise<AboutData> {
  requireConfigured("about");
  return once("about", async () => {
    const doc = await sanityClient.fetch<any | null>(ABOUT_SETTINGS);
    if (!doc) throw new Error('[about] The "About" document is missing or unpublished.');
    if (!doc.introduction?.length) throw new Error("[about] introduction is empty.");
    if (!doc.email) throw new Error("[about] email is empty.");
    return {
      introduction: doc.introduction,
      location: doc.location,
      email: doc.email,
      credential: doc.credential,
      education: doc.education ?? [],
      selectedProjects: doc.selectedProjects ?? [],
      awards: (doc.awards ?? []).map((a: any) => ({ ...a, external: Boolean(a.url) })),
      skillGroups: doc.skillGroups ?? [],
    };
  });
}

/* ---------------- Book ---------------- */

export interface BookData {
  title: string;
  /* Site-relative path (served by the site host) or absolute https URL
     (e.g. a Sanity CDN file uploaded through Book Settings). */
  pdfSrc: string;
  isRemote: boolean;
  downloadFilename?: string;
}

export function getBookSettings(): Promise<BookData> {
  requireConfigured("book");
  return once("book", async () => {
    const doc = await sanityClient.fetch<any | null>(BOOK_SETTINGS);
    if (!doc) throw new Error('[book] The "Book" document is missing or unpublished.');
    const pdfSrc: string | undefined = doc.pdfFileUrl ?? doc.pdfSourceUrl;
    if (!pdfSrc) throw new Error("[book] No PDF file or source URL configured in Book Settings.");
    return {
      title: doc.title ?? "Portfolio",
      pdfSrc,
      isRemote: /^https:\/\//.test(pdfSrc),
      downloadFilename: doc.downloadFilename,
    };
  });
}
