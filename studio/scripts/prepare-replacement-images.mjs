/**
 * Normalizes the finalized replacement images for web upload.
 *
 * Run from the REPO ROOT (sharp resolves from root node_modules):
 *   node studio/scripts/prepare-replacement-images.mjs
 *
 * Reads  _sanity-replacement/projects/<folder>/<folder> NN.ext  (spec format,
 * space-separated sequence). Non-conforming files are reported and skipped —
 * they are working material, not part of the finalized sequence.
 * Writes  _sanity-replacement/_processed-upload/projects/<sanity-slug>/
 * Originals are never modified. Output: sRGB, orientation-corrected,
 * metadata-stripped, long edge <= 3200, JPEG q90 (PNG kept only for alpha).
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SRC = "_sanity-replacement/projects";
const OUT = "_sanity-replacement/_processed-upload/projects";
const REPORT = "_sanity-replacement/_processed-upload/prepare-report.json";

/* Folder name → Sanity project slug (folders otherwise match slugs). */
const FOLDER_TO_SLUG = { "surreal-museum": "surreal-museum-tower" };
/* Excluded per preflight: single CR3 (no reliable local RAW decoder) and no
   gallery files — this project keeps its current Sanity images. */
const SKIP = new Set(["floating-microhabitat"]);

const DECODABLE = new Set([".jpg", ".jpeg", ".jfif", ".png", ".webp", ".avif", ".tif", ".tiff", ".gif"]);
const MAX_EDGE = 3200;

const report = { generatedAt: new Date().toISOString(), projects: {}, skippedProjects: [...SKIP], nonConforming: {}, conversions: [], errors: [] };

for (const folder of readdirSync(SRC)) {
  if (SKIP.has(folder)) continue;
  const slug = FOLDER_TO_SLUG[folder] ?? folder;
  const dir = join(SRC, folder);
  const conforming = [];
  const nonConforming = [];
  const pattern = new RegExp(`^${folder.replace(/[-]/g, "\\-")} (\\d{1,2})$`);
  for (const name of readdirSync(dir)) {
    const ext = extname(name).toLowerCase();
    const base = name.slice(0, -ext.length);
    const m = base.match(pattern);
    if (m) conforming.push({ name, seq: parseInt(m[1], 10), ext });
    else nonConforming.push(name);
  }
  conforming.sort((a, b) => a.seq - b.seq);
  if (nonConforming.length) report.nonConforming[folder] = nonConforming;

  const seqs = conforming.map((f) => f.seq);
  if (!seqs.includes(1)) { report.errors.push(`${folder}: no sequence 01`); continue; }
  if (new Set(seqs).size !== seqs.length) { report.errors.push(`${folder}: duplicate sequence`); continue; }
  const gaps = [];
  for (let i = 1; i <= seqs[seqs.length - 1]; i++) if (!seqs.includes(i)) gaps.push(i);
  if (gaps.length) { report.errors.push(`${folder}: missing sequence ${gaps.join(",")}`); continue; }
  if (seqs.length < 2) { report.errors.push(`${folder}: no gallery image (02+)`); continue; }

  const outDir = join(OUT, slug);
  mkdirSync(outDir, { recursive: true });
  const entries = [];
  for (const f of conforming) {
    if (!DECODABLE.has(f.ext)) { report.errors.push(`${folder}/${f.name}: unsupported format ${f.ext}`); continue; }
    const inPath = join(dir, f.name);
    const img = sharp(inPath, { limitInputPixels: false }).rotate();
    const meta = await img.metadata();
    const hasAlpha = Boolean(meta.hasAlpha);
    const outExt = hasAlpha ? "png" : "jpg";
    const outName = `${slug}-${String(f.seq).padStart(2, "0")}.${outExt}`;
    const outPath = join(outDir, outName);
    let pipeline = img.resize({
      width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true,
    });
    pipeline = hasAlpha ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality: 90, mozjpeg: true });
    const info = await pipeline.toFile(outPath);
    const converted = f.ext !== `.${outExt}` && !(f.ext === ".jpeg" && outExt === "jpg");
    if (converted) {
      report.conversions.push(`${folder}/${f.name} (${meta.format} ${meta.width}x${meta.height}) -> ${outName} (${info.width}x${info.height})`);
    }
    entries.push({
      seq: f.seq,
      source: f.name,
      output: outName,
      role: f.seq === 1 ? "homepageThumbnail" : "gallery",
      inFormat: meta.format,
      outDims: `${info.width}x${info.height}`,
      outKB: Math.round(statSync(outPath).size / 1024),
    });
    console.log(`${slug} ${String(f.seq).padStart(2, "0")}: ${meta.format} ${meta.width}x${meta.height} -> ${outExt} ${info.width}x${info.height} (${Math.round(statSync(outPath).size / 1024)} KB)`);
  }
  report.projects[slug] = { folder, count: entries.length, thumbnail: entries[0]?.output, gallery: entries.slice(1).map((e) => e.output), entries };
}

writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log("---");
console.log(`projects processed: ${Object.keys(report.projects).length} · conversions: ${report.conversions.length} · errors: ${report.errors.length}`);
for (const e of report.errors) console.log(`ERROR: ${e}`);
console.log(`report: ${REPORT}`);
if (report.errors.length) process.exit(1);
