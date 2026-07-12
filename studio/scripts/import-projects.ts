/**
 * Phase 2A import: every current website project → Sanity.
 *
 * Run from the studio/ directory:
 *   npx sanity exec scripts/import-projects.ts --with-user-token
 *
 * Idempotent:
 * - deterministic document IDs (project-<slug>)
 * - asset reuse by originalFilename (Sanity also dedupes identical bytes)
 * - Fluid Terrain (verified in Phase 1) is PATCHED with the new Phase 2
 *   fields only — its verified gallery/alt/keyword data is preserved
 * - Homepage Order arrays are SET wholesale in registry order
 *
 * Content source: src/data/projects.ts (single source of truth). No facts
 * are invented; absent optional fields stay empty and are reported in the
 * manifest (docs/sanity-cms/migration-manifest.json).
 */
import {getCliClient} from 'sanity/cli'
import {createReadStream, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {PROJECTS, type Project} from '../../src/data/projects'

const API_VERSION = '2026-07-01'
const SETTINGS_ID = 'homepageSettings'
const FLUID_ID = 'project-fluid-terrain'
const PUBLIC_DIR = resolve(process.cwd(), '..', 'public')
const MANIFEST_PATH = resolve(process.cwd(), '..', 'docs', 'sanity-cms', 'migration-manifest.json')
const BASE = '/images/portfolio-pages'

const docId = (p: Project) => `project-${p.slug}`
const sheetFile = (s: Project['sheets'][number]) => (typeof s === 'string' ? s : s.file)
const localPath = (p: Project, s: Project['sheets'][number]) =>
  resolve(PUBLIC_DIR, `.${(p.base ?? BASE)}/${p.folder}/${sheetFile(s)}`.replace(/^\/+/, ''))

/* Optional fields audited for the missing-data report. */
const OPTIONAL_FIELDS = [
  'subtitle',
  'role',
  'collaborators',
  'description',
  'keywords',
  'keyContributions',
  'recognition',
  'externalUrl',
  'video',
  'captions',
] as const

interface ProjectReport {
  docId: string
  title: string
  slug: string
  placement: 'selectedWorks' | 'moreWorks'
  position: number
  sourceImages: number
  uploaded: number
  reused: number
  action: 'created-or-replaced' | 'patched-preserving-phase1'
  missingOptional: string[]
}

function buildDoc(p: Project, assetIds: Record<string, string>) {
  const metaMap = Object.fromEntries(p.meta.map((m) => [m.k, m.v]))
  const [cardYear, cardType] = p.cardMeta.split('·').map((s) => s.trim())
  const keywordsRow = metaMap['Keywords']

  return {
    _id: docId(p),
    _type: 'project',
    title: p.title,
    slug: {_type: 'slug', current: p.slug},
    cardMeta: p.cardMeta,
    metaRows: p.meta.map((row, i) => ({
      _key: `row-${String(i + 1).padStart(2, '0')}`,
      _type: 'metaRow',
      label: row.k,
      value: row.v,
    })),
    /* Structured duplicates of registry values for Studio previews/search.
       Display parity is owned by metaRows. */
    year: metaMap['Year'] ?? cardYear,
    projectType: metaMap['Type'] ?? cardType,
    ...(metaMap['Period'] ? {period: metaMap['Period']} : {}),
    ...(metaMap['Location'] ? {location: metaMap['Location']} : {}),
    ...(metaMap['Program'] ? {program: metaMap['Program']} : {}),
    ...(metaMap['Credits'] ? {credits: metaMap['Credits']} : {}),
    ...(metaMap['Role'] ? {role: metaMap['Role']} : {}),
    ...(keywordsRow ? {keywords: keywordsRow.split(' · ')} : {}),
    shortDescription: p.desc,
    ...(p.overview ? {description: p.overview.join('\n\n')} : {}),
    ...(p.keyContributions ? {keyContributions: p.keyContributions} : {}),
    ...(p.recognition ? {recognition: p.recognition} : {}),
    ...(p.video
      ? {video: {title: p.video.title, youtubeId: p.video.youtubeId, poster: p.video.poster}}
      : {}),
    showOnSite: true,
    homepageThumbnail: {
      _type: 'image',
      asset: {_type: 'reference', _ref: assetIds[sheetFile(p.sheets[0])]},
    },
    gallery: p.sheets.map((s, i) => ({
      _key: `${p.id}-${String(i + 1).padStart(2, '0')}`,
      _type: 'galleryImage',
      image: {_type: 'image', asset: {_type: 'reference', _ref: assetIds[sheetFile(s)]}},
      /* The live expansion renders exactly this generated alt for every sheet. */
      alt: `${p.title} — sheet ${i + 1} of ${p.sheets.length}`,
    })),
  }
}

function missingOptional(p: Project): string[] {
  const metaMap = Object.fromEntries(p.meta.map((m) => [m.k, m.v]))
  const missing: string[] = ['subtitle'] // no subtitles exist in the registry
  if (!metaMap['Role']) missing.push('role')
  missing.push('collaborators') // never structured in the registry (credits strings only)
  if (!p.overview) missing.push('description/overview')
  if (!metaMap['Keywords'] && p.slug !== 'fluid-terrain') missing.push('keywords')
  if (!p.keyContributions) missing.push('keyContributions')
  if (!p.recognition) missing.push('recognition')
  missing.push('externalUrl') // none exist in the registry
  if (!p.video) missing.push('video')
  missing.push('captions') // no captions exist anywhere in the registry
  missing.push('objectPosition') // no per-project object-position values exist
  return missing
}

async function main() {
  const client = getCliClient({apiVersion: API_VERSION})
  if (!client.config().token) {
    console.error('No authenticated context. Run with:')
    console.error('  npx sanity exec scripts/import-projects.ts --with-user-token')
    process.exit(1)
  }

  /* ---- preflight: duplicates and missing files ---- */
  const slugs = PROJECTS.map((p) => p.slug)
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  const titles = PROJECTS.map((p) => p.title)
  const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i)
  const allFiles = PROJECTS.flatMap((p) => p.sheets.map((s) => sheetFile(s)))
  const dupFiles = allFiles.filter((f, i) => allFiles.indexOf(f) !== i)
  const missingFiles = PROJECTS.flatMap((p) =>
    p.sheets.map((s) => localPath(p, s)).filter((abs) => !existsSync(abs)),
  )
  if (dupSlugs.length || dupTitles.length || dupFiles.length || missingFiles.length) {
    console.error('PREFLIGHT FAILURE (destructive ambiguity):')
    if (dupSlugs.length) console.error(`  duplicate slugs: ${dupSlugs.join(', ')}`)
    if (dupTitles.length) console.error(`  duplicate titles: ${dupTitles.join(', ')}`)
    if (dupFiles.length) console.error(`  duplicate image filenames: ${dupFiles.join(', ')}`)
    if (missingFiles.length) console.error(`  missing files:\n    ${missingFiles.join('\n    ')}`)
    process.exit(1)
  }
  console.log(
    `preflight ok — ${PROJECTS.length} projects, ${allFiles.length} images, no duplicates, no missing files`,
  )

  /* ---- assets ---- */
  let uploadedTotal = 0
  let reusedTotal = 0
  const reports: ProjectReport[] = []
  const tierA = PROJECTS.filter((p) => p.tier === 'A')
  const tierB = PROJECTS.filter((p) => p.tier === 'B')

  for (const p of PROJECTS) {
    const assetIds: Record<string, string> = {}
    let uploaded = 0
    let reused = 0
    for (const s of p.sheets) {
      const filename = sheetFile(s)
      const existing = await client.fetch(
        `*[_type == "sanity.imageAsset" && originalFilename == $fn][0]._id`,
        {fn: filename},
      )
      if (existing) {
        assetIds[filename] = existing
        reused++
      } else {
        const asset = await client.assets.upload('image', createReadStream(localPath(p, s)), {
          filename,
        })
        assetIds[filename] = asset._id
        uploaded++
      }
    }
    uploadedTotal += uploaded
    reusedTotal += reused

    /* ---- document ---- */
    const id = docId(p)
    let action: ProjectReport['action']
    if (id === FLUID_ID) {
      /* Preserve verified Phase 1 data (rich alts, keywords from the detail
         page); add only the Phase 2 fields. */
      const doc = buildDoc(p, assetIds)
      await client
        .patch(FLUID_ID)
        .set({cardMeta: doc.cardMeta, metaRows: doc.metaRows})
        .commit()
      action = 'patched-preserving-phase1'
    } else {
      await client.createOrReplace(buildDoc(p, assetIds))
      action = 'created-or-replaced'
    }

    const placement = p.tier === 'A' ? 'selectedWorks' : 'moreWorks'
    const position =
      p.tier === 'A' ? tierA.findIndex((x) => x.id === p.id) : tierB.findIndex((x) => x.id === p.id)
    reports.push({
      docId: id,
      title: p.title,
      slug: p.slug,
      placement,
      position,
      sourceImages: p.sheets.length,
      uploaded,
      reused,
      action,
      missingOptional: missingOptional(p),
    })
    console.log(
      `${id.padEnd(34)} ${action.padEnd(28)} images: ${String(p.sheets.length).padStart(2)} (up ${uploaded}, reuse ${reused})`,
    )
  }

  /* ---- homepage order singleton: registry order, wholesale ---- */
  const ref = (p: Project) => ({
    _key: `ref-${docId(p)}`,
    _type: 'reference' as const,
    _ref: docId(p),
  })
  await client.createIfNotExists({_id: SETTINGS_ID, _type: 'homepageSettings'})
  await client
    .patch(SETTINGS_ID)
    .set({selectedWorks: tierA.map(ref), moreWorks: tierB.map(ref)})
    .commit()
  console.log(
    `settings ${SETTINGS_ID} — selectedWorks: ${tierA.length}, moreWorks: ${tierB.length} (registry order)`,
  )

  /* ---- manifest (no secrets) ---- */
  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: '2A',
    dataset: 'production',
    totals: {
      projects: PROJECTS.length,
      selectedWorks: tierA.length,
      moreWorks: tierB.length,
      sourceImages: allFiles.length,
      assetsUploaded: uploadedTotal,
      assetsReused: reusedTotal,
    },
    projects: reports,
  }
  mkdirSync(dirname(MANIFEST_PATH), {recursive: true})
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log('---')
  console.log(`projects: ${PROJECTS.length} · uploaded: ${uploadedTotal} · reused: ${reusedTotal}`)
  console.log(`manifest: ${MANIFEST_PATH}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
