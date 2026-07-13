import {defineField, defineType} from 'sanity'
import {DropImageInput} from '../components/DropImageInput'

const featuredValidation = (label: string) => (rule: any) =>
  rule
    .custom((items: any[] | undefined) => {
      const list = items ?? []
      if (list.length !== 8) return `${label} must contain exactly 8 images (currently ${list.length}).`
      const assets = list.map((i) => i?.image?.asset?._ref).filter(Boolean)
      if (new Set(assets).size !== assets.length) return `${label} contains the same image twice.`
      return true
    })

/** Singleton: site-wide editable settings — homepage identity, contact,
 *  navigation labels, default SEO, Observations texts, and the homepage
 *  Observations preview selections (exactly 8 + 8). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    {name: 'homepage', title: 'Homepage'},
    {name: 'contact', title: 'Contact & Navigation'},
    {name: 'seo', title: 'SEO'},
    {name: 'observations', title: 'Observations'},
    {name: 'previews', title: 'Homepage Observations preview'},
  ],
  fields: [
    /* ---- homepage identity ---- */
    defineField({
      name: 'homepageIntroduction',
      title: 'Homepage introduction',
      type: 'text',
      rows: 2,
      group: 'homepage',
      description: 'The hero statement. Line breaks are preserved.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'professionalTitle',
      title: 'Professional title',
      type: 'string',
      group: 'homepage',
      description: 'e.g. "Architectural Designer" (shown in the header identity block).',
    }),
    defineField({
      name: 'credentialLine',
      title: 'Credential line',
      type: 'string',
      group: 'homepage',
      description: 'e.g. "LEED AP BD+C".',
    }),
    /* ---- contact & navigation ---- */
    defineField({
      name: 'email',
      title: 'Contact email',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'navLabels',
      title: 'Navigation labels',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({name: 'work', title: 'Work', type: 'string'}),
        defineField({name: 'book', title: 'Book', type: 'string'}),
        defineField({name: 'about', title: 'About', type: 'string'}),
        defineField({name: 'observations', title: 'Observations', type: 'string'}),
        defineField({name: 'email', title: 'Email', type: 'string'}),
      ],
    }),
    /* ---- SEO ---- */
    defineField({
      name: 'seoDefaultTitle',
      title: 'Default title',
      type: 'string',
      group: 'seo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoDefaultDescription',
      title: 'Default description',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'canonicalBaseUrl',
      title: 'Canonical base URL',
      type: 'url',
      group: 'seo',
      description: 'e.g. "https://www.hj-kim.com" — no trailing slash.',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'defaultSocialImage',
      title: 'Default social image',
      type: 'image',
      group: 'seo',
      description: 'Open Graph image (1200×630).',
      components: {input: DropImageInput},
    }),
    defineField({
      name: 'defaultSocialImageAlt',
      title: 'Default social image alt',
      type: 'string',
      group: 'seo',
    }),
    /* ---- observations texts ---- */
    defineField({
      name: 'observationsIntro',
      title: 'Observations page introduction',
      type: 'text',
      rows: 2,
      group: 'observations',
    }),
    defineField({
      name: 'placesLabel',
      title: 'Places section label',
      type: 'string',
      group: 'observations',
    }),
    defineField({
      name: 'placesIntro',
      title: 'Places section intro line',
      type: 'text',
      rows: 2,
      group: 'observations',
    }),
    defineField({
      name: 'writingLabel',
      title: 'Writing section label',
      type: 'string',
      group: 'observations',
    }),
    defineField({
      name: 'writingIntro',
      title: 'Writing section intro line',
      type: 'text',
      rows: 2,
      group: 'observations',
    }),
    defineField({
      name: 'imageStudiesLabel',
      title: 'Image Studies section label',
      type: 'string',
      group: 'observations',
    }),
    defineField({
      name: 'imageStudiesIntro',
      title: 'Image Studies section intro line (AI disclosure)',
      type: 'text',
      rows: 2,
      group: 'observations',
      description: 'Keep the AI-assisted disclosure accurate and visible.',
    }),
    defineField({
      name: 'homeObservationsIntro',
      title: 'Homepage Observations intro line',
      type: 'text',
      rows: 2,
      group: 'previews',
    }),
    /* ---- homepage observations preview selections ---- */
    defineField({
      name: 'featuredPlaces',
      title: 'Featured Places images (exactly 8)',
      type: 'array',
      group: 'previews',
      description:
        'Homepage Places preview — drag to reorder. Pick the location, then re-select one of its photographs from the media library (no re-upload).',
      of: [
        {
          type: 'object',
          name: 'featuredPlaceImage',
          fields: [
            defineField({
              name: 'place',
              title: 'Place',
              type: 'reference',
              to: [{type: 'place'}],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: {media: 'image', title: 'place.title'},
          },
        },
      ],
      validation: featuredValidation('Featured Places'),
    }),
    defineField({
      name: 'featuredImageStudies',
      title: 'Featured Image Studies (exactly 8, both categories)',
      type: 'array',
      group: 'previews',
      description:
        'Homepage Image Studies preview — drag to reorder. Include images from both categories.',
      of: [
        {
          type: 'object',
          name: 'featuredStudyImage',
          fields: [
            defineField({
              name: 'collection',
              title: 'Collection',
              type: 'reference',
              to: [{type: 'imageStudyCollection'}],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: {media: 'image', title: 'collection.title'},
          },
        },
      ],
      validation: (rule: any) =>
        rule.custom((items: any[] | undefined) => {
          const list = items ?? []
          if (list.length !== 8) return `Featured Image Studies must contain exactly 8 images (currently ${list.length}).`
          const assets = list.map((i) => i?.image?.asset?._ref).filter(Boolean)
          if (new Set(assets).size !== assets.length) return 'Featured Image Studies contains the same image twice.'
          const collections = new Set(list.map((i) => i?.collection?._ref).filter(Boolean))
          if (collections.size < 2) return 'Include images from both Image Study categories.'
          return true
        }),
    }),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the website.',
    }),
  ],
  preview: {prepare: () => ({title: 'Site Settings'})},
})
