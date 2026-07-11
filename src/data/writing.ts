/*
 * Writing — editorial article registry. Single source of truth for the
 * /observations/writing index and every /observations/writing/[slug]
 * detail route.
 *
 * PROVISIONAL SCAFFOLDING: source documents for these articles live in
 * _writing-inbox/ (gitignored, read-only, user-authored PDFs/DOCX) and
 * were not present on disk when this registry was built. Per the user's
 * explicit choice, every `body` array below is placeholder text standing
 * in for the real essay content — title, subtitle, metadata, index
 * summary, and introduction paragraphs are the user's real, approved
 * copy and are final; only the section bodies and references are
 * provisional until the source files are supplied.
 */

export interface ArticleSection {
  number: string;
  heading: string;
  subheading?: string;
  body: string[];
}

export interface ExternalResearchLink {
  label: string;
  url: string;
  credit: string;
}

export interface Article {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  type: string;
  institution: string;
  year: string;
  summary: string;
  introduction: string[];
  sections: ArticleSection[];
  references?: string[];
  externalLink?: ExternalResearchLink;
  isProvisional: boolean;
}

const PROVISIONAL_NOTE =
  'This section is a provisional placeholder. The full text will replace this note once the source document is available.';

export const ARTICLES: Article[] = [
  {
    slug: 'the-invisible-layers',
    number: '01',
    title: 'The Invisible Layers',
    subtitle: 'From Ozone Recovery to Carbon Emissions',
    type: 'Interactive Data Research · Team Project',
    institution: 'Columbia GSAPP',
    year: '2025',
    summary:
      'An interactive study comparing the recovery of the ozone layer under coordinated global regulation with the expanding carbon footprint of data centers and AI infrastructure. The project asks how policy turns invisible atmospheric data into collective environmental action.',
    introduction: [
      'The atmosphere is largely invisible until data makes its transformation legible. The Invisible Layers compares two environmental trajectories shaped by very different systems of governance. The first follows the recovery of the ozone layer after the Montreal Protocol, demonstrating how scientific evidence, international cooperation, and enforceable regulation can reverse planetary damage. The second examines the growing energy and carbon footprint of data centers and AI infrastructure, whose environmental consequences are expanding without an equivalent regulatory framework.',
      'Through timelines, atmospheric datasets, spatial maps, and energy-use visualizations, the project treats data visualization as more than a representational tool. It becomes a way to compare environmental histories, expose hidden infrastructures, and ask how policy changes the future of the atmosphere.',
    ],
    sections: [
      { number: '01', heading: 'A Precedent for Collective Action', body: [PROVISIONAL_NOTE] },
      { number: '02', heading: 'Making Atmospheric Change Visible', body: [PROVISIONAL_NOTE] },
      { number: '03', heading: 'The Expanding Footprint of Digital Infrastructure', body: [PROVISIONAL_NOTE] },
      { number: '04', heading: 'Regulated and Unregulated Futures', body: [PROVISIONAL_NOTE] },
      { number: '05', heading: 'Policy as Environmental Design', body: [PROVISIONAL_NOTE] },
    ],
    externalLink: {
      label: 'View Interactive Research ↗',
      url: 'https://hyunju509.github.io/datavis_final/',
      credit: 'Team Project · The Green Team',
    },
    isProvisional: true,
  },
  {
    slug: 'when-buildings-stop-breathing',
    number: '02',
    title: 'When Buildings Stop Breathing',
    subtitle: 'Air Pollution and the Architecture of Atmosphere',
    type: 'Research Essay',
    institution: 'Columbia GSAPP',
    year: '2025',
    summary:
      'An essay tracing architecture’s relationship with air from environmental integration to mechanical isolation and atmospheric generation. Through the Hanok, Ant Farm’s Clean Air Pod, and the Mars Habitat, it asks what happens when breathing becomes an architectural responsibility.',
    introduction: [
      'Air was once treated as an ambient condition that architecture could invite, redirect, and inhabit. As pollution intensifies and buildings become increasingly sealed and mechanized, air is transformed into something that must be filtered, measured, circulated, and manufactured. Breathing is no longer simply a biological act. It becomes an architectural operation.',
      'This essay traces that transformation through three spatial models. The Hanok represents integration, using orientation, porous boundaries, courtyards, and seasonal airflow to live with the atmosphere. Ant Farm’s Clean Air Pod represents isolation, separating the body from polluted surroundings through a controlled breathing chamber. The Mars Habitat represents generation, producing an artificial atmosphere where none can be naturally sustained. Together, these cases reveal architecture’s movement from environmental mediator to life-support infrastructure.',
    ],
    sections: [
      { number: '01', heading: 'Air as Architecture', body: [PROVISIONAL_NOTE] },
      { number: '02', heading: 'Integration · Breathing with Nature', body: [PROVISIONAL_NOTE] },
      { number: '03', heading: 'Isolation · Breathing Against Nature', body: [PROVISIONAL_NOTE] },
      { number: '04', heading: 'Generation · Breathing Without Nature', body: [PROVISIONAL_NOTE] },
      { number: '05', heading: 'Architecture as a Breathing Technology', body: [PROVISIONAL_NOTE] },
    ],
    references: [],
    isProvisional: true,
  },
  {
    slug: 'from-form-to-symbol',
    number: '03',
    title: 'From Form to Symbol',
    subtitle: 'The Operative Shift in Learning from Las Vegas',
    type: 'Theory Essay',
    institution: 'Columbia GSAPP',
    year: '2025',
    summary:
      'A reading of Learning from Las Vegas as an operational system rather than a historical manifesto. The essay examines how environment, rhetoric, signs, and graphic form shift architectural value from spatial purity toward communication and circulated meaning.',
    introduction: [
      'Learning from Las Vegas did more than defend commercial imagery or challenge modernist taste. It changed the terms through which architecture could be observed, classified, and valued. Buildings were no longer understood primarily as autonomous spatial compositions. They became elements within a larger communicative field shaped by movement, visibility, signs, surfaces, and repetition.',
      'This essay reads the book as a working apparatus. Its photographs, classifications, diagrams, captions, and page layouts do not merely support the argument. They enact it. By treating the Las Vegas Strip as a laboratory of communication, the book shifts architectural attention from formal purity to the circulation of meaning. The result is a theory that performs through its own graphic and rhetorical structure.',
    ],
    sections: [
      { number: '01', heading: 'Las Vegas as a Laboratory', body: [PROVISIONAL_NOTE] },
      { number: '02', heading: 'The Rhetoric of Observation', body: [PROVISIONAL_NOTE] },
      { number: '03', heading: 'From Building to Sign', body: [PROVISIONAL_NOTE] },
      { number: '04', heading: 'The Decorated Shed as Method', body: [PROVISIONAL_NOTE] },
      { number: '05', heading: 'Theory that Performs Its Object', body: [PROVISIONAL_NOTE] },
    ],
    isProvisional: true,
  },
  {
    slug: 'feelback-loop',
    number: '04',
    title: 'Feelback Loop',
    subtitle: 'Sensing, Tuning, Feeling',
    type: 'Research Note',
    institution: 'Columbia GSAPP',
    year: '2025',
    summary:
      'A research note on responsive architecture and sensory calibration. It asks when sensing technologies can amplify attention and empathy, and when the same systems begin to flatten perception or quietly regulate behavior.',
    introduction: [
      'Responsive environments increasingly sense movement, temperature, attention, and emotion before occupants consciously register them. These systems promise comfort through continuous adjustment, but perfect calibration carries a contradiction. An environment that removes every disturbance may also reduce the differences through which perception remains alert.',
      'Feelback Loop examines responsive architecture as a reciprocal system rather than a one-way instrument of control. It asks whether sensing technologies can return information to occupants in ways that deepen attention, empathy, and environmental awareness. Through theories of visual homogeneity, responsive public interfaces, ecological sensing systems, and Ordinary Village, the essay considers how architecture might listen without becoming surveillance and respond without erasing uncertainty.',
    ],
    sections: [
      { number: '01', heading: 'The Flattening of Sensation', body: [PROVISIONAL_NOTE] },
      { number: '02', heading: 'Architecture that Looks Back', body: [PROVISIONAL_NOTE] },
      { number: '03', heading: 'Responsive Ecological Skins', body: [PROVISIONAL_NOTE] },
      { number: '04', heading: 'Ordinary Village', body: [PROVISIONAL_NOTE] },
      { number: '05', heading: 'Care or Control', body: [PROVISIONAL_NOTE] },
    ],
    isProvisional: true,
  },
  {
    slug: 'reading-new-york',
    number: '05',
    title: 'Reading New York',
    subtitle: 'Three Field Notes on Infrastructure, Neighborhood Change, and Public Life',
    type: 'Urban Field Notes',
    institution: 'Columbia GSAPP',
    year: '2025',
    summary:
      'Three field observations on neighborhood change, sanitation, and temporary public life in Greenpoint and Queens. Together, they examine how ordinary streets, infrastructures, and events reveal larger urban transitions.',
    introduction: [
      'Reading New York brings together three observations of spaces shaped less by singular architectural objects than by maintenance, infrastructure, movement, and collective use. Each field note begins with an ordinary urban condition and examines the systems that become visible through it.',
      'In Greenpoint, historic residential streets, new mobility infrastructure, and contemporary development reveal a neighborhood negotiating preservation and transformation. In Corona, waste storage, lighting, parking, and narrow sidewalks expose sanitation as a spatial design problem rather than an issue of individual behavior. At the Queens Night Market, an open lawn and temporary food stalls become an informal public room while also revealing limits in seating, circulation, and waste infrastructure.',
    ],
    sections: [
      { number: '01', heading: 'Greenpoint', subheading: 'Preservation and Transformation', body: [PROVISIONAL_NOTE] },
      { number: '02', heading: 'Corona', subheading: 'Sanitation as Spatial Infrastructure', body: [PROVISIONAL_NOTE] },
      { number: '03', heading: 'Queens Night Market', subheading: 'A Temporary Public Room', body: [PROVISIONAL_NOTE] },
    ],
    isProvisional: true,
  },
];

export const getArticleBySlug = (slug: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug);
