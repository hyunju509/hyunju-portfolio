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
