/*
 * Shared project registry — single source of truth for website project
 * order, numbering, card images, sheet sequences, and metadata.
 * Consumers: LegacyWorkGrid, ProjectRooms, ProjectStage.
 * The PDF Portfolio Viewer does NOT use this module; the PDF itself
 * remains its source of truth.
 */
export interface MetaRow {
  k: string;
  v: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  cardMeta: string;
  desc: string;
  meta: MetaRow[];
  folder: string;
  sheets: string[];
}

const BASE = "/images/portfolio-pages";

export const PROJECTS: Project[] = [
  {
    id: "fluid",
    slug: "fluid-terrain",
    title: "Fluid Terrain",
    cardMeta: "2026 · Landscape Infrastructure",
    desc: "A porous gabion landscape built from recycled concrete that slows floodwater and supports seasonal habitation along the creek edge. Elevated structures and terraced ground adapt to shifting water levels across flood and drought cycles.",
    meta: [
      { k: "Period", v: "2026 Spring · Columbia GSAPP" },
      { k: "Location", v: "Santa Paula Creek, Ventura County, CA" },
      { k: "Program", v: "Hydrological landscape infrastructure" },
      { k: "Credits", v: "Individual · Instructor Marc Tsurumaki" },
    ],
    folder: "fluid-terrain",
    sheets: ["01-fluid-01.jpg", "01-fluid-02.jpg", "01-fluid-03.jpg", "01-fluid-04.jpg", "01-fluid-05.jpg"],
  },
  {
    id: "calibrated",
    slug: "calibrated-environment",
    title: "Calibrated Environment",
    cardMeta: "2026 · Mixed-Use Environmental Tower",
    desc: "A mixed-use tower organized through daylight analysis, thermal mapping, and occupancy-based program distribution. Environmental performance becomes the framework that calibrates massing, facade, and program across residential, retail, and public floors.",
    meta: [
      { k: "Period", v: "2026 Spring · Columbia GSAPP" },
      { k: "Location", v: "1227 Broadway, New York, NY" },
      { k: "Program", v: "Mixed-use environmental tower" },
      { k: "Credits", v: "Team project · Instructor Joseph A. Brennan" },
      { k: "Role", v: "Environmental analysis, iterative massing studies with Ladybug, facade studies, residential layouts, and Revit documentation." },
    ],
    folder: "calibrated-environment",
    sheets: ["02-calibrated-01.jpg", "02-calibrated-02.jpg", "02-calibrated-03.jpg"],
  },
  {
    id: "surreal",
    slug: "surreal-museum-tower",
    title: "Surreal Museum Tower",
    cardMeta: "2024 · Vertical Museum",
    desc: "A vertical museum inserted into the commercial spectacle of Times Square. Exhibition cubes stack into a non-linear sequence that shifts between compression and expansion, reality and dream.",
    meta: [
      { k: "Period", v: "2024 · Kookmin University graduate exhibition" },
      { k: "Location", v: "Times Square, New York, NY" },
      { k: "Program", v: "Vertical museum prototype" },
      { k: "Credits", v: "Individual · Sensory Museum honorable mention" },
    ],
    folder: "surreal-museum-tower",
    sheets: ["03-surreal-01.jpg", "03-surreal-02.jpg", "03-surreal-03.jpg"],
  },
  {
    id: "spectrum",
    slug: "spectrum-living",
    title: "Spectrum Living",
    cardMeta: "2023 · Collective Housing",
    desc: "Collective housing that links varied living environments through community bridges. Straight lines and circles organize a gradient from private rooms to shared ground, negotiating privacy and exchange across generations.",
    meta: [
      { k: "Period", v: "2023 · RMIT" },
      { k: "Location", v: "Melbourne, Australia" },
      { k: "Program", v: "Collective housing prototype" },
      { k: "Credits", v: "Individual" },
    ],
    folder: "spectrum-living",
    sheets: ["07-spectrum-01.jpg", "07-spectrum-02.jpg", "07-spectrum-03.jpg", "07-spectrum-04.jpg"],
  },
  {
    id: "shadow",
    slug: "shadow-archive",
    title: "Shadow Archive: Inverse Preserve",
    cardMeta: "2025 · Environmental Research Archive",
    desc: "A distributed archive in the tundra-boreal transition zone. Moving volumes cast fields of prolonged shade that stabilize thawing ground, turning shadow itself into a preservation strategy.",
    meta: [
      { k: "Period", v: "2025 Fall · Columbia GSAPP" },
      { k: "Location", v: "Churchill, Canada" },
      { k: "Program", v: "Environmental research archive" },
      { k: "Credits", v: "With Meng-Syun Sung · Instructor Leslie Gill" },
    ],
    folder: "shadow-archive",
    sheets: ["04-shadow-01.jpg", "04-shadow-02.jpg", "04-shadow-03.jpg", "04-shadow-04.jpg"],
  },
  {
    id: "ordinary",
    slug: "ordinary-village",
    title: "Ordinary Village: Hide and Seek",
    cardMeta: "2022 · Interactive Residential Village",
    desc: "An interactive residential village in Seoul that treats hide-and-seek as a spatial strategy, testing interaction, boundary, and variability across an adaptive domestic environment shared by a community.",
    meta: [
      { k: "Year", v: "2022" },
      { k: "Location", v: "Seoul, South Korea" },
      { k: "Type", v: "Interactive residential village" },
      { k: "Focus", v: "Adaptive domestic space" },
      { k: "Keywords", v: "Interaction · Boundary · Variability · Community" },
    ],
    folder: "ordinary-village",
    sheets: ["05-ordinary-01.jpg", "05-ordinary-02.jpg", "05-ordinary-03.jpg"],
  },
  {
    id: "ivanpah",
    slug: "ivanpah-solar-sanctuary",
    title: "Ivanpah Solar Sanctuary",
    cardMeta: "2025 · Ecological Energy Sanctuary",
    desc: "A minimal architectural intervention in the Mojave Desert that reconsiders solar infrastructure as a site of ecological coexistence, treating the desert as an inhabitant rather than an obstacle.",
    meta: [
      { k: "Year", v: "2025" },
      { k: "Location", v: "Ivanpah Desert, Mojave Desert, CA" },
      { k: "Type", v: "Ecological energy sanctuary" },
      { k: "Focus", v: "Minimal desert intervention" },
      { k: "Keywords", v: "Infrastructure · Coexistence · Ecology · Non-Human" },
    ],
    folder: "ivanpah-solar-sanctuary",
    sheets: ["06-ivanpah-01.jpg", "06-ivanpah-02.jpg"],
  },
];

export const pad = (n: number): string => String(n).padStart(2, "0");

export const sheetPath = (p: Project, file: string): string => `${BASE}/${p.folder}/${file}`;

export const cardImage = (p: Project): string => sheetPath(p, p.sheets[0]);

export const cardSecondary = (p: Project): string | undefined =>
  p.sheets[1] ? sheetPath(p, p.sheets[1]) : undefined;
