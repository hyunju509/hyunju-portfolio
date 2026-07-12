/**
 * Final CMS migration import: Writing, Places, Image Studies, About,
 * Site Settings, Book.
 *
 * Run from the studio/ directory:
 *   npx sanity exec scripts/import-content.ts --with-user-token
 *
 * Idempotent: deterministic IDs, filename-based asset reuse, guarded
 * draft handling. Sources (no invented content):
 * - src/data/writing.ts      — article metadata/summaries/intros (bodies are
 *   provisional placeholders and are NOT migrated; articles become DRAFTS)
 * - src/data/observations.ts — places, image studies, featured picks
 * - src/pages/about.astro    — About arrays (copied verbatim below)
 * - src/components/*.astro / BaseLayout.astro — site settings strings
 */
import {getCliClient} from 'sanity/cli'
import {createReadStream, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {resolve, dirname, basename} from 'node:path'
import {ARTICLES} from '../../src/data/writing'
import {
  OBSERVATION_LOCATIONS,
  IMAGE_STUDIES,
  IMAGE_STUDY_CATEGORIES,
} from '../../src/data/observations'

const API_VERSION = '2026-07-01'
const PUBLIC_DIR = resolve(process.cwd(), '..', 'public')
const MANIFEST_PATH = resolve(process.cwd(), '..', 'docs', 'sanity-cms', 'content-migration-manifest.json')

const client = getCliClient({apiVersion: API_VERSION})

let uploaded = 0
let reused = 0

async function uploadImage(publicPath: string): Promise<string> {
  const abs = resolve(PUBLIC_DIR, `.${publicPath}`)
  if (!existsSync(abs)) throw new Error(`Missing local image: ${abs}`)
  const fn = basename(publicPath)
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $fn][0]._id`,
    {fn},
  )
  if (existing) {
    reused++
    return existing
  }
  const asset = await client.assets.upload('image', createReadStream(abs), {filename: fn})
  uploaded++
  return asset._id
}

const imageRef = (assetId: string) => ({_type: 'image', asset: {_type: 'reference', _ref: assetId}})
const pad2 = (n: number) => String(n).padStart(2, '0')

function block(style: string, text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `${key}s`, text, marks: []}],
  }
}

/* ============ 1. WRITING (drafts) + Writing Order ============ */
async function importWriting() {
  const states: Record<string, string> = {}
  for (const a of ARTICLES) {
    const id = `writing-${a.slug}`
    const published = await client.getDocument(id)
    if (published) {
      states[a.slug] = 'published-exists-untouched'
      continue
    }
    const body = [
      ...a.introduction.map((p, i) => block('normal', p, `intro${i + 1}`)),
      ...a.sections.flatMap((s, i) => [
        block('h2', s.heading, `sec${i + 1}h`),
        ...(s.subheading ? [block('h3', s.subheading, `sec${i + 1}b`)] : []),
      ]),
    ]
    await client.createOrReplace({
      _id: `drafts.${id}`,
      _type: 'writing',
      title: a.title,
      slug: {_type: 'slug', current: a.slug},
      subtitle: a.subtitle,
      articleType: a.type,
      institution: a.institution,
      year: a.year,
      summary: a.summary,
      body,
      ...(a.externalLink
        ? {
            externalUrl: a.externalLink.url,
            externalUrlLabel: a.externalLink.label,
            externalUrlCredit: a.externalLink.credit,
          }
        : {}),
      ...(a.slug === 'the-invisible-layers' ? {collaborators: ['The Green Team']} : {}),
      showOnSite: true,
      featured: false,
      note: 'Imported as a DRAFT: section bodies in the legacy registry were provisional placeholders. Paste the real essay text into Body (headings are prepared), then Publish.',
    })
    states[a.slug] = 'draft-created'
  }
  await client.createOrReplace({
    _id: 'writingOrder',
    _type: 'writingOrder',
    articles: ARTICLES.map((a) => ({
      _key: `ref-writing-${a.slug}`,
      _type: 'reference',
      _ref: `writing-${a.slug}`,
      _weak: true,
    })),
  })
  console.log(`writing: ${Object.values(states).filter((s) => s.startsWith('draft')).length} drafts, order singleton set`)
  return states
}

/* ============ 2. PLACES ============ */
const FEATURED_PLACES_PICKS = [
  {slug: 'japan', seq: 1},
  {slug: 'japan', seq: 30},
  {slug: 'los-angeles', seq: 1},
  {slug: 'los-angeles', seq: 5},
  {slug: 'las-vegas', seq: 3},
  {slug: 'las-vegas', seq: 8},
  {slug: 'new-york', seq: 1},
  {slug: 'new-york', seq: 3},
]

async function importPlaces() {
  const assetBySlugSeq: Record<string, string> = {}
  const counts: Record<string, number> = {}
  let order = 0
  for (const loc of OBSERVATION_LOCATIONS) {
    order++
    const gallery = []
    for (const img of loc.images) {
      const assetId = await uploadImage(img.full)
      assetBySlugSeq[`${loc.slug}-${img.seq}`] = assetId
      gallery.push({
        _key: `${loc.slug}-${pad2(img.seq)}`,
        _type: 'obsImage',
        image: imageRef(assetId),
        alt: `${loc.title} — photograph ${img.seq} of ${loc.imageCount}`,
        homepageFeatured: FEATURED_PLACES_PICKS.some((p) => p.slug === loc.slug && p.seq === img.seq),
      })
    }
    await client.createOrReplace({
      _id: `place-${loc.slug}`,
      _type: 'place',
      title: loc.title,
      slug: {_type: 'slug', current: loc.slug},
      showOnSite: true,
      displayOrder: order,
      gallery,
    })
    counts[loc.slug] = gallery.length
    console.log(`place-${loc.slug}: ${gallery.length} photographs`)
  }
  return {assetBySlugSeq, counts}
}

/* ============ 3. IMAGE STUDIES ============ */
const FEATURED_STUDY_IDS = [
  'material-experiments-01',
  'material-experiments-03',
  'material-experiments-04',
  'material-experiments-05',
  'spatial-images-01',
  'spatial-images-08',
  'spatial-images-16',
  'spatial-images-25',
]
const DISCLOSURE =
  'AI-assisted studies exploring material behavior, atmosphere, and speculative spatial conditions.'

async function importImageStudies() {
  const assetByStudyId: Record<string, string> = {}
  const counts: Record<string, number> = {}
  let order = 0
  for (const cat of IMAGE_STUDY_CATEGORIES) {
    order++
    const items = IMAGE_STUDIES.filter((s) => s.category === cat.slug)
    const gallery = []
    for (const item of items) {
      const assetId = await uploadImage(item.full)
      assetByStudyId[item.id] = assetId
      gallery.push({
        _key: `${cat.slug}-${pad2(item.seq)}`,
        _type: 'obsImage',
        image: imageRef(assetId),
        alt: item.label,
        sequenceLabel: item.label,
        homepageFeatured: FEATURED_STUDY_IDS.includes(item.id),
      })
    }
    await client.createOrReplace({
      _id: `image-study-${cat.slug}`,
      _type: 'imageStudyCollection',
      title: cat.title,
      slug: {_type: 'slug', current: cat.slug},
      category: cat.slug,
      description: cat.description,
      disclosure: DISCLOSURE,
      showOnSite: true,
      displayOrder: order,
      gallery,
    })
    counts[cat.slug] = gallery.length
    console.log(`image-study-${cat.slug}: ${gallery.length} images`)
  }
  return {assetByStudyId, counts}
}

/* ============ 4. ABOUT (verbatim from src/pages/about.astro) ============ */
async function importAbout() {
  const k = (p: string, i: number) => ({_key: `${p}${i + 1}`})
  await client.createOrReplace({
    _id: 'aboutSettings',
    _type: 'aboutSettings',
    introduction: [
      'Hyunju Kim is an architectural designer based in New York whose work moves across architecture, landscape, and environmental systems. Her work explores how climate, material cycles, and patterns of occupation can become spatial and technical strategies across building and landscape scales.',
      'Her process combines design development in Revit and Rhino with environmental analysis, computational workflows, visualization, and architectural documentation. Recent work ranges from mixed use towers and adaptive housing to flood infrastructure and environmental research archives.',
      'She holds an M.S. in Advanced Architectural Design from Columbia GSAPP, a B.Arch from Kookmin University, and the LEED AP BD+C credential.',
    ],
    location: 'New York, NY',
    email: 'hyunju.kim.0509@gmail.com',
    credential: {name: 'LEED AP BD+C', date: '2026.06'},
    education: [
      {...k('edu', 0), _type: 'ledgerRow', key: '2025.05 — 2026.05', main: ['Columbia University GSAPP', 'M.S. Advanced Architectural Design', 'New York, United States'], detail: ['High Pass Studio Work:', 'Fluid Terrain', 'Shadow Archive', 'Ivanpah Solar Sanctuary']},
      {...k('edu', 1), _type: 'ledgerRow', key: '2019.03 — 2025.02', main: ['Kookmin University', 'B.Arch, Architectural Design', 'Seoul, Korea'], detail: ['GPA 4.26 / 4.5', 'Graduated 2nd in Class']},
      {...k('edu', 2), _type: 'ledgerRow', key: '2021 — 2022', main: ['RMIT University', 'Exchange Program in Architecture', 'Melbourne, Australia']},
    ],
    selectedProjects: [
      {...k('exp', 0), _type: 'ledgerRow', key: 'Calibrated Environment', main: ['New York, NY', 'Mixed Use Tower · Revit + Ladybug'], detail: ['Conducted daylight and thermal comfort analysis in Ladybug to inform the building envelope, setbacks, and terrace strategies.', 'Translated environmental analysis into massing diagrams, facade studies, and design development documentation.', 'Produced Revit plans, sections, elevations, facade studies, and residential layouts.']},
      {...k('exp', 1), _type: 'ledgerRow', key: 'Fluid Terrain', main: ['Santa Paula Creek, CA', 'Hydrological Landscape Infrastructure · Material Ecology + Passive Cooling'], detail: ['Designed a landscape system that adapts to flooding through gabion foundations, terraced ground, and porous infrastructure.', 'Synthesized hydrological sections connecting water flow, material cycles, passive cooling, and seasonal public use.', 'Visualized ecological performance through 3D views, assembly studies, and detail drawings.']},
      {...k('exp', 2), _type: 'ledgerRow', key: 'Ordinary Village: Hide and Seek', main: ['Seoul, Korea', 'Interactive Residential Village · Adaptive Domestic Space'], detail: ['Designed a residential village using movable partitions and shifting boundaries to negotiate privacy and shared space.', 'Studied interior reconfiguration through tilting walls, rotating columns, and sensor responsive elements.', 'Produced plans, sections, interior diagrams, and renderings showing flexible domestic layouts.']},
      {...k('exp', 3), _type: 'ledgerRow', key: 'Surreal Museum Tower', main: ['New York, NY', 'Vertical Museum Prototype · Spatial Sequence + Facade Study'], detail: ['Designed a vertical museum integrated into a commercial tower in Times Square.', 'Developed nonlinear circulation sequences and floor plans connecting museum, public, and commercial programs.', 'Produced sectional drawings, layered moiré facade studies, and presentation renderings.']},
      {...k('exp', 4), _type: 'ledgerRow', key: 'Shadow Archive: Inverse Preserve', main: ['Churchill, Canada', 'Environmental Research Archive · Climate Research + Sectional Design'], detail: ['Proposed a distributed network of Arctic research outposts responding to permafrost thaw, solar exposure, and ultraviolet and infrared environmental fields.', 'Tested roof geometries and shadow zones to mediate solar exposure and ground thaw conditions.', 'Generated sectional drawings and environmental diagrams connecting archives, habitats, and climate responsive occupation.']},
    ],
    awards: [
      {...k('aw', 0), _type: 'awardRow', key: '2026.05', title: 'GSAPP End of Year Show', detail: 'Fluid Terrain'},
      {...k('aw', 1), _type: 'awardRow', key: '2025.07', title: 'Climate - Models - Images, New York', detail: 'Ivanpah Solar Sanctuary'},
      {...k('aw', 2), _type: 'awardRow', key: '2024.07', title: 'Sensory Museum 2024 — Honorable Mention', detail: 'Surreal Museum Tower', url: 'https://www.archiol.org/result/sensory-museum-2024'},
      {...k('aw', 3), _type: 'awardRow', key: '2022.11', title: 'Fondation Jacques Rougerie — Focus Prize', detail: 'Space Urchin · Architecture and Innovation for Space', url: 'https://www.fondation-jacques-rougerie.com/en/news-and-events/2022-prize-list/'},
      {...k('aw', 4), _type: 'awardRow', key: '2021.02', title: 'Sejong National Pilot Smart City Design Competition', detail: '5th Prize'},
      {...k('aw', 5), _type: 'awardRow', key: '2019.12', title: 'Dokdo Guesthouse Design International Competition', detail: 'Excellence Award'},
    ],
    skillGroups: [
      {...k('sk', 0), _type: 'skillGroup', title: 'Modeling & BIM', items: ['Rhinoceros', 'Revit', 'AutoCAD']},
      {...k('sk', 1), _type: 'skillGroup', title: 'Computation & Analysis', items: ['Grasshopper', 'Python', 'QGIS', 'Ladybug', 'CFD Simulation']},
      {...k('sk', 2), _type: 'skillGroup', title: 'Visualization', items: ['V-Ray', 'D5 Render', 'Enscape', 'Unreal Engine']},
      {...k('sk', 3), _type: 'skillGroup', title: 'Adobe Suite', items: ['Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro']},
      {...k('sk', 4), _type: 'skillGroup', title: 'Fabrication', items: ['Laser Cutting', '3D Printing', 'Digital Fabrication']},
      {...k('sk', 5), _type: 'skillGroup', title: 'Additional', items: ['Environmental Analysis', 'Diagramming', 'Presentation Layouts']},
    ],
  })
  console.log('aboutSettings: set')
}

/* ============ 5. SITE SETTINGS ============ */
async function importSiteSettings(
  assetBySlugSeq: Record<string, string>,
  assetByStudyId: Record<string, string>,
) {
  const ogAssetId = await uploadImage('/images/social/hyunju-kim-homepage-og.jpg')
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    homepageIntroduction: 'Architecture shaped by climate, material cycles,\nand changing ways of living.',
    professionalTitle: 'Architectural Designer',
    credentialLine: 'LEED AP BD+C',
    email: 'hyunju.kim.0509@gmail.com',
    navLabels: {work: 'Work', book: 'Book', about: 'About', observations: 'Observations', email: 'Email'},
    seoDefaultTitle: 'Hyunju Kim — Architectural Designer',
    seoDefaultDescription: 'Architecture shaped by climate, material cycles, and changing ways of living.',
    canonicalBaseUrl: 'https://www.hj-kim.com',
    defaultSocialImage: imageRef(ogAssetId),
    defaultSocialImageAlt: 'Hyunju Kim architectural portfolio homepage featuring selected projects',
    observationsIntro: 'Photographs, places, and image studies gathered through living, studying, traveling, and making.',
    placesLabel: 'Places',
    placesIntro: 'Photographs from cities lived in, studied in, and visited.',
    writingLabel: 'Writing',
    writingIntro: 'Research essays, interactive data studies, and urban field notes.',
    imageStudiesLabel: 'Image Studies',
    imageStudiesIntro: DISCLOSURE,
    homeObservationsIntro: 'Photographs, places, and AI-assisted image studies gathered through travel, observation, and iterative making.',
    featuredPlaces: FEATURED_PLACES_PICKS.map((p, i) => ({
      _key: `fp${i + 1}`,
      _type: 'featuredPlaceImage',
      place: {_type: 'reference', _ref: `place-${p.slug}`},
      image: imageRef(assetBySlugSeq[`${p.slug}-${p.seq}`]),
    })),
    featuredImageStudies: FEATURED_STUDY_IDS.map((id, i) => {
      const cat = id.startsWith('material') ? 'material-experiments' : 'spatial-images'
      return {
        _key: `fs${i + 1}`,
        _type: 'featuredStudyImage',
        collection: {_type: 'reference', _ref: `image-study-${cat}`},
        image: imageRef(assetByStudyId[id]),
      }
    }),
  })
  console.log('siteSettings: set (incl. OG image + 8 + 8 featured)')
}

/* ============ 6. BOOK ============ */
async function importBook() {
  /* The current PDF is ~76MB. It stays on Vercel hosting (site-relative
     path) rather than the Sanity CDN to avoid free-tier bandwidth risk;
     editors can still replace it by uploading a file in Book Settings. */
  await client.createOrReplace({
    _id: 'bookSettings',
    _type: 'bookSettings',
    title: 'Portfolio',
    pdfSourceUrl: '/documents/Hyunju_Kim_Portfolio.pdf',
    downloadFilename: 'Hyunju_Kim_Portfolio.pdf',
    showDownloadLink: false,
    note: 'PDF served from the website host (public/documents). Upload a file above only if you accept Sanity CDN bandwidth usage for a ~76MB document.',
  })
  console.log('bookSettings: set (PDF stays on site hosting)')
}

async function main() {
  if (!client.config().token) {
    console.error('Run with: npx sanity exec scripts/import-content.ts --with-user-token')
    process.exit(1)
  }
  const writingStates = await importWriting()
  const places = await importPlaces()
  const studies = await importImageStudies()
  await importAbout()
  await importSiteSettings(places.assetBySlugSeq, studies.assetByStudyId)
  await importBook()

  const manifest = {
    generatedAt: new Date().toISOString(),
    phase: 'final-content-migration',
    writing: writingStates,
    placeImageCounts: places.counts,
    imageStudyCounts: studies.counts,
    totals: {assetsUploaded: uploaded, assetsReused: reused},
  }
  mkdirSync(dirname(MANIFEST_PATH), {recursive: true})
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log('---')
  console.log(`assets uploaded: ${uploaded} · reused: ${reused}`)
  console.log(`manifest: ${MANIFEST_PATH}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
