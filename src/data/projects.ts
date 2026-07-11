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

export interface Sheet {
  file: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  /* A = existing Selected Works, already live. B = More Work, appended below them. */
  tier: "A" | "B";
  cardMeta: string;
  desc: string;
  meta: MetaRow[];
  /* Present only on tier B projects — richer text not yet wired into any
     visible template (ProjectRooms, which reads `desc`, is currently
     unreachable from the live UI; kept for future use without guessing
     at new layout). */
  overview?: string[];
  keyContributions?: string[];
  recognition?: string;
  folder: string;
  /* Overrides BASE for projects served from the newer
     public/images/projects/ production pipeline. Existing tier A
     projects omit this and keep resolving against BASE unchanged. */
  base?: string;
  sheets: (string | Sheet)[];
  video?: {
    title: string;
    youtubeId: string;
    poster: string;
  };
}

const BASE = "/images/portfolio-pages";
/* Fallback intrinsic size for tier A sheets, which are plain filename
   strings without their own dimensions (all curated at this aspect ratio). */
const DEFAULT_SHEET_W = 1372;
const DEFAULT_SHEET_H = 896;

export const PROJECTS: Project[] = [
  {
    id: "fluid",
    slug: "fluid-terrain",
    title: "Fluid Terrain",
    tier: "A",
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
    tier: "A",
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
    tier: "A",
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
    tier: "A",
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
    tier: "A",
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
    tier: "A",
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
    tier: "A",
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
    video: {
      title: "Final Mirrors in the Desert",
      youtubeId: "fZWpxhrROCA",
      poster: "https://i.ytimg.com/vi/fZWpxhrROCA/hqdefault.jpg",
    },
  },

  /* ---- More Work (tier B) ---- */
  {
    id: "floating",
    slug: "floating-microhabitat",
    title: "Floating Microhabitat",
    tier: "B",
    cardMeta: "2025 · Floating Ecological Prototype",
    desc: "Floating Microhabitat is a modular habitat system designed for the tidal edge of Bushwick Inlet Park. Recycled cork, aluminum mesh, jute, marine rope, and oyster shells are assembled into buoyant units that connect planting beds above the water with sheltered aquatic habitats below.",
    meta: [
      { k: "Period", v: "2025 · Columbia GSAPP" },
      { k: "Location", v: "Bushwick Inlet Park, Brooklyn, NY" },
      { k: "Program", v: "Floating Ecological Prototype" },
      { k: "Material Logic", v: "Material Reuse · Habitat Restoration" },
      { k: "Credits", v: "Team project with Hee Leong Lim" },
    ],
    overview: [
      "Floating Microhabitat is a modular habitat system designed for the tidal edge of Bushwick Inlet Park. Recycled cork, aluminum mesh, jute, marine rope, and oyster shells are assembled into buoyant units that connect planting beds above the water with sheltered aquatic habitats below.",
      "The project operates simultaneously as a pollinator garden, floating nursery, and artificial reef. Modules can cluster and expand according to shoreline conditions while supporting ecological monitoring, public education, and community stewardship.",
    ],
    keyContributions: [
      "Developed a layered module combining upland planting, buoyant cork chambers, and suspended oyster-shell habitats.",
      "Produced material assemblies, ecological sections, species studies, and modular scalability diagrams.",
      "Fabricated and tested full-scale prototypes to evaluate buoyancy, balance, assembly, and waterfront deployment.",
    ],
    folder: "floating-microhabitat",
    base: "/images/projects",
    sheets: [
      { file: "floating-microhabitat_01.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_02.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_03.webp", width: 1441, height: 1081 },
      { file: "floating-microhabitat_04.webp", width: 1440, height: 1080 },
      { file: "floating-microhabitat_05.webp", width: 1440, height: 1080 },
      { file: "floating-microhabitat_06.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_07.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_08.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_09.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_10.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_11.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_12.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_13.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_14.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_15.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_16.webp", width: 1081, height: 1440 },
      { file: "floating-microhabitat_17.webp", width: 1600, height: 2400 },
      { file: "floating-microhabitat_18.webp", width: 1600, height: 2400 },
    ],
  },
  {
    id: "urchin",
    slug: "space-urchin",
    title: "Space Urchin",
    tier: "B",
    cardMeta: "2022 · Expandable Spaceport",
    desc: "Space Urchin proposes an expandable orbital spaceport inspired by the anatomy and collective growth of sea urchins. Rather than functioning as a completed object, the station develops through successive missions as independent modules, docking structures, and resource systems accumulate over time.",
    meta: [
      { k: "Period", v: "2022 · RMIT University" },
      { k: "Location", v: "Orbital Infrastructure" },
      { k: "Program", v: "Expandable Spaceport" },
      { k: "Material Logic", v: "Waste Recovery · Modular Growth" },
      { k: "Credits", v: "Team project" },
    ],
    overview: [
      "Space Urchin proposes an expandable orbital spaceport inspired by the anatomy and collective growth of sea urchins. Rather than functioning as a completed object, the station develops through successive missions as independent modules, docking structures, and resource systems accumulate over time.",
      "Its artificial skin integrates food, water, and energy infrastructure with autonomous systems that collect and repurpose orbital debris. Pneumatic frames expand the central anchor into workshops and docking zones, allowing the station to grow as a distributed interplanetary ecology.",
    ],
    keyContributions: [
      "Developed the spatial and ecological logic of an expandable starport assembled through successive missions.",
      "Investigated deployable frames, docking systems, resource infrastructure, and orbital-waste reuse.",
      "Produced sectional studies, system diagrams, cinematic visualizations, and speculative interior environments.",
    ],
    recognition: "Fondation Jacques Rougerie · Focus Prize · 2022",
    folder: "space-urchin",
    base: "/images/projects",
    sheets: [
      { file: "space-urchin_01.webp", width: 1771, height: 942 },
      { file: "space-urchin_02.webp", width: 1026, height: 1238 },
      { file: "space-urchin_03.webp", width: 2400, height: 1361 },
      { file: "space-urchin_04.webp", width: 2400, height: 1366 },
      { file: "space-urchin_05.webp", width: 2400, height: 1246 },
      { file: "space-urchin_06.webp", width: 2400, height: 1325 },
      { file: "space-urchin_07.webp", width: 2400, height: 1317 },
      { file: "space-urchin_08.webp", width: 2400, height: 1349 },
      { file: "space-urchin_09.webp", width: 2400, height: 1311 },
      { file: "space-urchin_10.webp", width: 2400, height: 1310 },
      { file: "space-urchin_11.webp", width: 2400, height: 1292 },
      { file: "space-urchin_12.webp", width: 2400, height: 1311 },
      { file: "space-urchin_13.webp", width: 2400, height: 1311 },
      { file: "space-urchin_14.webp", width: 2400, height: 1301 },
      { file: "space-urchin_15.webp", width: 2400, height: 1323 },
      { file: "space-urchin_16.webp", width: 744, height: 482 },
      { file: "space-urchin_17.webp", width: 550, height: 478 },
      { file: "space-urchin_18.webp", width: 516, height: 1280 },
      { file: "space-urchin_19.webp", width: 1348, height: 702 },
      { file: "space-urchin_20.webp", width: 818, height: 548 },
      { file: "space-urchin_21.webp", width: 544, height: 472 },
      { file: "space-urchin_22.webp", width: 518, height: 512 },
      { file: "space-urchin_23.webp", width: 1082, height: 1398 },
      { file: "space-urchin_24.webp", width: 1084, height: 1398 },
      { file: "space-urchin_25.webp", width: 1178, height: 1352 },
      { file: "space-urchin_26.webp", width: 1172, height: 1462 },
      { file: "space-urchin_27.webp", width: 964, height: 1238 },
    ],
  },
  {
    id: "terroir",
    slug: "terroir-hot-springs",
    title: "Terroir Hot Springs",
    tier: "B",
    cardMeta: "2022 · Sensory Retreat Resort",
    desc: "Terroir Hot Springs reconstructs Kazuyo Sejima’s Villa in the Forest through the collision of a winery, hot spring, and retreat. Rather than separating these programs through fixed boundaries, the project overlaps production, bathing, hospitality, and landscape to generate layered sensory relationships.",
    meta: [
      { k: "Period", v: "2022 Second Semester · RMIT University" },
      { k: "Location", v: "Nagano, Japan" },
      { k: "Program", v: "Sensory Retreat Resort" },
      { k: "Material Logic", v: "Contrasting Spatial Framework" },
      { k: "Credits", v: "Individual · Instructor Jan van Schaik" },
      { k: "Keywords", v: "Collision · Sensory Experience · Hospitality · Contrast" },
    ],
    overview: [
      "Terroir Hot Springs reconstructs Kazuyo Sejima’s Villa in the Forest through the collision of a winery, hot spring, and retreat. Rather than separating these programs through fixed boundaries, the project overlaps production, bathing, hospitality, and landscape to generate layered sensory relationships.",
      "The winery is organized around active processes of production, fermentation, storage, tasting, and movement. The hot spring creates slower sequences of bathing, steam, rest, and thermal immersion. Their intersections produce spatial conditions in which contrasting temperatures, sounds, movements, and forms of occupation become simultaneously visible.",
    ],
    keyContributions: [
      "Organized winery production, thermal bathing, hospitality, and accommodation as an interlocking sectional sequence.",
      "Used programmatic collision to generate contrasting sensory conditions of movement, temperature, sound, and occupation.",
      "Produced plans, sections, spatial-sequence studies, and environmental visualizations of the combined retreat.",
    ],
    folder: "terroir-hot-springs",
    base: "/images/projects",
    sheets: [
      { file: "terroir-hot-springs_01.webp", width: 2400, height: 1350 },
      { file: "terroir-hot-springs_02.webp", width: 2400, height: 991 },
      { file: "terroir-hot-springs_03.webp", width: 893, height: 629 },
    ],
  },
  {
    id: "playful",
    slug: "playful-layers",
    title: "Playful Layers",
    tier: "B",
    cardMeta: "2020 · Kindergarten Prototype",
    desc: "Playful Layers is a kindergarten organized through overlapping gable volumes of different scales. The resulting corridors, voids, niches, and hidden rooms respond to children’s bodies and movements while encouraging spaces to be interpreted beyond a single assigned function.",
    meta: [
      { k: "Period", v: "2020 Second Semester · Kookmin University" },
      { k: "Location", v: "Seoul, South Korea" },
      { k: "Program", v: "Kindergarten Prototype" },
      { k: "Material Logic", v: "Layered Void System" },
      { k: "Credits", v: "Individual · Instructor Jiwoon Choi" },
      { k: "Keywords", v: "Play · Imagination · Layering · Childhood" },
    ],
    overview: [
      "Playful Layers is a kindergarten organized through overlapping gable volumes of different scales. The resulting corridors, voids, niches, and hidden rooms respond to children’s bodies and movements while encouraging spaces to be interpreted beyond a single assigned function.",
      "Rather than prescribing fixed activities, the project creates a layered environment in which circulation can become play, a narrow void can become a hideout, and an overlap between volumes can become a place for discovery. Architecture operates as an open framework for imagination, movement, and child-led occupation.",
    ],
    keyContributions: [
      "Developed a spatial system through the overlap of gable volumes at multiple scales.",
      "Studied how child-scaled voids could support circulation, play, hiding, and informal learning.",
      "Produced diagrams, plans, sections, model studies, and visualizations of layered spatial conditions.",
    ],
    folder: "playful-layers",
    base: "/images/projects",
    sheets: [
      { file: "playful-layers_01.webp", width: 2400, height: 1350 },
    ],
  },
  {
    id: "hora",
    slug: "hora-museum",
    title: "Hora Museum",
    tier: "B",
    cardMeta: "2021 · Adaptive-Reuse Museum",
    desc: "Hora Museum transforms an existing building into an architectural museum organized around the experience of time. The project distinguishes between long-term traces embedded in the structure and shorter temporal changes produced by movement, daylight, season, and shifting viewpoints.",
    meta: [
      { k: "Period", v: "2021 Second Semester · Kookmin University" },
      { k: "Location", v: "Seoul, South Korea" },
      { k: "Program", v: "Adaptive-Reuse Museum" },
      { k: "Material Logic", v: "Time · Spatial Sequence" },
      { k: "Credits", v: "Individual · Instructor Joonghui Kim" },
    ],
    overview: [
      "Hora Museum transforms an existing building into an architectural museum organized around the experience of time. The project distinguishes between long-term traces embedded in the structure and shorter temporal changes produced by movement, daylight, season, and shifting viewpoints.",
      "New circulation, exhibition rooms, terraces, and sectional openings are inserted around retained architectural fragments. As visitors move through the building, old and new elements overlap to produce changing relationships between material history, light, and occupation.",
    ],
    keyContributions: [
      "Developed an adaptive-reuse strategy that treats existing architectural traces as exhibition material.",
      "Organized circulation and galleries through a continuous sectional sequence.",
      "Studied how daylight, viewpoint, and seasonal change alter the perception of retained and inserted elements.",
    ],
    folder: "hora-museum",
    base: "/images/projects",
    sheets: [
      { file: "hora-museum_01.webp", width: 1696, height: 2400 },
      { file: "hora-museum_02.webp", width: 1696, height: 2400 },
      { file: "hora-museum_03.webp", width: 1696, height: 2400 },
      { file: "hora-museum_04.webp", width: 1696, height: 2400 },
      { file: "hora-museum_05.webp", width: 2000, height: 1125 },
      { file: "hora-museum_06.webp", width: 2124, height: 777 },
      { file: "hora-museum_07.webp", width: 2400, height: 1179 },
      { file: "hora-museum_08.webp", width: 2400, height: 1294 },
      { file: "hora-museum_09.webp", width: 1600, height: 900 },
      { file: "hora-museum_10.webp", width: 2000, height: 1125 },
      { file: "hora-museum_11.webp", width: 2000, height: 1125 },
      { file: "hora-museum_12.webp", width: 2000, height: 1125 },
      { file: "hora-museum_13.webp", width: 2000, height: 1125 },
      { file: "hora-museum_14.webp", width: 2000, height: 1125 },
      { file: "hora-museum_15.webp", width: 2000, height: 1125 },
      { file: "hora-museum_16.webp", width: 1696, height: 2400 },
      { file: "hora-museum_17.webp", width: 1696, height: 2400 },
      { file: "hora-museum_18.webp", width: 1696, height: 2400 },
      { file: "hora-museum_19.webp", width: 1696, height: 2400 },
      { file: "hora-museum_20.webp", width: 2000, height: 1125 },
      { file: "hora-museum_21.webp", width: 2400, height: 1350 },
      { file: "hora-museum_22.webp", width: 1696, height: 2400 },
      { file: "hora-museum_23.webp", width: 1696, height: 2400 },
      { file: "hora-museum_24.webp", width: 1696, height: 2400 },
    ],
  },
  {
    id: "threshold",
    slug: "threshold-housing",
    title: "Threshold Housing",
    tier: "B",
    cardMeta: "2021 · Urban Co-Housing",
    desc: "Threshold Housing is a co-living proposal for young residents that mediates between a public urban edge and a quieter landscape boundary. Rather than separating public and private programs abruptly, the project organizes them through a gradual sequence of exterior rooms, shared workspaces, terraces, residential units, and planted thresholds.",
    meta: [
      { k: "Period", v: "2021 Second Semester · Kookmin University" },
      { k: "Location", v: "Seoul, South Korea" },
      { k: "Program", v: "Urban Co-Housing" },
      { k: "Material Logic", v: "Public-to-Private Gradients" },
      { k: "Credits", v: "Individual · Instructor Joonghui Kim" },
    ],
    overview: [
      "Threshold Housing is a co-living proposal for young residents that mediates between a public urban edge and a quieter landscape boundary. Rather than separating public and private programs abruptly, the project organizes them through a gradual sequence of exterior rooms, shared workspaces, terraces, residential units, and planted thresholds.",
      "Changes in level, building depth, and orientation establish different degrees of access and privacy. Shared SOHO spaces and communal programs connect individual units while maintaining distinct domestic zones.",
    ],
    keyContributions: [
      "Translated site topography and surrounding public-private conditions into a stepped sectional organization.",
      "Developed shared SOHO spaces, terraces, and communal programs as thresholds between the city and private units.",
      "Produced massing studies, program diagrams, plans, sections, and residential visualizations.",
    ],
    folder: "threshold-housing",
    base: "/images/projects",
    sheets: [
      { file: "threshold-housing_01.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_02.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_03.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_04.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_05.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_06.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_07.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_08.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_09.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_10.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_11.webp", width: 2400, height: 1350 },
      { file: "threshold-housing_12.webp", width: 2400, height: 1350 },
    ],
  },
  {
    id: "wschool",
    slug: "w-school",
    title: "W-School",
    tier: "B",
    cardMeta: "2021 · Terraced Middle School",
    desc: "W-School adapts a middle school to a steep urban site by extending the landscape across a sequence of accessible roofs, terraces, courts, and stepped outdoor rooms. The campus operates as a small hillside village in which circulation and open space connect different elevations and academic programs.",
    meta: [
      { k: "Period", v: "2021 First Semester · Kookmin University" },
      { k: "Location", v: "Seoul, South Korea" },
      { k: "Program", v: "Terraced Middle School" },
      { k: "Material Logic", v: "Community Campus · Layered Ground" },
      { k: "Credits", v: "Individual · Instructor Seongbeom Mo" },
    ],
    overview: [
      "W-School adapts a middle school to a steep urban site by extending the landscape across a sequence of accessible roofs, terraces, courts, and stepped outdoor rooms. The campus operates as a small hillside village in which circulation and open space connect different elevations and academic programs.",
      "Community facilities, including the library and gymnasium, are positioned along publicly accessible lower levels, while classrooms and student spaces occupy more protected areas. The layered ground separates users without isolating the school from its neighborhood.",
    ],
    keyContributions: [
      "Used the site’s elevation changes to create multiple entrances and continuous outdoor circulation.",
      "Integrated community-accessible library and sports facilities with protected student zones.",
      "Developed a terraced campus through site analysis, massing, plans, sections, and landscape-oriented roof studies.",
    ],
    folder: "w-school",
    base: "/images/projects",
    sheets: [
      { file: "w-school_01.webp", width: 2400, height: 1697 },
      { file: "w-school_02.webp", width: 2400, height: 1697 },
      { file: "w-school_03.webp", width: 2400, height: 1698 },
      { file: "w-school_04.webp", width: 2400, height: 1697 },
      { file: "w-school_05.webp", width: 2400, height: 1350 },
      { file: "w-school_06.webp", width: 2400, height: 1697 },
      { file: "w-school_07.webp", width: 1697, height: 2400 },
      { file: "w-school_08.webp", width: 2400, height: 1698 },
      { file: "w-school_09.webp", width: 2400, height: 1697 },
      { file: "w-school_10.webp", width: 2400, height: 1697 },
      { file: "w-school_11.webp", width: 2400, height: 1359 },
      { file: "w-school_12.webp", width: 2400, height: 1697 },
      { file: "w-school_13.webp", width: 2400, height: 1697 },
      { file: "w-school_14.webp", width: 2400, height: 1697 },
      { file: "w-school_15.webp", width: 2400, height: 1697 },
      { file: "w-school_16.webp", width: 2400, height: 1698 },
      { file: "w-school_17.webp", width: 2400, height: 1697 },
      { file: "w-school_18.webp", width: 2400, height: 1697 },
      { file: "w-school_19.webp", width: 2400, height: 1697 },
      { file: "w-school_20.webp", width: 2400, height: 1697 },
      { file: "w-school_21.webp", width: 2400, height: 1698 },
      { file: "w-school_22.webp", width: 2400, height: 1697 },
      { file: "w-school_23.webp", width: 2400, height: 1697 },
      { file: "w-school_24.webp", width: 2400, height: 1352 },
      { file: "w-school_25.webp", width: 2400, height: 1697 },
      { file: "w-school_26.webp", width: 2400, height: 1697 },
      { file: "w-school_27.webp", width: 2400, height: 1697 },
      { file: "w-school_28.webp", width: 2400, height: 1697 },
      { file: "w-school_29.webp", width: 2400, height: 1697 },
      { file: "w-school_30.webp", width: 2400, height: 1697 },
      { file: "w-school_31.webp", width: 2400, height: 1697 },
      { file: "w-school_32.webp", width: 2400, height: 1697 },
      { file: "w-school_33.webp", width: 2400, height: 1697 },
    ],
  },
  {
    id: "sejong",
    slug: "sejong-smart-school",
    title: "Sejong Smart School",
    tier: "B",
    cardMeta: "2020 · Smart School Campus",
    desc: "Sejong Smart School proposes a distributed campus organized through multiple interpretations of the word “block.” Independent buildings for learning, science, community programs, and green space can operate separately during school hours and connect as shared civic infrastructure outside the academic schedule.",
    meta: [
      { k: "Period", v: "2020" },
      { k: "Location", v: "Sejong, South Korea" },
      { k: "Program", v: "Smart School Campus" },
      { k: "Material Logic", v: "Flexible Learning · Shared Infrastructure" },
      { k: "Credits", v: "Competition entry" },
    ],
    overview: [
      "Sejong Smart School proposes a distributed campus organized through multiple interpretations of the word “block.” Independent buildings for learning, science, community programs, and green space can operate separately during school hours and connect as shared civic infrastructure outside the academic schedule.",
      "Flexible classrooms can be rearranged, subdivided, or opened according to different learning formats. Separate entrances and circulation systems allow public programs to remain accessible while protecting student areas during the school day.",
    ],
    keyContributions: [
      "Organized the campus into connected buildings with distinct academic and community functions.",
      "Developed flexible learning spaces that can expand, divide, and adapt to changing class formats.",
      "Proposed a digital platform for space reservations, energy tracking, and shared civic programs.",
    ],
    recognition: "Sejong National Pilot Smart City Design Competition · 5th Prize",
    folder: "sejong-smart-school",
    base: "/images/projects",
    sheets: [
      { file: "sejong-smart-school_01.webp", width: 2400, height: 1352 },
      { file: "sejong-smart-school_02.webp", width: 2400, height: 1349 },
      { file: "sejong-smart-school_03.webp", width: 2400, height: 1350 },
      { file: "sejong-smart-school_04.webp", width: 2400, height: 1350 },
    ],
  },
];

export const pad = (n: number): string => String(n).padStart(2, "0");

const sheetFile = (s: string | Sheet): string => (typeof s === "string" ? s : s.file);

export const sheetDims = (s: string | Sheet): { width: number; height: number } =>
  typeof s === "string" ? { width: DEFAULT_SHEET_W, height: DEFAULT_SHEET_H } : { width: s.width, height: s.height };

export const sheetPath = (p: Project, s: string | Sheet): string =>
  `${p.base ?? BASE}/${p.folder}/${sheetFile(s)}`;

export const cardImage = (p: Project): string => sheetPath(p, p.sheets[0]);

export const cardSecondary = (p: Project): string | undefined =>
  p.sheets[1] ? sheetPath(p, p.sheets[1]) : undefined;
