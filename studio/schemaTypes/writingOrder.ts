import {defineField, defineType} from 'sanity'

/** Singleton: authoritative order of Writing articles on the index.
 *  Weak references so this document can stay published while individual
 *  articles remain drafts; the site shows only published, visible ones. */
export const writingOrder = defineType({
  name: 'writingOrder',
  title: 'Writing Order',
  type: 'document',
  fields: [
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'writing'}], weak: true}],
      description:
        'Index order — drag to reorder. Draft articles may be listed here but only published ones appear publicly.',
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {prepare: () => ({title: 'Writing Order'})},
})
