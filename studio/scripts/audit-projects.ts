/**
 * Phase 2A migration audit — machine-readable report.
 *
 * Run from the studio/ directory:
 *   npx sanity exec scripts/audit-projects.ts --with-user-token
 *
 * Queries the published perspective, runs the same parity checks as the
 * /cms-preview pages (src/lib/sanity/compare.ts), plus global integrity
 * checks, and writes docs/sanity-cms/migration-audit.json. No secrets.
 */
import {getCliClient} from 'sanity/cli'
import {mkdirSync, writeFileSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {PROJECTS} from '../../src/data/projects'
import {buildProjectChecks, findPlacement} from '../../src/lib/sanity/compare'
import {ALL_PROJECTS, HOMEPAGE_SETTINGS} from '../../src/lib/sanity/queries'
import type {SanityProject, SanityHomepageSettings} from '../../src/lib/sanity/types'

const AUDIT_PATH = resolve(process.cwd(), '..', 'docs', 'sanity-cms', 'migration-audit.json')

async function main() {
  const base = getCliClient({apiVersion: '2026-07-01'})
  const client = base.withConfig({perspective: 'published', useCdn: false})

  const [cmsProjects, settings] = await Promise.all([
    client.fetch<SanityProject[]>(ALL_PROJECTS),
    client.fetch<SanityHomepageSettings | null>(HOMEPAGE_SETTINGS),
  ])

  const bySlug = new Map(cmsProjects.map((p) => [p.slug, p]))
  const tierA = PROJECTS.filter((p) => p.tier === 'A')
  const tierB = PROJECTS.filter((p) => p.tier === 'B')

  const projects = PROJECTS.map((local) => {
    const cms = bySlug.get(local.slug) ?? null
    const placement = findPlacement(settings, local.slug)
    const checks = buildProjectChecks(local, cms, placement)
    const failed = checks.filter((c) => !c.pass)
    return {
      documentId: `project-${local.slug}`,
      title: local.title,
      slug: local.slug,
      sourceImageCount: local.sheets.length,
      cmsImageCount: (cms?.gallery ?? []).length,
      placement: placement ? `${placement.section}[${placement.index}]` : null,
      comparison: failed.length === 0 ? 'PASS' : 'FAIL',
      checksPassed: checks.length - failed.length,
      checksTotal: checks.length,
      failedChecks: failed.map((f) => ({label: f.label, detail: f.detail})),
    }
  })

  /* Global integrity */
  const registrySlugs = new Set(PROJECTS.map((p) => p.slug))
  const extraCms = cmsProjects.filter((p) => !registrySlugs.has(p.slug)).map((p) => p.slug)
  const selSlugs = (settings?.selectedWorks ?? []).map((r) => r?.slug)
  const moreSlugs = (settings?.moreWorks ?? []).map((r) => r?.slug)
  const crossDup = selSlugs.filter((s) => moreSlugs.includes(s))
  const altErrors = cmsProjects.flatMap((p) =>
    (p.gallery ?? []).filter((g) => !g.alt).map((g) => `${p.slug}:${g._key}`),
  )
  const brokenImageRefs = cmsProjects.flatMap((p) =>
    (p.gallery ?? []).filter((g) => !g.image?.asset?._id).map((g) => `${p.slug}:${g._key}`),
  )
  const missingThumb = cmsProjects.filter((p) => !p.homepageThumbnail?.asset).map((p) => p.slug)
  const notPlaced = PROJECTS.filter((p) => !findPlacement(settings, p.slug)).map((p) => p.slug)
  const allAssetIds = cmsProjects.flatMap((p) => (p.gallery ?? []).map((g) => g.image.asset._id))
  const dupAssetsWithinProjects = cmsProjects.flatMap((p) => {
    const ids = (p.gallery ?? []).map((g) => g.image.asset._id)
    return ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `${p.slug}:${id}`)
  })

  const global = {
    totalRegistryProjects: PROJECTS.length,
    totalCmsProjects: cmsProjects.length,
    selectedWorksCount: selSlugs.length,
    moreWorksCount: moreSlugs.length,
    selectedWorksOrderMatches: JSON.stringify(selSlugs) === JSON.stringify(tierA.map((p) => p.slug)),
    moreWorksOrderMatches: JSON.stringify(moreSlugs) === JSON.stringify(tierB.map((p) => p.slug)),
    duplicateProjectDocuments: extraCms,
    projectsInBothSections: crossDup,
    projectsNotPlaced: notPlaced,
    unresolvedHomepageReferences:
      [...(settings?.selectedWorks ?? []), ...(settings?.moreWorks ?? [])].filter((r) => !r).length,
    missingRequiredAltText: altErrors,
    brokenImageReferences: brokenImageRefs,
    projectsMissingHomepageThumbnail: missingThumb,
    duplicateAssetsWithinGalleries: dupAssetsWithinProjects,
    totalGalleryAssetRefs: allAssetIds.length,
    uniqueAssets: new Set(allAssetIds).size,
  }

  const failures = projects.filter((p) => p.comparison !== 'PASS')
  const requiredResult =
    failures.length === 0 &&
    extraCms.length === 0 &&
    brokenImageRefs.length === 0 &&
    global.unresolvedHomepageReferences === 0 &&
    altErrors.length === 0 &&
    global.selectedWorksOrderMatches &&
    global.moreWorksOrderMatches &&
    crossDup.length === 0 &&
    notPlaced.length === 0

  const audit = {
    generatedAt: new Date().toISOString(),
    phase: '2A',
    perspective: 'published',
    result: requiredResult ? 'PASS' : 'FAIL',
    global,
    projects,
  }
  mkdirSync(dirname(AUDIT_PATH), {recursive: true})
  writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2))

  console.log(`AUDIT RESULT: ${audit.result}`)
  console.log(
    `projects ${cmsProjects.length}/${PROJECTS.length} · selected ${selSlugs.length} · more ${moreSlugs.length} · alt errors ${altErrors.length} · broken refs ${brokenImageRefs.length}`,
  )
  for (const p of failures) {
    console.log(`FAIL ${p.slug}: ${p.failedChecks.map((f) => f.label).join('; ')}`)
  }
  console.log(`audit: ${AUDIT_PATH}`)
  if (!requiredResult) process.exit(1)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
