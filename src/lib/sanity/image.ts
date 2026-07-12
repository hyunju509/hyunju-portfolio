/*
 * Sanity image URL helper (official @sanity/image-url builder).
 * URLs honor hotspot/crop metadata and request auto format (WebP/AVIF
 * where supported) at explicit widths — never the original-size file.
 */
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { sanityClient } from "./client";

const builder = createImageUrlBuilder(sanityClient);

export const urlFor = (source: SanityImageSource) => builder.image(source).auto("format");

/* srcset string for responsive rendering, e.g. widths [480, 960, 1372]. */
export function srcsetFor(source: SanityImageSource, widths: number[]): string {
  return widths.map((w) => `${urlFor(source).width(w).url()} ${w}w`).join(", ");
}
