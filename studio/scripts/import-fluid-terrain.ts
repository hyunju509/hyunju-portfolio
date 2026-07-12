/**
 * Phase 1 pilot import: Fluid Terrain → Sanity.
 *
 * Run from the studio/ directory:
 *   npx sanity exec scripts/import-fluid-terrain.ts --with-user-token
 *
 * Idempotent: stable document IDs (createOrReplace / createIfNotExists),
 * deterministic gallery keys, and asset reuse by originalFilename (Sanity
 * additionally dedupes identical files by content hash). Safe to re-run.
 *
 * Content sources (no invented facts):
 * - src/data/projects.ts  — registry entry "fluid" (title, slug, desc, meta, sheet order)
 * - src/pages/projects/fluid-terrain.astro — keywords and per-sheet alt text
 * - src/components/GridItem.astro — card alt (project title)
 */
import {getCliClient} from 'sanity/cli'
import {createReadStream, existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {PROJECTS} from '../../src/data/projects'

const API_VERSION = '2026-07-01'
const DOC_ID = 'project-fluid-terrain'
const SETTINGS_ID = 'homepageSettings'

/* Web-optimized production images only — served today at
   public/images/portfolio-pages/fluid-terrain/. cwd is studio/. */
const IMAGE_DIR = resolve(process.cwd(), '..', 'public', 'images', 'portfolio-pages', 'fluid-terrain')

/* Alt text per sheet, from the existing site (fluid-terrain.astro / GridItem). */
const ALT: Record<string, string> = {
  '01-fluid-01.jpg': 'Fluid Terrain',
  '01-fluid-02.jpg':
    "Occupation sheet — a seasonal market on the timber deck between gabion walls, and a view of the settlement's stepped terraces meeting the creek",
  '01-fluid-03.jpg':
    'Site analysis sheet — seasonal cycle diagram of precipitation, flood pressure, and agricultural intensity in Santa Paula Creek, with hydrological and crop maps of the creek corridor',
  '01-fluid-04.jpg':
    'Material strategy sheet — aerial drawing of the gabion settlement in the creek, material cycle diagram from waste concrete to porous gabion foundations, and gabion wall assembly details',
  '01-fluid-05.jpg':
    'Long architectural section through the porous gabion landscape — market, cooling storage, filtering system, and fish ladder terraces stepping down to the creek, with summer dry-season and winter flood-season studies below',
}

/* Keywords from the project page "Key Words" block. */
const KEYWORDS = ['Flood Mitigation', 'Porous Ground', 'Thermal Microclimate', 'Seasonal Habitat']

async function main() {
  const client = getCliClient({apiVersion: API_VERSION})
  if (!client.config().token) {
    console.error('No authenticated context. Run with:')
    console.error('  npx sanity exec scripts/import-fluid-terrain.ts --with-user-token')
    process.exit(1)
  }

  const fluid = PROJECTS.find((p) => p.slug === 'fluid-terrain')
  if (!fluid) throw new Error('Registry entry for fluid-terrain not found in src/data/projects.ts')

  const metaMap = Object.fromEntries(fluid.meta.map((m) => [m.k, m.v]))
  /* cardMeta is "2026 · Landscape Infrastructure" → year + type label */
  const [cardYear, cardType] = fluid.cardMeta.split('·').map((s) => s.trim())

  /* ---- upload images (dedupe by originalFilename) ---- */
  let uploaded = 0
  let reused = 0
  const assetIds: Record<string, string> = {}
  for (const sheet of fluid.sheets) {
    const filename = typeof sheet === 'string' ? sheet : sheet.file
    const abs = resolve(IMAGE_DIR, filename)
    if (!existsSync(abs)) throw new Error(`Missing local image: ${abs}`)
    const existing = await client.fetch(
      `*[_type == "sanity.imageAsset" && originalFilename == $fn][0]._id`,
      {fn: filename},
    )
    if (existing) {
      assetIds[filename] = existing
      reused++
      console.log(`asset reused   ${filename} → ${existing}`)
    } else {
      const asset = await client.assets.upload('image', createReadStream(abs), {filename})
      assetIds[filename] = asset._id
      uploaded++
      console.log(`asset uploaded ${filename} → ${asset._id}`)
    }
  }

  /* ---- project document ---- */
  const gallery = fluid.sheets.map((sheet, i) => {
    const filename = typeof sheet === 'string' ? sheet : sheet.file
    return {
      _key: `fluid-${String(i + 1).padStart(2, '0')}`,
      _type: 'galleryImage',
      image: {_type: 'image', asset: {_type: 'reference', _ref: assetIds[filename]}},
      alt: ALT[filename] ?? fluid.title,
    }
  })

  const doc = {
    _id: DOC_ID,
    _type: 'project',
    title: fluid.title,
    slug: {_type: 'slug', current: fluid.slug},
    year: cardYear,
    projectType: cardType,
    period: metaMap['Period'],
    location: metaMap['Location'],
    program: metaMap['Program'],
    credits: metaMap['Credits'],
    shortDescription: fluid.desc,
    keywords: KEYWORDS,
    showOnSite: true,
    homepageThumbnail: {
      _type: 'image',
      asset: {_type: 'reference', _ref: assetIds[typeof fluid.sheets[0] === 'string' ? fluid.sheets[0] : fluid.sheets[0].file]},
    },
    gallery,
  }
  await client.createOrReplace(doc)
  console.log(`document       ${DOC_ID} createOrReplace ok`)

  /* ---- homepage settings singleton: ensure Fluid Terrain in Selected Works ---- */
  await client.createIfNotExists({
    _id: SETTINGS_ID,
    _type: 'homepageSettings',
    selectedWorks: [],
    moreWorks: [],
  })
  const settings = await client.getDocument(SETTINGS_ID)
  const already = (settings?.selectedWorks ?? []).some((r: any) => r._ref === DOC_ID)
  if (!already) {
    await client
      .patch(SETTINGS_ID)
      .setIfMissing({selectedWorks: []})
      .append('selectedWorks', [{_key: `ref-${DOC_ID}`, _type: 'reference', _ref: DOC_ID}])
      .commit()
    console.log(`settings       ${SETTINGS_ID} — added ${DOC_ID} to selectedWorks`)
  } else {
    console.log(`settings       ${SETTINGS_ID} — ${DOC_ID} already in selectedWorks`)
  }

  console.log('---')
  console.log(`Document ID:     ${DOC_ID}`)
  console.log(`Assets uploaded: ${uploaded}`)
  console.log(`Assets reused:   ${reused}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
