/* TypeScript shapes for the Phase 1 pilot queries (see queries.ts). */

export interface SanityImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface SanityImageAsset {
  _id: string;
  url: string;
  originalFilename?: string;
  metadata: { dimensions: SanityImageDimensions };
}

export interface SanityImageWithAsset {
  asset: SanityImageAsset;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface SanityGalleryItem {
  _key: string;
  image: SanityImageWithAsset;
  alt: string;
  caption?: string;
  objectPosition?: string;
}

export interface SanityMetaRow {
  _key: string;
  label: string;
  value: string;
}

export interface SanityVideo {
  title: string;
  youtubeId: string;
  poster?: string;
}

export interface SanityProject {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  cardMeta?: string;
  metaRows?: SanityMetaRow[];
  year?: string;
  period?: string;
  location?: string;
  program?: string;
  projectType?: string;
  credits?: string;
  role?: string;
  collaborators?: string[];
  shortDescription: string;
  description?: string;
  keywords?: string[];
  keyContributions?: string[];
  recognition?: string;
  externalUrl?: string;
  video?: SanityVideo;
  showOnSite: boolean;
  homepageThumbnail?: SanityImageWithAsset;
  gallery?: SanityGalleryItem[];
}

export interface SanityHomepageSettings {
  selectedWorks: { _id: string; title: string; slug: string }[];
  moreWorks: { _id: string; title: string; slug: string }[];
}
