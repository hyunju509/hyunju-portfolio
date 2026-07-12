import {defineField, defineType} from 'sanity'

/** Singleton: all editable About-page content. Factual accuracy is
 *  critical — do not invent employment, licenses, dates, or roles. */
export const aboutSettings = defineType({
  name: 'aboutSettings',
  title: 'About',
  type: 'document',
  fields: [
    defineField({
      name: 'introduction',
      title: 'Introduction paragraphs',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      description: 'The bio paragraphs at the top of the About page, in order.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'location',
      title: 'Location line',
      type: 'string',
      description: 'e.g. "New York, NY".',
    }),
    defineField({
      name: 'email',
      title: 'Contact email',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'credential',
      title: 'Credential',
      type: 'object',
      fields: [
        defineField({name: 'name', title: 'Name', type: 'string'}),
        defineField({name: 'date', title: 'Date', type: 'string', description: 'e.g. "2026.06".'}),
      ],
    }),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'ledgerRow',
          fields: [
            defineField({name: 'key', title: 'Period / label', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'main', title: 'Main lines', type: 'array', of: [{type: 'string'}], validation: (r) => r.required().min(1)}),
            defineField({name: 'detail', title: 'Detail lines', type: 'array', of: [{type: 'string'}]}),
          ],
          preview: {select: {title: 'key', main: 'main'}, prepare: ({title, main}) => ({title, subtitle: (main ?? [])[0]})},
        },
      ],
    }),
    defineField({
      name: 'selectedProjects',
      title: 'Selected Projects (experience entries)',
      type: 'array',
      description:
        'Technical experience bullets shown on About. Separate from the Projects documents — do not paste full project descriptions here.',
      of: [
        {
          type: 'object',
          name: 'ledgerRow',
          fields: [
            defineField({name: 'key', title: 'Project / label', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'main', title: 'Main lines', type: 'array', of: [{type: 'string'}], validation: (r) => r.required().min(1)}),
            defineField({name: 'detail', title: 'Detail lines', type: 'array', of: [{type: 'text', rows: 2}]}),
          ],
          preview: {select: {title: 'key', main: 'main'}, prepare: ({title, main}) => ({title, subtitle: (main ?? [])[0]})},
        },
      ],
    }),
    defineField({
      name: 'awards',
      title: 'Awards & exhibitions',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'awardRow',
          fields: [
            defineField({name: 'key', title: 'Date', type: 'string', description: 'e.g. "2024.07".'}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'detail', title: 'Detail', type: 'string'}),
            defineField({name: 'url', title: 'Link', type: 'url', validation: (r) => r.uri({scheme: ['http', 'https']})}),
          ],
          preview: {select: {title: 'title', subtitle: 'key'}},
        },
      ],
    }),
    defineField({
      name: 'skillGroups',
      title: 'Skills groups',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'skillGroup',
          fields: [
            defineField({name: 'title', title: 'Group title', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'items', title: 'Items', type: 'array', of: [{type: 'string'}], validation: (r) => r.required().min(1)}),
          ],
          preview: {select: {title: 'title', items: 'items'}, prepare: ({title, items}) => ({title, subtitle: (items ?? []).join(' · ')})},
        },
      ],
    }),
    defineField({name: 'portrait', title: 'Portrait', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'cvUrl',
      title: 'CV download link',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}),
    }),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the website.',
    }),
  ],
  preview: {prepare: () => ({title: 'About'})},
})
