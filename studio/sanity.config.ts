import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

/* Document types that must only ever exist as a single document. */
const SINGLETONS = ['homepageSettings', 'writingOrder', 'aboutSettings', 'siteSettings', 'bookSettings']

export default defineConfig({
  name: 'default',
  title: 'Hyunju Portfolio CMS',

  projectId,
  dataset,

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    /* Hide singletons from the global "create new document" menu. */
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global'
        ? prev.filter((tmpl) => !SINGLETONS.includes(tmpl.templateId))
        : prev,
    /* Singletons cannot be duplicated or deleted. */
    actions: (prev, {schemaType}) =>
      SINGLETONS.includes(schemaType)
        ? prev.filter(({action}) => action !== 'duplicate' && action !== 'delete')
        : prev,
  },
})
