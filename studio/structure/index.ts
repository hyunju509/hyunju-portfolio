import type {StructureResolver} from 'sanity/structure'

const singleton = (S: any, schemaType: string, title: string) =>
  S.listItem()
    .title(title)
    .id(schemaType)
    .child(S.document().schemaType(schemaType).documentId(schemaType).title(title))

/**
 * Desk structure. Singletons open their one document directly (no list,
 * so no way to create a second one); document types get plain lists.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singleton(S, 'homepageSettings', 'Homepage Order'),
      S.documentTypeListItem('project').title('Projects'),
      S.divider(),
      S.listItem()
        .title('Writing')
        .id('writingSection')
        .child(
          S.list()
            .title('Writing')
            .items([
              singleton(S, 'writingOrder', 'Writing Order'),
              S.divider(),
              S.documentTypeListItem('writing').title('Articles'),
            ]),
        ),
      S.documentTypeListItem('place').title('Places'),
      S.documentTypeListItem('imageStudyCollection').title('Image Studies'),
      S.divider(),
      singleton(S, 'aboutSettings', 'About'),
      singleton(S, 'siteSettings', 'Site Settings'),
      singleton(S, 'bookSettings', 'Book'),
    ])
