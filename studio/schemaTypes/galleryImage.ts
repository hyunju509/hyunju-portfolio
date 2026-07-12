import {defineField, defineType} from 'sanity'

/**
 * One image inside a project gallery.
 * Order is controlled by dragging items in the gallery array —
 * there is no numeric order field on purpose.
 */
export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description:
        'The hotspot (crop tool) marks the important visible part of the image. Cropping is non-destructive — the original file is never changed.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe the architectural content (e.g. "Long section through the gabion terraces"), not the filename. Required for accessibility.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption shown under the image on the website.',
    }),
    defineField({
      name: 'objectPosition',
      title: 'Object position (advanced)',
      type: 'string',
      description:
        'Optional CSS object-position override for layouts that crop, e.g. "50% 30%". Leave empty for default.',
    }),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the public website.',
    }),
  ],
  preview: {
    select: {media: 'image', title: 'alt', subtitle: 'caption'},
  },
})
