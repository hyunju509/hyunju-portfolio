import {defineField, defineType} from 'sanity'

/**
 * Singleton: the single source of truth for which projects appear in
 * Selected Works vs More Work on the homepage, and their order.
 * Only one document of this type exists (enforced in sanity.config.ts
 * and structure/index.ts).
 */
export const homepageSettings = defineType({
  name: 'homepageSettings',
  title: 'Homepage Order',
  type: 'document',
  fields: [
    defineField({
      name: 'selectedWorks',
      title: 'Selected Works',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'project'}]}],
      description:
        'Top-tier projects, in homepage order. Drag to reorder. A project listed here must not also be in More Work.',
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'moreWorks',
      title: 'More Work',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'project'}]}],
      description: 'Lower-tier / earlier projects, in homepage order. Drag to reorder.',
      validation: (rule) =>
        rule.unique().custom((moreWorks, context) => {
          const selected = (context.document?.selectedWorks ?? []) as {_ref?: string}[]
          const selectedIds = new Set(selected.map((r) => r._ref))
          const dup = (moreWorks ?? []).find((r: any) => selectedIds.has(r._ref))
          return dup ? 'A project cannot be in both Selected Works and More Work.' : true
        }),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Homepage Order'}),
  },
})
