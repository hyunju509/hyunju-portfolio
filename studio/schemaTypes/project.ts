import {defineField, defineType} from 'sanity'
import {BulkImageArrayInput} from '../components/BulkImageArrayInput'
import {DropImageInput} from '../components/DropImageInput'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  description:
    'A portfolio project. While this document is a Draft it does not appear publicly; pressing Publish makes it eligible for the public site.',
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
      description: 'URL identifier, e.g. "fluid-terrain". Generate it from the title.',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'string'}),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'Display year, e.g. "2026".',
    }),
    defineField({
      name: 'period',
      title: 'Period',
      type: 'string',
      description: 'e.g. "2026 Spring · Columbia GSAPP".',
    }),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'program', title: 'Program', type: 'string'}),
    defineField({
      name: 'projectType',
      title: 'Project type',
      type: 'string',
      description: 'Short type label shown on cards, e.g. "Landscape Infrastructure".',
    }),
    defineField({
      name: 'cardMeta',
      title: 'Card caption',
      type: 'string',
      description:
        'The exact one-line caption under the homepage card and expansion title, e.g. "2026 · Landscape Infrastructure". Shown verbatim.',
    }),
    defineField({
      name: 'metaRows',
      title: 'Metadata rows',
      type: 'array',
      description:
        'The labeled rows shown in the expanded project panel, in display order — drag to reorder. Labels vary per project (Period/Year, Program/Type, Focus, Material Logic, Credits, Role, Keywords).',
      of: [
        {
          type: 'object',
          name: 'metaRow',
          title: 'Row',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        },
      ],
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'string',
      description: 'e.g. "Individual · Instructor Marc Tsurumaki". Keep team credits accurate.',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'text',
      rows: 2,
      description: 'Your role on team projects. Leave empty for individual work.',
    }),
    defineField({
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Ordered list of collaborator names, if any.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 3,
      description: 'The 1–3 sentence summary used on cards and previews.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Full description',
      type: 'text',
      rows: 8,
      description: 'Longer project text for the project page. Optional.',
    }),
    defineField({
      name: 'keyContributions',
      title: 'Key contributions',
      type: 'array',
      of: [{type: 'text', rows: 2}],
      description: 'Ordered list of your key contributions (used on More Work projects).',
    }),
    defineField({
      name: 'recognition',
      title: 'Recognition',
      type: 'string',
      description: 'Award or prize line, e.g. "Fondation Jacques Rougerie · Focus Prize · 2022".',
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Ordered keywords, e.g. "Flood Mitigation".',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Optional link (publication, video, award page).',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on site',
      type: 'boolean',
      initialValue: true,
      description:
        'Turn off to hide an already published project from the public site without unpublishing it.',
    }),
    defineField({
      name: 'homepageThumbnail',
      title: 'Homepage thumbnail',
      type: 'image',
      options: {hotspot: true},
      components: {input: DropImageInput},
      description:
        'Card image on the homepage. Required for any project placed in Homepage Order. The hotspot controls which part stays visible when the card crops it.',
      validation: (rule) =>
        rule.custom(async (value, context) => {
          if (value) return true
          const client = context.getClient({apiVersion: '2026-07-01'})
          const id = context.document?._id?.replace(/^drafts\./, '')
          if (!id) return true
          const usedOnHomepage = await client.fetch(
            `defined(*[_type == "homepageSettings" && (references($id))][0])`,
            {id},
          )
          return usedOnHomepage
            ? 'This project is used in Homepage Order, so it needs a homepage thumbnail.'
            : true
        }),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{type: 'galleryImage'}],
      options: {layout: 'grid'},
      components: {input: BulkImageArrayInput},
      description:
        'Project images in display order — drag tiles to reorder, click a tile to edit alt/caption. Drop multiple files above to bulk-upload.',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'object',
      description: 'Optional research film shown on the project page (YouTube).',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'youtubeId',
          title: 'YouTube video ID',
          type: 'string',
          description: 'The ID only, e.g. "fZWpxhrROCA" — not the full URL.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'poster',
          title: 'Poster image URL',
          type: 'url',
          validation: (rule) => rule.uri({scheme: ['https']}),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'homepageThumbnail',
      fallbackMedia: 'gallery.0.image',
      year: 'year',
      period: 'period',
      location: 'location',
      showOnSite: 'showOnSite',
    },
    prepare({title, media, fallbackMedia, year, period, location, showOnSite}) {
      const when = period || year
      const parts = [when, location].filter(Boolean)
      const hidden = showOnSite === false ? ' · HIDDEN from site' : ''
      return {
        title,
        media: media || fallbackMedia,
        subtitle: `${parts.join(' — ')}${hidden}`,
      }
    },
  },
})
