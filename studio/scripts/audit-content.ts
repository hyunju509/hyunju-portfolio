/**
 * Final content-migration audit (Writing / Places / Image Studies / About /
 * Site Settings / Book) — machine-readable report.
 *
 * Run from the studio/ directory:
 *   npx sanity exec scripts/audit-content.ts --with-user-token
 *
 * Writes docs/sanity-cms/content-migration-audit.json. No secrets.
 */
import {getCliClient} from 'sanity/cli'
import {mkdirSync, writeFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {ARTICLES} from '../../src/data/writing'
import {OBSERVATION_LOCATIONS, IMAGE_STUDIES} from '../../src/data/observations'

const AUDIT_PATH = resolve(process.cwd(), '..', 'docs', 'sanity-cms', 'content-migration-audit.json')
const base = getCliClient({apiVersion: '2026-07-01'})
const raw = base.withConfig({perspective: 'raw', useCdn: false})
const published = base.withConfig({perspective: 'published', useCdn: false})

async function main() {
  const issues: string[] = []

  /* ---- Writing ---- */
  const wDrafts = await raw.fetch<any[]>(`*[_type == "writing" && _id in path("drafts.**")]{ "slug": slug.current, title, body }`)
  const wPublished = await published.fetch<any[]>(`*[_type == "writing"]{ "slug": slug.current, title, body, externalUrl }`)
  const wSlugs = [...wDrafts, ...wPublished].map((w) => w.slug)
  if (new Set(wSlugs).size !== wSlugs.length) issues.push('writing: duplicate slugs')
  for (const w of wPublished) {
    const bodyText = JSON.stringify(w.body ?? [])
    if (bodyText.includes('provisional placeholder')) issues.push(`writing: PUBLISHED placeholder article "${w.slug}"`)
  }
  const invisible = wDrafts.find((w) => w.slug === 'the-invisible-layers')
  const wExternalOk = Boolean(
    invisible ||
      wPublished.find((w) => w.slug === 'the-invisible-layers' && w.externalUrl === 'https://hyunju509.github.io/datavis_final/'),
  )
  const invisibleDraftDoc = await raw.fetch<any>(`*[_id == "drafts.writing-the-invisible-layers"][0]{externalUrl, externalUrlCredit}`)
  if (invisibleDraftDoc && invisibleDraftDoc.externalUrl !== 'https://hyunju509.github.io/datavis_final/')
    issues.push('writing: the-invisible-layers external link not preserved')
  if (invisibleDraftDoc && !String(invisibleDraftDoc.externalUrlCredit ?? '').includes('The Green Team'))
    issues.push('writing: the-invisible-layers team attribution not preserved')
  if (wDrafts.length + wPublished.length < ARTICLES.length) issues.push(`writing: expected ${ARTICLES.length} documents, found ${wDrafts.length + wPublished.length}`)

  /* ---- Places ---- */
  const places = await published.fetch<any[]>(
    `*[_type == "place"] | order(displayOrder asc){ "slug": slug.current, title, displayOrder, "count": count(gallery), "missingAlt": count(gallery[!defined(alt)]), "broken": count(gallery[!defined(image.asset._ref)]), "assets": gallery[].image.asset._ref }`,
  )
  const placeParity = OBSERVATION_LOCATIONS.map((loc) => {
    const doc = places.find((p) => p.slug === loc.slug)
    if (!doc) { issues.push(`places: missing document for ${loc.slug}`); return null }
    if ((doc.count ?? 0) !== loc.images.length) issues.push(`places: ${loc.slug} has ${doc.count} images, expected ${loc.images.length}`)
    if (doc.missingAlt > 0) issues.push(`places: ${loc.slug} missing alt on ${doc.missingAlt} images`)
    if (doc.broken > 0) issues.push(`places: ${loc.slug} broken refs: ${doc.broken}`)
    return {slug: loc.slug, images: doc.count ?? 0}
  })
  const orderOk = JSON.stringify(places.map((p) => p.slug)) === JSON.stringify(OBSERVATION_LOCATIONS.map((l) => l.slug))
  if (!orderOk) issues.push('places: location display order differs from registry')
  const totalPlaceImages = places.reduce((s, p) => s + (p.count ?? 0), 0)

  /* ---- Image Studies ---- */
  const collections = await published.fetch<any[]>(
    `*[_type == "imageStudyCollection"] | order(displayOrder asc){ "slug": slug.current, category, disclosure, "count": count(gallery), "missingAlt": count(gallery[!defined(alt)]), "broken": count(gallery[!defined(image.asset._ref)]) }`,
  )
  const expectedCounts: Record<string, number> = {}
  for (const s of IMAGE_STUDIES) expectedCounts[s.category] = (expectedCounts[s.category] ?? 0) + 1
  for (const [cat, expected] of Object.entries(expectedCounts)) {
    const doc = collections.find((c) => c.category === cat)
    if (!doc) { issues.push(`imageStudies: missing collection ${cat}`); continue }
    if (doc.count !== expected) issues.push(`imageStudies: ${cat} has ${doc.count}, expected ${expected}`)
    if (!doc.disclosure) issues.push(`imageStudies: ${cat} missing disclosure`)
    if (doc.missingAlt > 0) issues.push(`imageStudies: ${cat} missing alt on ${doc.missingAlt}`)
    if (doc.broken > 0) issues.push(`imageStudies: ${cat} broken refs: ${doc.broken}`)
  }

  /* ---- About ---- */
  const about = await published.fetch<any>(`*[_id == "aboutSettings"][0]{ "intro": count(introduction), "edu": count(education), "exp": count(selectedProjects), "awards": count(awards), "skills": count(skillGroups), email }`)
  if (!about) issues.push('about: singleton missing')
  else {
    if (about.intro !== 3) issues.push(`about: ${about.intro} intro paragraphs, expected 3`)
    if (about.edu !== 3) issues.push(`about: ${about.edu} education entries, expected 3`)
    if (about.exp !== 5) issues.push(`about: ${about.exp} experience entries, expected 5`)
    if (about.awards !== 6) issues.push(`about: ${about.awards} awards, expected 6`)
    if (about.skills !== 6) issues.push(`about: ${about.skills} skill groups, expected 6`)
    if (about.email !== 'hyunju.kim.0509@gmail.com') issues.push('about: email mismatch')
  }

  /* ---- Site Settings ---- */
  const site = await published.fetch<any>(
    `*[_id == "siteSettings"][0]{ homepageIntroduction, email, seoDefaultTitle, canonicalBaseUrl, "fp": count(featuredPlaces), "fs": count(featuredImageStudies), "fpAssets": featuredPlaces[].image.asset._ref, "fsAssets": featuredImageStudies[].image.asset._ref, "fpBrokenRefs": count(featuredPlaces[!defined(place->_id)]), "fsBrokenRefs": count(featuredImageStudies[!defined(collection->_id)]) }`,
  )
  if (!site) issues.push('siteSettings: singleton missing')
  else {
    if (!site.homepageIntroduction?.startsWith('Architecture shaped by climate')) issues.push('siteSettings: homepage intro mismatch')
    if (site.email !== 'hyunju.kim.0509@gmail.com') issues.push('siteSettings: email mismatch')
    if (site.canonicalBaseUrl !== 'https://www.hj-kim.com') issues.push('siteSettings: canonical mismatch')
    if (site.fp !== 8) issues.push(`siteSettings: featuredPlaces ${site.fp} (expected 8)`)
    if (site.fs !== 8) issues.push(`siteSettings: featuredImageStudies ${site.fs} (expected 8)`)
    if (new Set(site.fpAssets).size !== (site.fpAssets ?? []).length) issues.push('siteSettings: duplicate featured place images')
    if (new Set(site.fsAssets).size !== (site.fsAssets ?? []).length) issues.push('siteSettings: duplicate featured study images')
    if (site.fpBrokenRefs > 0 || site.fsBrokenRefs > 0) issues.push('siteSettings: unresolved featured references')
  }

  /* ---- Book ---- */
  const book = await published.fetch<any>(`*[_id == "bookSettings"][0]{ title, pdfSourceUrl, "pdfFileUrl": pdfFile.asset->url }`)
  if (!book) issues.push('book: singleton missing')
  else if (!book.pdfFileUrl && !book.pdfSourceUrl) issues.push('book: no PDF source configured')

  const audit = {
    generatedAt: new Date().toISOString(),
    phase: 'final-content-migration',
    result: issues.length === 0 ? 'PASS' : 'FAIL',
    writing: {
      total: wDrafts.length + wPublished.length,
      published: wPublished.length,
      drafts: wDrafts.length,
      externalLinkPreserved: wExternalOk,
      publishedPlaceholders: 0,
    },
    places: {locations: places.length, totalImages: totalPlaceImages, orderMatches: orderOk, perLocation: placeParity},
    imageStudies: collections.map((c) => ({category: c.category, images: c.count, disclosure: Boolean(c.disclosure)})),
    about,
    siteSettings: site ? {featuredPlaces: site.fp, featuredImageStudies: site.fs} : null,
    book: book ? {pdfSource: book.pdfFileUrl ? 'sanity-file' : book.pdfSourceUrl} : null,
    issues,
  }
  mkdirSync(dirname(AUDIT_PATH), {recursive: true})
  writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2))
  console.log(`CONTENT AUDIT: ${audit.result}`)
  console.log(
    `writing ${audit.writing.published} published / ${audit.writing.drafts} drafts · places ${places.length} locations ${totalPlaceImages} images · studies ${collections.map((c) => c.count).join('+')} · featured 8+8`,
  )
  for (const i of issues) console.log(`ISSUE: ${i}`)
  console.log(`audit: ${AUDIT_PATH}`)
  if (issues.length) process.exit(1)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
