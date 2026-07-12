import type {StructureResolver} from 'sanity/structure'

/**
 * Desk structure: "Homepage Order" opens the one settings document
 * directly (no list, so no way to create a second one), followed by
 * the Projects list.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Homepage Order')
        .id('homepageSettings')
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings')
            .title('Homepage Order'),
        ),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
    ])
