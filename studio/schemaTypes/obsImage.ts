import {defineField, defineType} from 'sanity'

/** One photograph / study image inside a Places or Image Studies gallery.
 *  Array order is authoritative — drag to reorder. */
export const obsImage = defineType({
  name: 'obsImage',
  title: 'Gallery image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description: 'The hotspot controls square-thumbnail cropping. Non-destructive.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Neutral factual description (e.g. "Japan — photograph 3 of 41").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption. Not currently rendered; kept for future use.',
    }),
    defineField({
      name: 'sequenceLabel',
      title: 'Sequence label',
      type: 'string',
      description: 'Optional label shown on hover (Image Studies), e.g. "Spatial Images · 02 / 31".',
    }),
    defineField({
      name: 'homepageFeatured',
      title: 'Homepage featured',
      type: 'boolean',
      initialValue: false,
      description:
        'Marks this image as one of the homepage Observations picks. The authoritative homepage selection and order live in Site Settings → Homepage Observations preview.',
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
    select: {media: 'image', title: 'alt', subtitle: 'sequenceLabel'},
    prepare({media, title, subtitle}) {
      /* Bulk uploads write temporary alts like "Japan, image 05" —
         flag them until reviewed. */
      const temp = /, image \d+$/.test(title ?? '')
      return {
        media,
        title: temp ? `⚠ ${title}` : title,
        subtitle: temp ? 'Temporary alt — review' : subtitle,
      }
    },
  },
})
