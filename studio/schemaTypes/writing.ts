import {defineField, defineType} from 'sanity'

/**
 * One Writing article (research essay, data study, field notes).
 * Draft = not public. Publish makes it eligible; showOnSite can hide a
 * published article. There is deliberately no custom "published" boolean.
 */
export const writing = defineType({
  name: 'writing',
  title: 'Writing',
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
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'articleType',
      title: 'Article type',
      type: 'string',
      description: 'e.g. "Research Essay", "Urban Field Notes".',
    }),
    defineField({
      name: 'institution',
      title: 'Institution / context',
      type: 'string',
      description: 'e.g. "Columbia GSAPP".',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'Shown on the Writing index.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'coverImageAlt',
      title: 'Cover image alt text',
      type: 'string',
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.document as any)?.coverImage && !value
            ? 'Alt text is required when a cover image is set.'
            : true,
        ),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      description:
        'The article text. Use H2 for section headings, H3 for section subheadings. Blocks before the first H2 render as the introduction.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) => rule.uri({scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'references',
      title: 'Selected references',
      type: 'array',
      of: [{type: 'text', rows: 2}],
    }),
    defineField({
      name: 'publicationDate',
      title: 'Publication date',
      type: 'date',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Link to an interactive/external version of this work.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'externalUrlLabel',
      title: 'External link label',
      type: 'string',
      description: 'e.g. "View Interactive Research ↗".',
    }),
    defineField({
      name: 'externalUrlCredit',
      title: 'External link credit',
      type: 'string',
      description: 'e.g. "Team Project · The Green Team". Keep team attribution accurate.',
    }),
    defineField({
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Ordered collaborator/team names. Do not imply sole authorship of team work.',
    }),
    defineField({
      name: 'projectOrCourseContext',
      title: 'Project or course context',
      type: 'string',
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on site',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'seoTitle', title: 'SEO title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3}),
    defineField({name: 'socialImage', title: 'Social image', type: 'image'}),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the website.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'articleType', media: 'coverImage', showOnSite: 'showOnSite'},
    prepare({title, subtitle, media, showOnSite}) {
      return {title, media, subtitle: `${subtitle ?? ''}${showOnSite === false ? ' · HIDDEN' : ''}`}
    },
  },
})
