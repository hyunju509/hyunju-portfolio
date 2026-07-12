/* GROQ queries for the CMS pilot (Phase 1 + Phase 2A). */

const IMAGE_PROJECTION = `{
  asset->{ _id, url, originalFilename, metadata { dimensions { width, height, aspectRatio } } },
  hotspot,
  crop
}`;

const PROJECT_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  subtitle,
  cardMeta,
  metaRows[]{ _key, label, value },
  year,
  period,
  location,
  program,
  projectType,
  credits,
  role,
  collaborators,
  shortDescription,
  description,
  keywords,
  keyContributions,
  recognition,
  externalUrl,
  video{ title, youtubeId, poster },
  showOnSite,
  homepageThumbnail ${IMAGE_PROJECTION},
  gallery[]{
    _key,
    alt,
    caption,
    objectPosition,
    image ${IMAGE_PROJECTION}
  }
`;

export const PROJECT_BY_SLUG = `*[_type == "project" && slug.current == $slug][0]{${PROJECT_FIELDS}}`;

export const ALL_PROJECTS = `*[_type == "project"] | order(slug.current asc){${PROJECT_FIELDS}}`;

export const HOMEPAGE_SETTINGS = `*[_type == "homepageSettings" && _id == "homepageSettings"][0]{
  selectedWorks[]->{ _id, title, "slug": slug.current },
  moreWorks[]->{ _id, title, "slug": slug.current }
}`;

/* Homepage sections with fully expanded project documents, in singleton order. */
export const HOMEPAGE_PROJECTS = `*[_type == "homepageSettings" && _id == "homepageSettings"][0]{
  selectedWorks[]->{${PROJECT_FIELDS}},
  moreWorks[]->{${PROJECT_FIELDS}}
}`;

/* ---- Final content migration (Writing / Places / Image Studies / About / Site / Book) ---- */

const OBS_GALLERY = `gallery[]{
  _key,
  alt,
  caption,
  sequenceLabel,
  homepageFeatured,
  image ${IMAGE_PROJECTION}
}`;

export const ALL_PLACES = `*[_type == "place" && showOnSite != false] | order(displayOrder asc, title asc){
  _id,
  title,
  "slug": slug.current,
  displayOrder,
  ${OBS_GALLERY}
}`;

export const ALL_IMAGE_STUDY_COLLECTIONS = `*[_type == "imageStudyCollection" && showOnSite != false] | order(displayOrder asc, title asc){
  _id,
  title,
  "slug": slug.current,
  category,
  description,
  disclosure,
  displayOrder,
  ${OBS_GALLERY}
}`;

export const SITE_SETTINGS = `*[_type == "siteSettings" && _id == "siteSettings"][0]{
  ...,
  defaultSocialImage ${IMAGE_PROJECTION},
  featuredPlaces[]{
    _key,
    place->{ title, "slug": slug.current },
    image ${IMAGE_PROJECTION}
  },
  featuredImageStudies[]{
    _key,
    collection->{ title, "slug": slug.current, category },
    image ${IMAGE_PROJECTION}
  }
}`;

export const ABOUT_SETTINGS = `*[_type == "aboutSettings" && _id == "aboutSettings"][0]`;

export const BOOK_SETTINGS = `*[_type == "bookSettings" && _id == "bookSettings"][0]{
  ...,
  "pdfFileUrl": pdfFile.asset->url
}`;

const WRITING_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  subtitle,
  articleType,
  institution,
  year,
  summary,
  body,
  references,
  externalUrl,
  externalUrlLabel,
  externalUrlCredit,
  collaborators,
  showOnSite,
  featured
`;

/* Published, visible articles in Writing Order (weak refs resolve to null
   for drafts and are filtered out). */
export const PUBLISHED_WRITING = `*[_type == "writingOrder" && _id == "writingOrder"][0]{
  "articles": articles[]->{${WRITING_FIELDS}}
}`;
