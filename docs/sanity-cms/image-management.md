# Image Management Recommendation (for future administrator uploads)

## Upload rules

- **Maximum long edge: 2400px** (matches the current production pipeline;
  2000px is fine for most sheets). Never upload print/source resolution.
- **JPEG** for renders, photographs, and sheets (quality 70–80).
- **PNG** only when transparency is genuinely needed (logos, cut-out
  diagrams). Do not use PNG for photographs — files balloon.
- **TIFF: do not upload.** Convert to JPEG/PNG first.
- Aim for under ~500KB per image where possible.

## Alt text (required on every gallery image)

Describe the architectural content, not the filename: what the drawing or
image shows (e.g. "Long section through the gabion terraces meeting the
creek"), not "01-fluid-05.jpg". Screen readers and image-search both read
this.

## Hotspot and crop

- The **hotspot** marks the most important area of an image; layouts that
  crop (thumbnails, cards) keep that area visible.
- Cropping in Sanity is **non-destructive**: the original upload is never
  altered. Crop/hotspot are display transformations applied per-request by
  the image CDN. You can change or remove them at any time.
- Plans, sections, and diagrams should generally not be displayed cropped —
  leave the hotspot centered and let the frontend render them `contain`-style.

## Avoiding duplicates

- Before uploading, check whether the image already exists in the Media
  library (Sanity deduplicates identical files by content hash, but renamed
  re-exports create true duplicates).
- Re-use the same asset across documents by selecting it from the Media
  library instead of re-uploading.

## Images that contain text

Sheets with embedded text (boards, annotated drawings) must be uploaded at a
size where the text is legible at full display width (long edge 2000–2400px),
and the alt text should summarize what the text says, since the text itself
is not machine-readable.

## Why Sanity assets instead of the git repo

- Future CMS images live on Sanity's asset store + image CDN, so the git
  repository stops growing with every new photo (`public/images/` is already
  the largest part of the repo).
- The image CDN generates resized/reformatted variants on the fly
  (`?w=…&auto=format`), so no new local thumbnail folders are ever generated.
- Public pages must always request an explicitly sized variant (via the
  `urlFor(...).width(...)` helper in `src/lib/sanity/image.ts`), never the
  original upload URL — this keeps mobile payloads small and preserves the
  existing performance budget (LCP ≤ 2.5s, initial images ≤ 1.5MB).
