import {defineField, defineType} from 'sanity'

/** One Image Studies category (Material Experiments / Spatial Images).
 *  These are AI-assisted studies — the disclosure must stay visible. */
export const imageStudyCollection = defineType({
  name: 'imageStudyCollection',
  title: 'Image Study collection',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
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
    defineField({
      name: 'category',
      title: 'Category key',
      type: 'string',
      options: {
        list: [
          {title: 'Material Experiments', value: 'material-experiments'},
          {title: 'Spatial Images', value: 'spatial-images'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Shown in the category legend on the Observations page.',
    }),
    defineField({
      name: 'disclosure',
      title: 'AI-assistance disclosure',
      type: 'text',
      rows: 2,
      description:
        'These images are AI-assisted studies, not built projects, commissioned work, or photography. Keep this disclosure accurate and visible.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on site',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Position of this category among the legend and filters (1 = first).',
    }),
    defineField({
      name: 'gallery',
      title: 'Images',
      type: 'array',
      of: [{type: 'obsImage'}],
      description: 'Display order — drag to reorder.',
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
    select: {title: 'title', media: 'gallery.0.image', gallery: 'gallery'},
    prepare({title, media, gallery}) {
      const count = Array.isArray(gallery) ? gallery.length : 0
      return {title, media, subtitle: `${count} image${count === 1 ? '' : 's'} · AI-assisted`}
    },
  },
})
