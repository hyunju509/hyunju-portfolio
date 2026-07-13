import {defineField, defineType} from 'sanity'
import {BulkImageArrayInput} from '../components/BulkImageArrayInput'

/** One Observations location (Places). Gallery order is authoritative. */
export const place = defineType({
  name: 'place',
  title: 'Place',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Location name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'country', title: 'Country', type: 'string'}),
    defineField({name: 'region', title: 'Region', type: 'string'}),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on site',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to hide this location (and its filter button) from the public site.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Position of this location among the filters and the grid (1 = first).',
    }),
    defineField({
      name: 'gallery',
      title: 'Photographs',
      type: 'array',
      of: [{type: 'obsImage'}],
      options: {layout: 'grid'},
      components: {input: BulkImageArrayInput},
      description:
        'Display order — drag tiles to reorder. Drop multiple files above to bulk-upload. A location may be empty (filter still appears).',
    }),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the website.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'gallery.0.image', gallery: 'gallery', showOnSite: 'showOnSite'},
    prepare({title, media, gallery, showOnSite}) {
      const count = Array.isArray(gallery) ? gallery.length : 0
      return {
        title,
        media,
        subtitle: `${count} photograph${count === 1 ? '' : 's'}${showOnSite === false ? ' · HIDDEN' : ''}`,
      }
    },
  },
})
