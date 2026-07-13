import {defineField, defineType} from 'sanity'
import {DropImageInput} from '../components/DropImageInput'

/** Singleton: the Book (PDF portfolio) source and metadata.
 *  The PDF.js viewer itself is code and stays unchanged. */
export const bookSettings = defineType({
  name: 'bookSettings',
  title: 'Book',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Viewer heading label, e.g. "Portfolio".',
    }),
    defineField({
      name: 'pdfFile',
      title: 'PDF file (optional upload)',
      type: 'file',
      options: {accept: 'application/pdf'},
      description:
        'Upload a PDF here to replace the book without editing code. If empty, the site uses the PDF source URL below. Note: the current portfolio PDF is ~76MB — uploaded files are served from the Sanity CDN and count against its bandwidth.',
    }),
    defineField({
      name: 'pdfSourceUrl',
      title: 'PDF source URL',
      type: 'string',
      description:
        'Used when no file is uploaded above. A site-relative path (e.g. "/documents/Hyunju_Kim_Portfolio.pdf") or a full https URL.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasFile = Boolean((context.document as any)?.pdfFile?.asset)
          if (!value && !hasFile) return 'Provide either an uploaded PDF file or a source URL.'
          if (value && !/^(\/|https:\/\/)/.test(value)) return 'Must start with "/" or "https://".'
          return true
        }),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      components: {input: DropImageInput},
    }),
    defineField({
      name: 'downloadFilename',
      title: 'Download filename',
      type: 'string',
      description: 'Suggested filename if a download link is shown.',
    }),
    defineField({
      name: 'pageCount',
      title: 'Page count (informational)',
      type: 'number',
      description: 'Informational only — the build counts pages from the actual PDF.',
    }),
    defineField({
      name: 'showDownloadLink',
      title: 'Show download link',
      type: 'boolean',
      initialValue: false,
      description: 'Reserved for a future download link. The current viewer does not render one.',
    }),
    defineField({
      name: 'note',
      title: 'Internal note',
      type: 'text',
      rows: 2,
      description: 'For editors only — never rendered on the website.',
    }),
  ],
  preview: {prepare: () => ({title: 'Book'})},
})
