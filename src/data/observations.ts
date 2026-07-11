/*
 * Observations — Places photography registry. Single source of truth for
 * location filters and the square gallery / full-image viewer.
 * Consumers: src/pages/observations.astro, src/scripts/observations-gallery.ts
 */
export interface ObservationImage {
  seq: number;
  thumb: string;
  full: string;
  width: number;
  height: number;
}

export interface ObservationLocation {
  slug: string;
  title: string;
  /* Optional region/country label for a future map connection — left
     unset until one is established from data the user provides, not
     guessed from the place name. */
  region?: string;
  imageCount: number;
  images: ObservationImage[];
}

export const OBSERVATION_LOCATIONS: ObservationLocation[] = [
  {
    slug: "japan",
    title: "Japan",
    imageCount: 41,
    images: [
      { seq: 1, thumb: "/images/observations/places/japan/thumbs/japan_01.webp", full: "/images/observations/places/japan/full/japan_01.webp", width: 1234, height: 2200 },
      { seq: 2, thumb: "/images/observations/places/japan/thumbs/japan_02.webp", full: "/images/observations/places/japan/full/japan_02.webp", width: 2200, height: 1234 },
      { seq: 3, thumb: "/images/observations/places/japan/thumbs/japan_03.webp", full: "/images/observations/places/japan/full/japan_03.webp", width: 1235, height: 2200 },
      { seq: 4, thumb: "/images/observations/places/japan/thumbs/japan_04.webp", full: "/images/observations/places/japan/full/japan_04.webp", width: 2200, height: 1234 },
      { seq: 5, thumb: "/images/observations/places/japan/thumbs/japan_05.webp", full: "/images/observations/places/japan/full/japan_05.webp", width: 2048, height: 3648 },
      { seq: 6, thumb: "/images/observations/places/japan/thumbs/japan_06.webp", full: "/images/observations/places/japan/full/japan_06.webp", width: 1233, height: 2200 },
      { seq: 7, thumb: "/images/observations/places/japan/thumbs/japan_07.webp", full: "/images/observations/places/japan/full/japan_07.webp", width: 1234, height: 2200 },
      { seq: 8, thumb: "/images/observations/places/japan/thumbs/japan_08.webp", full: "/images/observations/places/japan/full/japan_08.webp", width: 2200, height: 1233 },
      { seq: 9, thumb: "/images/observations/places/japan/thumbs/japan_09.webp", full: "/images/observations/places/japan/full/japan_09.webp", width: 2200, height: 1235 },
      { seq: 10, thumb: "/images/observations/places/japan/thumbs/japan_10.webp", full: "/images/observations/places/japan/full/japan_10.webp", width: 1234, height: 2200 },
      { seq: 11, thumb: "/images/observations/places/japan/thumbs/japan_11.webp", full: "/images/observations/places/japan/full/japan_11.webp", width: 2200, height: 1223 },
      { seq: 12, thumb: "/images/observations/places/japan/thumbs/japan_12.webp", full: "/images/observations/places/japan/full/japan_12.webp", width: 1235, height: 2200 },
      { seq: 13, thumb: "/images/observations/places/japan/thumbs/japan_13.webp", full: "/images/observations/places/japan/full/japan_13.webp", width: 2200, height: 1235 },
      { seq: 14, thumb: "/images/observations/places/japan/thumbs/japan_14.webp", full: "/images/observations/places/japan/full/japan_14.webp", width: 1236, height: 2200 },
      { seq: 15, thumb: "/images/observations/places/japan/thumbs/japan_15.webp", full: "/images/observations/places/japan/full/japan_15.webp", width: 2200, height: 1235 },
      { seq: 16, thumb: "/images/observations/places/japan/thumbs/japan_16.webp", full: "/images/observations/places/japan/full/japan_16.webp", width: 2200, height: 1230 },
      { seq: 17, thumb: "/images/observations/places/japan/thumbs/japan_17.webp", full: "/images/observations/places/japan/full/japan_17.webp", width: 1235, height: 2200 },
      { seq: 18, thumb: "/images/observations/places/japan/thumbs/japan_18.webp", full: "/images/observations/places/japan/full/japan_18.webp", width: 1235, height: 2200 },
      { seq: 19, thumb: "/images/observations/places/japan/thumbs/japan_19.webp", full: "/images/observations/places/japan/full/japan_19.webp", width: 2200, height: 1233 },
      { seq: 20, thumb: "/images/observations/places/japan/thumbs/japan_20.webp", full: "/images/observations/places/japan/full/japan_20.webp", width: 1234, height: 2200 },
      { seq: 21, thumb: "/images/observations/places/japan/thumbs/japan_21.webp", full: "/images/observations/places/japan/full/japan_21.webp", width: 2048, height: 3648 },
      { seq: 22, thumb: "/images/observations/places/japan/thumbs/japan_22.webp", full: "/images/observations/places/japan/full/japan_22.webp", width: 2048, height: 3648 },
      { seq: 23, thumb: "/images/observations/places/japan/thumbs/japan_23.webp", full: "/images/observations/places/japan/full/japan_23.webp", width: 2200, height: 1235 },
      { seq: 24, thumb: "/images/observations/places/japan/thumbs/japan_24.webp", full: "/images/observations/places/japan/full/japan_24.webp", width: 2048, height: 3648 },
      { seq: 25, thumb: "/images/observations/places/japan/thumbs/japan_25.webp", full: "/images/observations/places/japan/full/japan_25.webp", width: 2048, height: 3648 },
      { seq: 26, thumb: "/images/observations/places/japan/thumbs/japan_26.webp", full: "/images/observations/places/japan/full/japan_26.webp", width: 2048, height: 3648 },
      { seq: 27, thumb: "/images/observations/places/japan/thumbs/japan_27.webp", full: "/images/observations/places/japan/full/japan_27.webp", width: 2048, height: 3648 },
      { seq: 28, thumb: "/images/observations/places/japan/thumbs/japan_28.webp", full: "/images/observations/places/japan/full/japan_28.webp", width: 2200, height: 1235 },
      { seq: 29, thumb: "/images/observations/places/japan/thumbs/japan_29.webp", full: "/images/observations/places/japan/full/japan_29.webp", width: 2048, height: 3648 },
      { seq: 30, thumb: "/images/observations/places/japan/thumbs/japan_30.webp", full: "/images/observations/places/japan/full/japan_30.webp", width: 2048, height: 3648 },
      { seq: 31, thumb: "/images/observations/places/japan/thumbs/japan_31.webp", full: "/images/observations/places/japan/full/japan_31.webp", width: 2048, height: 3648 },
      { seq: 32, thumb: "/images/observations/places/japan/thumbs/japan_32.webp", full: "/images/observations/places/japan/full/japan_32.webp", width: 2200, height: 1235 },
      { seq: 33, thumb: "/images/observations/places/japan/thumbs/japan_33.webp", full: "/images/observations/places/japan/full/japan_33.webp", width: 2048, height: 3648 },
      { seq: 34, thumb: "/images/observations/places/japan/thumbs/japan_34.webp", full: "/images/observations/places/japan/full/japan_34.webp", width: 2048, height: 3648 },
      { seq: 35, thumb: "/images/observations/places/japan/thumbs/japan_35.webp", full: "/images/observations/places/japan/full/japan_35.webp", width: 1235, height: 2200 },
      { seq: 36, thumb: "/images/observations/places/japan/thumbs/japan_36.webp", full: "/images/observations/places/japan/full/japan_36.webp", width: 1235, height: 2200 },
      { seq: 37, thumb: "/images/observations/places/japan/thumbs/japan_37.webp", full: "/images/observations/places/japan/full/japan_37.webp", width: 2048, height: 3648 },
      { seq: 38, thumb: "/images/observations/places/japan/thumbs/japan_38.webp", full: "/images/observations/places/japan/full/japan_38.webp", width: 1235, height: 2200 },
      { seq: 39, thumb: "/images/observations/places/japan/thumbs/japan_39.webp", full: "/images/observations/places/japan/full/japan_39.webp", width: 2048, height: 3648 },
      { seq: 40, thumb: "/images/observations/places/japan/thumbs/japan_40.webp", full: "/images/observations/places/japan/full/japan_40.webp", width: 2200, height: 1235 },
      { seq: 41, thumb: "/images/observations/places/japan/thumbs/japan_41.webp", full: "/images/observations/places/japan/full/japan_41.webp", width: 2200, height: 1235 },
    ],
  },
  {
    slug: "jeju",
    title: "Jeju",
    imageCount: 0,
    images: [
    ],
  },
  {
    slug: "los-angeles",
    title: "Los Angeles",
    imageCount: 12,
    images: [
      { seq: 1, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_01.webp", full: "/images/observations/places/los-angeles/full/los-angeles_01.webp", width: 1467, height: 2200 },
      { seq: 2, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_02.webp", full: "/images/observations/places/los-angeles/full/los-angeles_02.webp", width: 1467, height: 2200 },
      { seq: 3, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_03.webp", full: "/images/observations/places/los-angeles/full/los-angeles_03.webp", width: 1467, height: 2200 },
      { seq: 4, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_04.webp", full: "/images/observations/places/los-angeles/full/los-angeles_04.webp", width: 2200, height: 3300 },
      { seq: 5, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_05.webp", full: "/images/observations/places/los-angeles/full/los-angeles_05.webp", width: 2200, height: 3300 },
      { seq: 6, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_06.webp", full: "/images/observations/places/los-angeles/full/los-angeles_06.webp", width: 1467, height: 2200 },
      { seq: 7, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_07.webp", full: "/images/observations/places/los-angeles/full/los-angeles_07.webp", width: 2200, height: 1467 },
      { seq: 8, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_08.webp", full: "/images/observations/places/los-angeles/full/los-angeles_08.webp", width: 1466, height: 2200 },
      { seq: 9, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_09.webp", full: "/images/observations/places/los-angeles/full/los-angeles_09.webp", width: 1467, height: 2200 },
      { seq: 10, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_10.webp", full: "/images/observations/places/los-angeles/full/los-angeles_10.webp", width: 1467, height: 2200 },
      { seq: 11, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_11.webp", full: "/images/observations/places/los-angeles/full/los-angeles_11.webp", width: 1466, height: 2200 },
      { seq: 12, thumb: "/images/observations/places/los-angeles/thumbs/los-angeles_12.webp", full: "/images/observations/places/los-angeles/full/los-angeles_12.webp", width: 2200, height: 3300 },
    ],
  },
  {
    slug: "las-vegas",
    title: "Las Vegas",
    imageCount: 16,
    images: [
      { seq: 1, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_01.webp", full: "/images/observations/places/las-vegas/full/las-vegas_01.webp", width: 2200, height: 1467 },
      { seq: 2, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_02.webp", full: "/images/observations/places/las-vegas/full/las-vegas_02.webp", width: 2200, height: 1467 },
      { seq: 3, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_03.webp", full: "/images/observations/places/las-vegas/full/las-vegas_03.webp", width: 1467, height: 2200 },
      { seq: 4, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_04.webp", full: "/images/observations/places/las-vegas/full/las-vegas_04.webp", width: 2200, height: 3300 },
      { seq: 5, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_05.webp", full: "/images/observations/places/las-vegas/full/las-vegas_05.webp", width: 2200, height: 3300 },
      { seq: 6, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_06.webp", full: "/images/observations/places/las-vegas/full/las-vegas_06.webp", width: 2200, height: 3300 },
      { seq: 7, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_07.webp", full: "/images/observations/places/las-vegas/full/las-vegas_07.webp", width: 2200, height: 1467 },
      { seq: 8, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_08.webp", full: "/images/observations/places/las-vegas/full/las-vegas_08.webp", width: 2200, height: 3300 },
      { seq: 9, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_09.webp", full: "/images/observations/places/las-vegas/full/las-vegas_09.webp", width: 2200, height: 1467 },
      { seq: 10, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_10.webp", full: "/images/observations/places/las-vegas/full/las-vegas_10.webp", width: 2200, height: 3300 },
      { seq: 11, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_11.webp", full: "/images/observations/places/las-vegas/full/las-vegas_11.webp", width: 1466, height: 2200 },
      { seq: 12, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_12.webp", full: "/images/observations/places/las-vegas/full/las-vegas_12.webp", width: 2200, height: 1467 },
      { seq: 13, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_13.webp", full: "/images/observations/places/las-vegas/full/las-vegas_13.webp", width: 2200, height: 1467 },
      { seq: 14, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_14.webp", full: "/images/observations/places/las-vegas/full/las-vegas_14.webp", width: 2200, height: 1466 },
      { seq: 15, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_15.webp", full: "/images/observations/places/las-vegas/full/las-vegas_15.webp", width: 2200, height: 3300 },
      { seq: 16, thumb: "/images/observations/places/las-vegas/thumbs/las-vegas_16.webp", full: "/images/observations/places/las-vegas/full/las-vegas_16.webp", width: 2200, height: 1467 },
    ],
  },
  {
    slug: "melbourne",
    title: "Melbourne",
    imageCount: 0,
    images: [
    ],
  },
  {
    slug: "new-york",
    title: "New York",
    imageCount: 5,
    images: [
      { seq: 1, thumb: "/images/observations/places/new-york/thumbs/new-york_01.webp", full: "/images/observations/places/new-york/full/new-york_01.webp", width: 2200, height: 3300 },
      { seq: 2, thumb: "/images/observations/places/new-york/thumbs/new-york_02.webp", full: "/images/observations/places/new-york/full/new-york_02.webp", width: 2200, height: 1467 },
      { seq: 3, thumb: "/images/observations/places/new-york/thumbs/new-york_03.webp", full: "/images/observations/places/new-york/full/new-york_03.webp", width: 2200, height: 3300 },
      { seq: 4, thumb: "/images/observations/places/new-york/thumbs/new-york_04.webp", full: "/images/observations/places/new-york/full/new-york_04.webp", width: 2200, height: 3300 },
      { seq: 5, thumb: "/images/observations/places/new-york/thumbs/new-york_05.webp", full: "/images/observations/places/new-york/full/new-york_05.webp", width: 2200, height: 1467 },
    ],
  },
  {
    slug: "seoul",
    title: "Seoul",
    imageCount: 0,
    images: [
    ],
  },
  {
    slug: "singapore",
    title: "Singapore",
    imageCount: 0,
    images: [
    ],
  },
  {
    slug: "uluru",
    title: "Uluru",
    imageCount: 0,
    images: [
    ],
  },
];

export const ALL_LOCATIONS_LABEL = "All";
