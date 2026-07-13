/**
 * Replaces every Project document's images from the prepared replacement set.
 *
 * Run from the studio/ directory AFTER prepare-replacement-images.mjs:
 *   npx sanity exec scripts/replace-project-images.ts --with-user-token
 *
 * Safety:
 * - writes a rollback manifest of the current image configuration first
 * - sha1-based asset reuse (Sanity asset IDs embed the content hash) —
 *   reruns upload nothing new and produce identical documents
 * - all uploads complete BEFORE any document mutation
 * - all 14 document patches commit in ONE transaction (atomic; the publish
 *   webhook therefore fires for a single transaction)
 * - only homepageThumbnail and gallery are touched; every other field is
 *   preserved; old assets are never deleted
 */
import {getCliClient} from 'sanity/cli'
import {createReadStream, readFileSync, mkdirSync, writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {resolve, dirname, join} from 'node:path'

const API_VERSION = '2026-07-01'
const ROOT = resolve(process.cwd(), '..')
const PREPARED = join(ROOT, '_sanity-replacement', '_processed-upload')
const REPORT = JSON.parse(readFileSync(join(PREPARED, 'prepare-report.json'), 'utf8'))
const ROLLBACK_PATH = join(ROOT, '_sanity-replacement', '_rollback', 'rollback-manifest.json')
const MANIFEST_PATH = join(ROOT, '_sanity-replacement', '_rollback', 'replacement-manifest.json')

const client = getCliClient({apiVersion: API_VERSION})
const pad2 = (n: number) => String(n).padStart(2, '0')

async function main() {
  if (!client.config().token) {
    console.error('Run with: npx sanity exec scripts/replace-project-images.ts --with-user-token')
    process.exit(1)
  }
  const slugs = Object.keys(REPORT.projects)

  /* ---- 1. rollback manifest (current image config, no secrets) ---- */
  const current = await client.fetch(
    `*[_type == "project"]{ _id, title, "slug": slug.current,
      homepageThumbnail{ asset, hotspot, crop },
      gallery[]{ _key, alt, caption, objectPosition, note, image{ asset, hotspot, crop } } }`,
  )
  mkdirSync(dirname(ROLLBACK_PATH), {recursive: true})
  writeFileSync(ROLLBACK_PATH, JSON.stringify({generatedAt: new Date().toISOString(), projects: current}, null, 2))
  console.log(`rollback manifest: ${ROLLBACK_PATH} (${current.length} projects)`)

  /* ---- 2. upload (or reuse) every prepared asset ---- */
  let uploaded = 0
  let reused = 0
  const manifest: any[] = []
  const assetByOutput: Record<string, string> = {}
  for (const slug of slugs) {
    const proj = REPORT.projects[slug]
    for (const entry of proj.entries) {
      const abs = join(PREPARED, 'projects', slug, entry.output)
      const sha1 = createHash('sha1').update(readFileSync(abs)).digest('hex')
      const existing = await client.fetch(`*[_type == "sanity.imageAsset" && _id match "image-" + $sha1 + "-*"][0]._id`, {sha1})
      let assetId: string
      if (existing) {
        assetId = existing
        reused++
      } else {
        const asset = await client.assets.upload('image', createReadStream(abs), {filename: entry.output})
        assetId = asset._id
        uploaded++
      }
      assetByOutput[`${slug}/${entry.output}`] = assetId
      manifest.push({
        localSource: `${proj.folder}/${entry.source}`,
        processed: entry.output,
        sha1,
        assetId,
        documentId: `project-${slug}`,
        field: entry.role,
        galleryPosition: entry.role === 'gallery' ? entry.seq - 1 : null,
      })
    }
    console.log(`${slug}: assets ready (${proj.entries.length})`)
  }

  /* ---- 3. one atomic transaction patching all documents ---- */
  const titles = Object.fromEntries(current.map((p: any) => [p.slug, p.title]))
  const tx = client.transaction()
  for (const slug of slugs) {
    const proj = REPORT.projects[slug]
    const title = titles[slug] ?? slug
    const thumbEntry = proj.entries.find((e: any) => e.seq === 1)
    const galleryEntries = proj.entries.filter((e: any) => e.seq >= 2)
    tx.patch(`project-${slug}`, (p) =>
      p.set({
        homepageThumbnail: {
          _type: 'image',
          asset: {_type: 'reference', _ref: assetByOutput[`${slug}/${thumbEntry.output}`]},
        },
        gallery: galleryEntries.map((e: any) => ({
          _key: `${slug}-img-${pad2(e.seq)}`,
          _type: 'galleryImage',
          image: {_type: 'image', asset: {_type: 'reference', _ref: assetByOutput[`${slug}/${e.output}`]}},
          /* Temporary neutral alt — flagged for manual review in the audit. */
          alt: `${title}, project image ${pad2(e.seq)}`,
        })),
      }),
    )
  }
  await tx.commit()
  console.log(`patched ${slugs.length} project documents in one transaction`)

  /* ---- 4. validation ---- */
  const after = await client.fetch(
    `*[_type == "project"]{ "slug": slug.current, "thumb": homepageThumbnail.asset._ref,
      "galleryRefs": gallery[].image.asset._ref, "keys": gallery[]._key, "alts": gallery[].alt,
      title, cardMeta, shortDescription, "metaRowCount": count(metaRows) }`,
  )
  const settings = await client.fetch(
    `*[_id == "homepageSettings"][0]{ "sel": selectedWorks[]->slug.current, "more": moreWorks[]->slug.current }`,
  )
  const issues: string[] = []
  for (const slug of slugs) {
    const proj = REPORT.projects[slug]
    const doc = after.find((d: any) => d.slug === slug)
    if (!doc) { issues.push(`${slug}: document missing`); continue }
    const thumbEntry = proj.entries.find((e: any) => e.seq === 1)
    if (doc.thumb !== assetByOutput[`${slug}/${thumbEntry.output}`]) issues.push(`${slug}: thumbnail mismatch`)
    const expected = proj.entries.filter((e: any) => e.seq >= 2).map((e: any) => assetByOutput[`${slug}/${e.output}`])
    if (JSON.stringify(doc.galleryRefs) !== JSON.stringify(expected)) issues.push(`${slug}: gallery order/refs mismatch`)
    if (new Set(doc.galleryRefs).size !== doc.galleryRefs.length) issues.push(`${slug}: duplicate gallery asset`)
    if ((doc.alts ?? []).some((a: string) => !a)) issues.push(`${slug}: missing alt`)
    if (!doc.title || !doc.cardMeta || !doc.shortDescription || !doc.metaRowCount) issues.push(`${slug}: non-image field lost!`)
    if (doc.galleryRefs.includes(doc.thumb)) issues.push(`${slug}: sequence 01 also in gallery`)
  }
  const EXPECT_SEL = ['fluid-terrain','calibrated-environment','surreal-museum-tower','spectrum-living','shadow-archive','ordinary-village','ivanpah-solar-sanctuary']
  const EXPECT_MORE = ['floating-microhabitat','space-urchin','terroir-hot-springs','playful-layers','hora-museum','threshold-housing','w-school','sejong-smart-school']
  if (JSON.stringify(settings.sel) !== JSON.stringify(EXPECT_SEL)) issues.push('Homepage Order selectedWorks changed!')
  if (JSON.stringify(settings.more) !== JSON.stringify(EXPECT_MORE)) issues.push('Homepage Order moreWorks changed!')

  writeFileSync(MANIFEST_PATH, JSON.stringify({generatedAt: new Date().toISOString(), uploaded, reused, entries: manifest}, null, 2))
  console.log('---')
  console.log(`VALIDATION: ${issues.length === 0 ? 'PASS' : 'FAIL'}`)
  for (const i of issues) console.log(`ISSUE: ${i}`)
  console.log(`uploaded: ${uploaded} · reused: ${reused} · manifest: ${MANIFEST_PATH}`)
  if (issues.length) process.exit(1)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
